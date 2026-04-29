import type {
  DnsData,
  ParsedRdapData,
  EmailData,
  DnsEndpoint,
  ToolState,
  RecentSearch,
  Theme,
  ServerAnalysis,
  ForSaleResult,
  SubdomainResult,
  Settings,
  DkimResult,
  AsnInfo
} from '@ldns/core/types';
import { queryDns } from '@ldns/core/dns-query';
import { queryDomainRegistration } from '@ldns/core/rdap-query';
import { queryEmailRecords } from '@ldns/core/email-query';
import { checkForSale } from '@ldns/core/forsale-query';
import {
  isValidDomain,
  parseDomain,
  getRootDomain,
  extractDomainFromUrl,
  preloadPsl
} from '@ldns/core/domain-parser';
import { DEFAULT_RECORD_TYPES } from '@ldns/core/constants';
import { analyzeServer } from '@ldns/core/server-info';
import { queryAllProviders, type PropagationData } from '@ldns/core/dns-propagation';
import { discoverSubdomains } from '@ldns/core/subdomain-query';
import { queryDkim } from '@ldns/core/dkim-query';
import { lookupAsnBatch } from '@ldns/core/asn-query';
import {
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

  settings = $state<Settings>({
    forSaleEnabled: false,
    funMessages: true,
    grain: true,
    sidePanelMode: false
  });

  dnsState = $state<ToolState<DnsData>>(idleState());
  rdapState = $state<ToolState<ParsedRdapData>>(idleState());
  emailState = $state<ToolState<EmailData>>(idleState());
  serverState = $state<ToolState<ServerAnalysis>>(idleState());
  forSaleState = $state<ToolState<ForSaleResult>>(idleState());
  propagationState = $state<ToolState<PropagationData>>(idleState());
  subdomainState = $state<ToolState<SubdomainResult>>(idleState());
  dkimState = $state<ToolState<DkimResult>>(idleState());
  asnState = $state<ToolState<Record<string, AsnInfo>>>(idleState());

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
    // Kick off psl load in parallel — don't block popup render on it
    void preloadPsl();
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
    let domain = input.toLowerCase().trim();
    if (this.looksLikeUrl(input)) {
      domain = extractDomainFromUrl(input).toLowerCase().trim();
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
   * and short-lived in-memory caching. Aborts any prior in-flight query of the same key.
   */
  private async run<T>(
    key: string,
    target: ToolState<T>,
    fn: (signal: AbortSignal) => Promise<T>,
    setter: (next: ToolState<T>) => void,
    options: { cacheTtlMs?: number; cacheKey?: string } = {}
  ): Promise<void> {
    // Cancel previous
    this.aborters.get(key)?.abort();
    const controller = new AbortController();
    this.aborters.set(key, controller);

    // In-memory cache check
    if (options.cacheKey && options.cacheTtlMs) {
      const cached = cacheGet<T>(options.cacheKey, options.cacheTtlMs);
      if (cached) {
        setter({ loading: false, error: '', data: cached, hasData: true });
        return;
      }
    }

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
    // unused param; ToolState reference kept to preserve API ergonomics
    void target;
  }

  cancelAll() {
    for (const c of this.aborters.values()) c.abort();
    this.aborters.clear();
  }

  async performLookup() {
    if (!this.isValidDomain) return;

    await addRecentSearch(this.domain);
    this.recentSearches = await getRecentSearches();

    // Reset transient state for new domain
    this.propagationState = idleState();
    this.subdomainState = idleState();
    this.dkimState = idleState();
    this.asnState = idleState();

    const queries: Promise<void>[] = [
      this.queryDns(),
      this.queryRdap(),
      this.queryEmail(),
      this.queryServer()
    ];

    if (this.settings.forSaleEnabled) queries.push(this.queryForSale());
    if (this.propagationMode) queries.push(this.queryPropagation());

    await Promise.all(queries);
    // After DNS lands, kick off ASN
    this.queryAsn();
  }

  async queryDns() {
    if (!this.isValidDomain) return;
    const cacheKey = `dns:${this.domain}:${this.endpoint}`;
    return this.run(
      'dns',
      this.dnsState,
      () => queryDns(this.domain, DEFAULT_RECORD_TYPES, undefined, this.endpoint),
      (next) => (this.dnsState = next),
      { cacheKey, cacheTtlMs: 30_000 }
    );
  }

  async queryRdap() {
    if (!this.isValidDomain) return;
    return this.run(
      'rdap',
      this.rdapState,
      () => queryDomainRegistration(this.domain),
      (next) => (this.rdapState = next),
      { cacheKey: `rdap:${this.domain}`, cacheTtlMs: 60_000 }
    );
  }

  async queryEmail() {
    if (!this.isValidDomain) return;
    return this.run(
      'email',
      this.emailState,
      async () => {
        const data = await queryEmailRecords(this.domain, this.endpoint);
        // Kick off DKIM probe in background
        this.queryDkim();
        return data;
      },
      (next) => (this.emailState = next),
      { cacheKey: `email:${this.domain}:${this.endpoint}`, cacheTtlMs: 30_000 }
    );
  }

  async queryServer() {
    if (!this.isValidDomain) return;
    return this.run(
      'server',
      this.serverState,
      () => analyzeServer(this.domain, { useHttp: this.useHttpForServer }),
      (next) => (this.serverState = next)
    );
  }

  async queryForSale() {
    if (!this.isValidDomain || !this.settings.forSaleEnabled) {
      this.forSaleState = idleState();
      return;
    }
    return this.run(
      'forsale',
      this.forSaleState,
      () => checkForSale(this.rootDomain || this.domain),
      (next) => (this.forSaleState = next)
    );
  }

  async queryPropagation() {
    if (!this.isValidDomain) return;
    return this.run(
      'propagation',
      this.propagationState,
      () => queryAllProviders(this.domain),
      (next) => (this.propagationState = next),
      { cacheKey: `prop:${this.domain}`, cacheTtlMs: 30_000 }
    );
  }

  async querySubdomains() {
    if (!this.isValidDomain) return;
    return this.run(
      'subdomains',
      this.subdomainState,
      () => discoverSubdomains(this.rootDomain || this.domain),
      (next) => (this.subdomainState = next),
      { cacheKey: `subs:${this.rootDomain || this.domain}`, cacheTtlMs: 5 * 60_000 }
    );
  }

  async queryDkim() {
    if (!this.isValidDomain) return;
    return this.run(
      'dkim',
      this.dkimState,
      () => queryDkim(this.domain, this.endpoint),
      (next) => (this.dkimState = next),
      { cacheKey: `dkim:${this.domain}`, cacheTtlMs: 60_000 }
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
      this.asnState,
      () => lookupAsnBatch(ips),
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
    this.forSaleState = idleState();
    this.propagationState = idleState();
    this.subdomainState = idleState();
    this.dkimState = idleState();
    this.asnState = idleState();
    this.propagationMode = false;
  }
}

export const extensionState = new ExtensionState();
