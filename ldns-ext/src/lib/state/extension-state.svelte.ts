import type {
  DnsData,
  ParsedRdapData,
  EmailData,
  DnsEndpoint,
  ToolState,
  RecentSearch,
  Theme,
  ServerAnalysis,
  SubdomainResult,
  Settings,
  DkimResult,
  AsnInfo
} from '@ldns/core/types';
import { queryDns } from '@ldns/core/dns-query';
import { queryRdap } from '@ldns/core/rdap-query';
import { queryEmailRecords } from '@ldns/core/email-query';
import {
  isValidDomain,
  parseDomain,
  getRootDomain,
  extractDomainFromUrl
} from '@ldns/core/domain-parser';
import { DEFAULT_RECORD_TYPES } from '@ldns/core/constants';
import { analyzeServer } from '@ldns/core/server-info';
import { queryAllProviders, type PropagationData } from '@ldns/core/dns-propagation';
import { discoverSubdomains } from '@ldns/core/subdomain-query';
import { queryDkim } from '@ldns/core/dkim-query';
import { evaluateSpf, type SpfEvaluation } from '@ldns/core/spf-eval';
import { checkDnssec, type DnssecCheck } from '@ldns/core/dnssec-check';
import { checkCaaAgainstIssuer, type CaaIssuerCheck } from '@ldns/core/caa-check';
import { fetchTlsCertificate } from '@ldns/core/tls-query';
import { lookupAsnBatch } from '@ldns/core/asn-query';
import {
  DEFAULT_SETTINGS,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  getEndpointPreference,
  setEndpointPreference,
  getThemePreference,
  setThemePreference,
  getSettings,
  setSettings,
  cacheGet,
  cacheSet
} from '$lib/utils/storage';
import { applySidePanelMode } from '$lib/utils/sidepanel';

export type TabName = 'dns' | 'rdap' | 'email' | 'server' | 'subdomains';

const idleState = <T>(): ToolState<T> => ({ loading: false, error: '', data: null, hasData: false });
const loadingState = <T>(): ToolState<T> => ({ loading: true, error: '', data: null, hasData: false });

class ExtensionState {
  domain = $state('');
  inputDomain = $state('');
  activeTab = $state<TabName>('dns');
  endpoint = $state<DnsEndpoint>('cloudflare');
  theme = $state<Theme>('system');
  systemPrefersDark = $state(true);
  useHttpForServer = $state(false);
  recentSearches = $state<RecentSearch[]>([]);

  // Resolved theme — what's actually applied. Tracks system preference when
  // `theme === 'system'`, otherwise mirrors the explicit choice.
  get resolvedTheme(): 'dark' | 'light' {
    if (this.theme === 'system') return this.systemPrefersDark ? 'dark' : 'light';
    return this.theme;
  }

  settings = $state<Settings>({ ...DEFAULT_SETTINGS });

  dnsState = $state<ToolState<DnsData>>(idleState());
  rdapState = $state<ToolState<ParsedRdapData>>(idleState());
  emailState = $state<ToolState<EmailData>>(idleState());
  serverState = $state<ToolState<ServerAnalysis>>(idleState());
  propagationState = $state<ToolState<PropagationData>>(idleState());
  subdomainState = $state<ToolState<SubdomainResult>>(idleState());
  dkimState = $state<ToolState<DkimResult>>(idleState());
  asnState = $state<ToolState<Record<string, AsnInfo>>>(idleState());
  spfEvalState = $state<ToolState<SpfEvaluation>>(idleState());
  dnssecState = $state<ToolState<DnssecCheck>>(idleState());
  caaCheckState = $state<ToolState<CaaIssuerCheck>>(idleState());

  propagationMode = $state(false);

  // AbortControllers — one per query type, so a new lookup cancels the previous.
  private aborters = new Map<string, AbortController>();

  get isValidDomain(): boolean {
    return isValidDomain(this.domain);
  }

  get parsedDomain() {
    return parseDomain(this.domain);
  }

  get rootDomain(): string {
    return getRootDomain(this.domain);
  }

  async init() {
    const [recents, endpoint, theme, settings] = await Promise.all([
      getRecentSearches(),
      getEndpointPreference(),
      getThemePreference(),
      getSettings()
    ]);
    this.recentSearches = recents;
    this.endpoint = endpoint;
    this.theme = theme;
    this.settings = settings;

    // Wire up system theme preference + live updates
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark = mq.matches;
      mq.addEventListener('change', (e) => {
        this.systemPrefersDark = e.matches;
        this.applyTheme();
      });
    }

