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
  import FaqJsonLd from '$lib/components/FaqJsonLd.svelte';
  import { generateSecurityFaqJsonLd } from '$lib/utils/faqJsonLd';

  let securityHeaders = $state<SecurityHeadersResponse | null>(null);
  let tls = $state<TlsResponse | { ok: false; error: string } | null>(null);
  let probes = $state<ProbesResponse | null>(null);
  let hsts = $state<HstsPreloadResponse | null>(null);
  let loading = $state(false);
  let error = $state('');

  async function load() {
    if (!domain.name || !domain.isValid) return;
    loading = true;
    error = '';
    try {
      const [a, b, c, d] = await Promise.allSettled([
        proxy.securityHeaders(domain.name),
        proxy.tls(domain.name),
        proxy.probes(domain.name),
        proxy.hstsPreload(domain.name)
      ]);
      if (a.status === 'fulfilled') securityHeaders = a.value;
      if (b.status === 'fulfilled') tls = b.value;
      if (c.status === 'fulfilled') probes = c.value;
      if (d.status === 'fulfilled') hsts = d.value;
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

  // Compute an overall grade from the four signals
  const grade = $derived.by(() => {
    if (!securityHeaders) return null;
    const okCount = securityHeaders.audit.filter((c) => c.level === 'ok').length;
    const total = securityHeaders.audit.length;
    let score = (okCount / total) * 60; // headers contribute up to 60
    if (tls && tls.ok && tls.certificate.daysUntilExpiry > 30) score += 20;
    if (hsts?.status === 'preloaded') score += 10;
    if (probes?.probes.find((p) => p.name === 'security.txt')?.found) score += 10;
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  });

  function gradeColor(g: string | null): 'green' | 'yellow' | 'red' | 'gray' {
    if (g === 'A+' || g === 'A') return 'green';
    if (g === 'B') return 'yellow';
    if (g === 'C' || g === 'D' || g === 'F') return 'red';
    return 'gray';
  }
  const colorMap = { green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400', gray: 'text-gray-400' } as const;
  const auditClass = {
    ok: 'bg-green-500/15 text-green-400 border-green-500/30',
    warn: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    bad: 'bg-red-500/15 text-red-400 border-red-500/30'
  } as const;

  function expiryColor(days: number): string {
    if (days < 7) return 'text-red-400';
    if (days < 30) return 'text-yellow-400';
    return 'text-green-400';
  }

  // FAQ generator expects the full SecurityData shape; loose-cast since only
  // overall.grade is read by the generator template.
  const faqJsonLd = $derived(grade
    ? generateSecurityFaqJsonLd(domain.name, { overall: { grade, score: 0, summary: '' } } as Parameters<typeof generateSecurityFaqJsonLd>[1])
    : null);
</script>

<SEO
  title="{$page.params.domain} Security Analysis"
  description="TLS certificate, security headers audit, HSTS preload status, and well-known probes for {$page.params.domain}."
/>

<FaqJsonLd faqData={faqJsonLd} />

<ToolPage
  title="{domain.name} Security Analysis"
  description="TLS, headers, HSTS preload, and well-known probes for {domain.name}"
  domainName={domain.name}
  isLoading={loading && !securityHeaders}
  error={error}
  badge={grade ? { text: grade, color: gradeColor(grade) } : { text: loading ? 'Analyzing…' : 'Ready', color: 'gray' }}
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
      <!-- Hero grade -->
      {#if grade}
        <div class="text-center py-2">
          <div class="text-7xl font-semibold tabular-nums {colorMap[gradeColor(grade)]}">{grade}</div>
          <p class="text-gray-400 text-sm mt-2">Overall security grade</p>
        </div>
      {/if}

      <!-- TLS / Certificate -->
      <div>
        <SectionHeader id="tls-certificate" title="01 — TLS Certificate" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-5">
          {#if tls && tls.ok}
            {@const c = tls.certificate}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-gray-500">Issuer</p>
                <p class="text-gray-100 mt-0.5">{c.issuer}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-gray-500">Common Name</p>
                <p class="font-mono text-gray-100 mt-0.5">{c.commonName}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-gray-500">Valid From</p>
                <p class="text-gray-100 mt-0.5 tabular-nums">{c.notBefore.split('T')[0]}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wider text-gray-500">Valid Until</p>
                <p class="mt-0.5 tabular-nums {expiryColor(c.daysUntilExpiry)}">
                  {c.notAfter.split('T')[0]} <span class="text-xs">({c.daysUntilExpiry} days)</span>
                </p>
              </div>
              {#if c.san.length > 0}
                <div class="md:col-span-2">
                  <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Subject Alternative Names ({c.san.length})</p>
                  <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {#each c.san as name}
                      <span class="px-2 py-0.5 text-[11px] font-mono bg-gray-800 text-gray-300 rounded border border-gray-700">{name}</span>
                    {/each}
                  </div>
                </div>
              {/if}
              <div class="md:col-span-2 pt-3 border-t border-gray-800">
                <p class="text-[11px] text-gray-500">
                  Cert data via <a class="text-primary-400 hover:underline" href={c.ctLogUrl} target="_blank" rel="noopener noreferrer">crt.sh CT log</a> · most recent issued certificate
                </p>
              </div>
            </div>
          {:else if tls && !tls.ok}
            <p class="text-sm text-gray-400">{tls.error}</p>
          {:else}
            <SkeletonRows rows={3} />
          {/if}
        </div>
      </div>

      <!-- Security headers -->
      <div>
        <SectionHeader id="security-headers" title="02 — Security Headers" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-5">
          {#if securityHeaders}
            <div class="space-y-2">
              {#each securityHeaders.audit as check}
                <div class="flex items-start justify-between gap-3 py-2 border-b border-gray-800 last:border-0">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs text-gray-200">{check.label}</span>
                      <span class="px-1.5 py-0.5 text-[10px] rounded border {auditClass[check.level]}">{check.level === 'ok' ? '✓' : check.level === 'warn' ? '!' : '×'}</span>
                    </div>
                    <p class="text-[11px] text-gray-500 mt-0.5">{check.hint}</p>
                    {#if check.value}<p class="text-[11px] font-mono text-gray-400 mt-1 break-all">{check.value}</p>{/if}
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
        <SectionHeader id="hsts-preload" title="03 — HSTS Preload" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p class="text-[11px] text-gray-500">Status against the public HSTS preload list</p>
            {#if hsts}
              <p class="text-xl font-semibold mt-1 {hsts.status === 'preloaded' ? 'text-green-400' : hsts.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'}">
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
        <SectionHeader id="well-known" title="04 — Well-Known Files" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800">
          {#if probes}
            {#each probes.probes as p}
              <a href={p.url} target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 p-3 hover:bg-gray-800/50 transition-colors">
                <div class="min-w-0">
                  <p class="font-mono text-xs text-gray-100">{p.path}</p>
                  <p class="text-[11px] text-gray-500 truncate">{p.description}</p>
                </div>
                <span class="px-2 py-0.5 text-[10px] rounded border {p.found ? auditClass.ok : 'bg-gray-800 text-gray-500 border-gray-700'}">
                  {p.found ? '✓ Found' : '— Missing'}
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
        <SectionHeader id="email-summary" title="05 — Email Authentication" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center">
          <p class="text-sm text-gray-400">SPF, DMARC, DKIM, BIMI, MTA-STS analysis lives on the dedicated email page.</p>
          <a href="/{domain.name}/email" class="inline-block mt-3 px-4 py-1.5 text-sm bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/25 transition-colors">View email security →</a>
        </div>
      </div>
    </div>
  {/if}
</ToolPage>
