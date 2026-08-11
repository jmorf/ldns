<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type SecurityHeadersResponse, type TlsResponse, type ProbesResponse, type HstsPreloadResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import DnssecValidation from '$lib/components/DnssecValidation.svelte';
  import CaaIssuerCheck from '$lib/components/CaaIssuerCheck.svelte';
  import { queryDns } from '@ldns/core/dns-query';

  let securityHeaders = $state<SecurityHeadersResponse | null>(null);
  let tls = $state<TlsResponse | { ok: false; error: string } | null>(null);
  let probes = $state<ProbesResponse | null>(null);
  let hsts = $state<HstsPreloadResponse | null>(null);
  let loading = $state(false);
  let error = $state('');
  // CAA records, fetched here so the policy can be compared against the CA
  // that actually issued the certificate shown above.
  let caaRecords = $state<string[]>([]);

  async function load() {
    if (!domain.name || !domain.isValid) return;
    loading = true;
    error = '';
    try {
      const [a, b, c, d, e] = await Promise.allSettled([
        proxy.securityHeaders(domain.name),
        proxy.tls(domain.name),
        proxy.probes(domain.name),
        proxy.hstsPreload(domain.name),
        queryDns(domain.name, ['CAA'])
      ]);
      if (a.status === 'fulfilled') securityHeaders = a.value;
      if (b.status === 'fulfilled') tls = b.value;
      if (c.status === 'fulfilled') probes = c.value;
      if (d.status === 'fulfilled') hsts = d.value;
      caaRecords = e.status === 'fulfilled' ? (e.value.CAA ?? []).map((r) => r.data) : [];
      if (a.status === 'rejected' && b.status === 'rejected' && c.status === 'rejected') {
        error = 'Security checks failed';
      }
    } finally {
      loading = false;
    }
  }

  function handleRefresh() {
    return load();
  }

  onMount(() => {
    if (!securityHeaders) load();
  });

  const auditClass = {
    ok: 'bg-ok-500/15 text-ok-400 border-ok-500/30',
    warn: 'bg-warn-500/15 text-warn-400 border-warn-500/30',
    bad: 'bg-bad-500/15 text-bad-400 border-bad-500/30'
  } as const;

  function expiryColor(days: number): string {
    if (days < 7) return 'text-bad-400';
    if (days < 30) return 'text-warn-400';
    return 'text-ok-400';
  }
</script>

<SEO
  title="{$page.params.domain} Security Information"
  description="TLS certificate, security headers, HSTS preload status, and well-known files for {$page.params.domain}."
/>

<ToolPage
  eyebrow="security · overview"
  title="{domain.name} Security"
  description="TLS certificate, response security headers, HSTS preload list status, and well-known files for {domain.name}."
  domainName={domain.name}
  isLoading={loading && !securityHeaders}
  error={error}