    this.applyTheme();
    // Sync side-panel behavior with persisted setting on every load
    void applySidePanelMode(settings.sidePanelMode);
  }

  private applyTheme() {
    const t = this.resolvedTheme;
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.classList.toggle('light', t === 'light');
  }

  async setTheme(theme: Theme) {
    this.theme = theme;
    await setThemePreference(theme);
    this.applyTheme();
  }

  /**
   * Cycle the theme: system → light → dark → system.
   * Kept as `toggleTheme` for backwards compatibility with the header button.
   */
  async toggleTheme() {
    const next: Theme = this.theme === 'system' ? 'light' : this.theme === 'light' ? 'dark' : 'system';
    await this.setTheme(next);
  }

  async updateSettings(patch: Partial<Settings>) {
    this.settings = { ...this.settings, ...patch };
    await setSettings(this.settings);
    if ('sidePanelMode' in patch) {
      await applySidePanelMode(this.settings.sidePanelMode);
    }
  }

  private looksLikeUrl(input: string): boolean {
    return input.includes('://') || input.includes('/') || input.includes('?');
  }

  async setDomain(input: string, performLookup = false) {
    let domain = input.toLowerCase().trim().replace(/\.$/, '');
    if (this.looksLikeUrl(input) || (!isValidDomain(domain) && extractDomainFromUrl(input))) {
      // Full URLs, but also `host:port` / `host?query` forms that aren't
      // themselves valid domains — extract the hostname.
      const host = extractDomainFromUrl(input);
      if (host) domain = host.toLowerCase().replace(/\.$/, '');
    }
    this.domain = domain;
    this.inputDomain = domain;
    if (performLookup && this.isValidDomain) {
      await this.performLookup();
    }
  }

  async setEndpoint(endpoint: DnsEndpoint) {
    this.endpoint = endpoint;
    await setEndpointPreference(endpoint);
  }

  setActiveTab(tab: TabName) {
    this.activeTab = tab;
  }

  /**
   * Generic query runner: handles loading/error/data state, cancellation,
   * and short-lived in-memory caching. Aborts any prior in-flight query of
   * the same key; the signal is threaded into the core query functions so
   * cancellation reaches the network. `force` bypasses the cache read (the
   * Refresh buttons) while still caching the fresh result.
   */
  private async run<T>(
    key: string,
    fn: (signal: AbortSignal) => Promise<T>,
    setter: (next: ToolState<T>) => void,
    options: { cacheTtlMs?: number; cacheKey?: string; force?: boolean } = {}
  ): Promise<void> {
    // Cancel previous
    this.aborters.get(key)?.abort();
    this.aborters.delete(key);

    // In-memory cache check
    if (options.cacheKey && options.cacheTtlMs && !options.force) {
      const cached = cacheGet<T>(options.cacheKey, options.cacheTtlMs);
      if (cached) {
        setter({ loading: false, error: '', data: cached, hasData: true });
        return;
      }
    }

    const controller = new AbortController();
    this.aborters.set(key, controller);

    setter(loadingState<T>());
    try {
      const data = await fn(controller.signal);
      if (controller.signal.aborted) return;
      setter({ loading: false, error: '', data, hasData: true });
      if (options.cacheKey) cacheSet(options.cacheKey, data);
    } catch (error) {
      if (controller.signal.aborted) return;
      setter({
        loading: false,
        error: error instanceof Error ? error.message : `${key} query failed`,
        data: null,
        hasData: false
      });
    } finally {
      if (this.aborters.get(key) === controller) this.aborters.delete(key);
    }
  }

  cancelAll() {
    for (const c of this.aborters.values()) c.abort();
    this.aborters.clear();
  }

  async performLookup() {
    if (!this.isValidDomain) return;
    const lookupDomain = this.domain;

    await addRecentSearch(this.domain);
    this.recentSearches = await getRecentSearches();

    // Reset transient state for new domain
    this.propagationState = idleState();
    this.subdomainState = idleState();
    this.dkimState = idleState();
    this.asnState = idleState();
    this.spfEvalState = idleState();
    this.dnssecState = idleState();
    this.caaCheckState = idleState();

    const queries: Promise<void>[] = [
      // ASN depends on DNS results, so chain it — guarded against a newer
      // lookup having superseded this one by the time DNS lands.
      this.queryDns().then(() => {
        if (this.domain !== lookupDomain) return;
        this.queryAsn();
        this.queryCaaCheck();
      }),
      this.queryRdap(),
      this.queryDnssec(),
      this.queryEmail(),
      this.querySpfEval(),
      this.queryDkim(),
      this.queryServer()
    ];

    if (this.propagationMode) queries.push(this.queryPropagation());

    await Promise.all(queries);
  }

  async queryDns(force = false) {
    if (!this.isValidDomain) return;
    const cacheKey = `dns:${this.domain}:${this.endpoint}`;
    return this.run(
      'dns',
      (signal) => queryDns(this.domain, DEFAULT_RECORD_TYPES, undefined, this.endpoint, signal),
      (next) => (this.dnsState = next),
      { cacheKey, cacheTtlMs: 30_000, force }
    );
  }

  async queryRdap(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'rdap',
      (signal) => queryRdap(this.domain, signal),
      (next) => (this.rdapState = next),
      { cacheKey: `rdap:${this.domain}`, cacheTtlMs: 60_000, force }
    );
  }

  async queryEmail(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'email',
      (signal) => queryEmailRecords(this.domain, this.endpoint, signal),
      (next) => (this.emailState = next),
      { cacheKey: `email:${this.domain}:${this.endpoint}`, cacheTtlMs: 30_000, force }
    );
  }

  async queryServer() {
    if (!this.isValidDomain) return;
    return this.run(
      'server',
      (signal) => analyzeServer(this.domain, { useHttp: this.useHttpForServer, signal }),
      (next) => (this.serverState = next)
    );
  }

  async queryPropagation(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'propagation',
      (signal) => queryAllProviders(this.domain, undefined, signal),
      (next) => (this.propagationState = next),
      { cacheKey: `prop:${this.domain}`, cacheTtlMs: 30_000, force }
    );
  }

  async querySubdomains(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'subdomains',
      // The extension queries from the user's own IP, so CertSpotter's
      // per-IP quota is per-user — safe to race it against crt.sh.
      (signal) => discoverSubdomains(this.rootDomain || this.domain, { signal, useCertSpotter: true }),
      (next) => (this.subdomainState = next),
      { cacheKey: `subs:${this.rootDomain || this.domain}`, cacheTtlMs: 5 * 60_000, force }
    );
  }

  async queryDkim(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'dkim',
      (signal) => queryDkim(this.domain, this.endpoint, signal),
      (next) => (this.dkimState = next),
      { cacheKey: `dkim:${this.domain}`, cacheTtlMs: 60_000, force }
    );
  }

  /**
   * Count the DNS lookups an SPF evaluation would consume. Exceeding the
   * RFC 7208 limit of 10 makes receivers return permerror, silently failing
   * authentication — invisible without walking the include tree.
   */
  async querySpfEval(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'spf-eval',
      (signal) => evaluateSpf(this.domain, this.endpoint, signal),
      (next) => (this.spfEvalState = next),
      { cacheKey: `spf:${this.domain}:${this.endpoint}`, cacheTtlMs: 60_000, force }
    );
  }

  /** Whether the DNSSEC chain actually validates (not just whether it exists). */
  async queryDnssec(force = false) {
    if (!this.isValidDomain) return;
    return this.run(
      'dnssec',
      (signal) => checkDnssec(this.rootDomain || this.domain, this.endpoint, signal),
      (next) => (this.dnssecState = next),
      { cacheKey: `dnssec:${this.rootDomain || this.domain}`, cacheTtlMs: 60_000, force }
    );
  }

  /**
   * Compare the CAA policy against the CA that actually issued the current
   * certificate. Only runs when CAA records exist — most domains have none,
   * so this costs nothing for them.
   */
  async queryCaaCheck() {
    const caa = this.dnsState.data?.CAA ?? [];
    if (caa.length === 0) {
      this.caaCheckState = idleState();
      return;
    }
    const domain = this.rootDomain || this.domain;
    return this.run(
      'caa-check',
      async (signal) => {
        // Exact-name crt.sh query (fast path), unlike subdomain discovery's
        // wildcard search.
        const cert = await fetchTlsCertificate(domain, signal).catch(() => null);
        return checkCaaAgainstIssuer(caa.map((r) => r.data), cert?.issuer ?? null);
      },
      (next) => (this.caaCheckState = next),
      { cacheKey: `caa:${domain}`, cacheTtlMs: 5 * 60_000 }
    );
  }

  async queryAsn() {
    const ips = [
      ...(this.dnsState.data?.A?.map((r) => r.data) ?? []),
      ...(this.dnsState.data?.AAAA?.map((r) => r.data) ?? [])
    ];
    if (ips.length === 0) {
      this.asnState = idleState();
      return;
    }
    return this.run(
      'asn',
      (signal) => lookupAsnBatch(ips, signal),
      (next) => (this.asnState = next),
      { cacheKey: `asn:${ips.join(',')}`, cacheTtlMs: 60 * 60_000 }
    );
  }

  async clearRecent() {
    await clearRecentSearches();
    this.recentSearches = [];
  }

  reset() {
    this.cancelAll();
    this.domain = '';
    this.inputDomain = '';
    this.dnsState = idleState();
    this.rdapState = idleState();
    this.emailState = idleState();
    this.serverState = idleState();
    this.propagationState = idleState();
    this.subdomainState = idleState();
    this.dkimState = idleState();
    this.asnState = idleState();
    this.spfEvalState = idleState();
    this.dnssecState = idleState();
    this.caaCheckState = idleState();
    this.propagationMode = false;
  }
}

export const extensionState = new ExtensionState();