>
  {#snippet actions()}
    <div class="flex gap-2">
      <ShareButton />
      <RefreshButton onClick={handleRefresh} loading={loading} variant="secondary" />
    </div>
  {/snippet}

  {#if loading && !securityHeaders}
    <SkeletonRows rows={6} />
  {:else}
    <div class="space-y-8">
      <!-- TLS / Certificate -->
      <div>
        <SectionHeader id="tls-certificate" title="01 — TLS Certificate" />
        <div class="bg-surface-2 border border-line rounded-xl p-5">
          {#if tls && tls.ok}
            {@const c = tls.certificate}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Issuer</p>
                <p class="text-fg mt-0.5">{c.issuer}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Common Name</p>
                <p class="font-mono text-fg mt-0.5">{c.commonName}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Valid From</p>
                <p class="text-fg mt-0.5 tnum">{c.notBefore.split('T')[0]}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Valid Until</p>
                <p class="mt-0.5 tnum {expiryColor(c.daysUntilExpiry)}">
                  {c.notAfter.split('T')[0]} <span class="text-xs">({c.daysUntilExpiry} days)</span>
                </p>
              </div>
              {#if c.san.length > 0}
                <div class="md:col-span-2">
                  <p class="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">Subject Alternative Names ({c.san.length})</p>
                  <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {#each c.san as name}
                      <span class="px-2 py-0.5 text-[11px] font-mono bg-surface-3 text-fg-muted rounded border border-line">{name}</span>
                    {/each}
                  </div>
                </div>
              {/if}
              <div class="md:col-span-2 pt-3 border-t border-line">
                <p class="text-[11px] text-fg-subtle">
                  Cert data via <a class="text-primary-400 hover:underline" href={c.ctLogUrl} target="_blank" rel="noopener noreferrer">crt.sh CT log</a> · most recent issued certificate
                </p>
              </div>
            </div>
          {:else if tls && !tls.ok}
            <p class="text-sm text-fg-muted">{tls.error}</p>
          {:else}
            <SkeletonRows rows={3} />
          {/if}
        </div>
      </div>

      <!-- Security headers -->
      <div>
        <SectionHeader id="caa-policy" title="02 — CAA Policy" />
        <CaaIssuerCheck {caaRecords} certIssuer={tls && tls.ok ? tls.certificate.issuer : null} />
      </div>

      <div>
        <SectionHeader id="dnssec" title="03 — DNSSEC" />
        <DnssecValidation domain={domain.rootDomain || domain.name} />
      </div>

      <div>
        <SectionHeader id="security-headers" title="04 — Response Security Headers" />
        <div class="bg-surface-2 border border-line rounded-xl p-5">
          {#if securityHeaders}
            <div class="space-y-2">
              {#each securityHeaders.audit as check}
                <div class="flex items-start justify-between gap-3 py-2 border-b border-line last:border-0">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs text-fg">{check.label}</span>
                      <span class="px-1.5 py-0.5 text-[10px] rounded border {auditClass[check.level]}">
                        {check.level === 'ok' ? 'present' : check.level === 'warn' ? 'partial' : 'absent'}
                      </span>
                    </div>
                    <p class="text-[11px] text-fg-subtle mt-0.5">{check.hint}</p>
                    {#if check.value}<p class="text-[11px] font-mono text-fg-muted mt-1 break-all">{check.value}</p>{/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <SkeletonRows rows={4} />
          {/if}
        </div>
      </div>

      <!-- HSTS Preload -->
      <div>
        <SectionHeader id="hsts-preload" title="05 — HSTS Preload List" />
        <div class="bg-surface-2 border border-line rounded-xl p-5 flex items-center justify-between">
          <div>
            <p class="text-[11px] text-fg-subtle">Status against the public HSTS preload list</p>
            {#if hsts}
              <p class="text-xl font-semibold mt-1 {hsts.status === 'preloaded' ? 'text-ok-400' : hsts.status === 'pending' ? 'text-warn-400' : 'text-fg-muted'}">
                {hsts.status ?? 'unknown'}
              </p>
            {:else}
              <SkeletonRows rows={1} />
            {/if}
          </div>
          <a class="text-[11px] text-primary-400 hover:underline" href="https://hstspreload.org/?domain={domain.name}" target="_blank" rel="noopener noreferrer">hstspreload.org →</a>
        </div>
      </div>

      <!-- Well-known probes -->
      <div>
        <SectionHeader id="well-known" title="06 — Well-Known Files" />
        <div class="bg-surface-2 border border-line rounded-xl divide-y divide-line">
          {#if probes}
            {#each probes.probes as p}
              <a href={p.url} target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 p-3 hover:bg-surface-3 transition-colors">
                <div class="min-w-0">
                  <p class="font-mono text-xs text-fg">{p.path}</p>
                  <p class="text-[11px] text-fg-subtle truncate">{p.description}</p>
                </div>
                <span class="px-2 py-0.5 text-[10px] rounded border {p.found ? auditClass.ok : 'bg-surface-3 text-fg-subtle border-line'}">
                  {p.found ? 'present' : 'absent'}
                </span>
              </a>
            {/each}
          {:else}
            <div class="p-5"><SkeletonRows rows={3} /></div>
          {/if}
        </div>
      </div>

      <!-- Email summary -->
      <div>
        <SectionHeader id="email-summary" title="07 — Email Authentication" />
        <div class="bg-surface-2 border border-line rounded-xl p-5 text-center">
          <p class="text-sm text-fg-muted">SPF, DMARC, DKIM, BIMI, and MTA-STS records live on the dedicated email page.</p>
          <a href="/{domain.name}/email" class="inline-block mt-3 px-4 py-1.5 text-sm bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/25 transition-colors">View email records →</a>
        </div>
      </div>
    </div>
  {/if}
</ToolPage>
