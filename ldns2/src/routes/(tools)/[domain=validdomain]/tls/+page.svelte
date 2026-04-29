<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type TlsResponse, type BaseFail } from '$lib/proxy-client';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import { TLS_PAGE } from '$lib/utils/seoContent';
  import { AlertTriangle, Clock, Activity, Search } from 'lucide-svelte';

  let result = $state<TlsResponse | BaseFail | null>(null);
  let loading = $state(false);
  let networkError = $state('');

  async function load(force = false) {
    loading = true;
    networkError = '';
    try {
      result = await proxy.tls(domain.name, { force });
    } catch (e) {
      networkError = e instanceof Error ? e.message : 'TLS lookup failed';
    } finally {
      loading = false;
    }
  }
  // Retries from a structured failure must skip the short error cache so the
  // user actually hits the upstream again rather than the cached failure.
  function retry() {
    return load(true);
  }
  onMount(() => {
    if (!result) load();
  });

  const success = $derived(result?.ok === true ? result : null);
  const failure = $derived(result?.ok === false ? result : null);
  const cert = $derived(success?.certificate ?? null);

  function expiryColor(days: number): 'green' | 'yellow' | 'red' {
    if (days < 7) return 'red';
    if (days < 30) return 'yellow';
    return 'green';
  }
  const colorMap = { green: 'text-ok-400', yellow: 'text-warn-400', red: 'text-bad-400' } as const;

  function failureIcon(reason: string | undefined) {
    switch (reason) {
      case 'timeout':
        return Clock;
      case 'overloaded':
      case 'rate-limited':
        return Activity;
      case 'no-results':
        return Search;
      default:
        return AlertTriangle;
    }
  }
  function failureHeading(reason: string | undefined) {
    switch (reason) {
      case 'timeout':
        return 'crt.sh timed out';
      case 'overloaded':
        return 'crt.sh is overloaded right now';
      case 'rate-limited':
        return 'crt.sh rate-limited the request';
      case 'bad-gateway':
        return 'crt.sh returned a gateway error';
      case 'no-results':
        return 'No certificate found in CT logs';
      default:
        return 'TLS certificate lookup failed';
    }
  }
</script>

<SEO
  title="{$page.params.domain} TLS Certificate"
  description="TLS / SSL certificate details for {$page.params.domain} from public Certificate Transparency logs."
/>

<SEOToolPage
  config={TLS_PAGE}
  domainName={domain.name}
  isLoading={loading && !result}
  error={networkError}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={retry} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={4} />
  {:else if failure}
    {@const Icon = failureIcon(failure.reason)}
    <div class="bg-surface-2 border border-line rounded-xl p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-warn-500/15 border border-warn-500/30 flex items-center justify-center">
          <Icon class="w-5 h-5 text-warn-400" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-semibold text-fg">{failureHeading(failure.reason)}</h3>
          <p class="mt-2 text-sm text-fg-muted leading-relaxed">{failure.error}</p>
          <div class="mt-5 flex flex-wrap items-center gap-3">
            <button
              onclick={retry}
              disabled={loading}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-3 border border-line rounded-lg text-fg hover:border-primary-500/30 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Retrying…' : 'Retry now'}
            </button>
            <a
              href="https://crt.sh/?q={domain.name}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
            >
              Check crt.sh directly →
            </a>
          </div>
        </div>
      </div>
      <div class="mt-5 pt-4 border-t border-line">
        <p class="text-[11px] text-fg-subtle leading-relaxed">
          TLS certificate inspection uses crt.sh, a free public Certificate Transparency log search.
          For an actual TLS handshake (cipher suite, protocol version) try
          <a href="https://www.ssllabs.com/ssltest/analyze.html?d={domain.name}" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:underline">SSL Labs</a>.
          Other LDNS tools are unaffected — try
          <a href="/{domain.name}" class="text-primary-400 hover:underline">DNS</a>,
          <a href="/{domain.name}/server" class="text-primary-400 hover:underline">server</a>, or
          <a href="/{domain.name}/security" class="text-primary-400 hover:underline">security</a>.
        </p>
      </div>
    </div>
  {:else if cert}
    <div class="space-y-4">
      <div class="bg-surface border border-line rounded-xl p-5">
        <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Days until expiry</p>
        <p class="text-5xl font-semibold tabular-nums {colorMap[expiryColor(cert.daysUntilExpiry)]} mt-1">
          {cert.daysUntilExpiry}
        </p>
        <p class="text-[11px] text-fg-subtle mt-1 tabular-nums">Expires {cert.notAfter.split('T')[0]}</p>
      </div>

      <div class="bg-surface border border-line rounded-xl p-5 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Issuer</p>
            <p class="text-fg mt-0.5">{cert.issuer}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Common Name</p>
            <p class="font-mono text-fg mt-0.5">{cert.commonName}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Issued</p>
            <p class="text-fg mt-0.5 tabular-nums">{cert.notBefore.split('T')[0]} ({cert.daysSinceIssued}d ago)</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-fg-subtle">CT log entry</p>
            <a class="text-primary-400 hover:underline mt-0.5 inline-block" href={cert.ctLogUrl} target="_blank" rel="noopener noreferrer">crt.sh #{cert.id}</a>
          </div>
          {#if cert.serialNumber}
            <div class="md:col-span-2">
              <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Serial Number</p>
              <p class="font-mono text-xs text-fg-muted mt-0.5 break-all">{cert.serialNumber}</p>
            </div>
          {/if}
        </div>
      </div>

      {#if cert.san.length > 0}
        <div class="bg-surface border border-line rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] uppercase tracking-wider text-fg-subtle">Subject Alternative Names</p>
            <span class="text-xs text-fg-muted tabular-nums">{cert.san.length}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
            {#each cert.san as name}
              <span class="px-2 py-0.5 text-[11px] font-mono bg-surface-2 text-fg-muted rounded border border-line">{name}</span>
            {/each}
          </div>
        </div>
      {/if}

      <p class="text-[10px] text-fg-subtle text-center">Data sourced from <a class="text-primary-500 hover:underline" href="https://crt.sh" target="_blank" rel="noopener noreferrer">crt.sh</a> public CT log search.</p>
    </div>
  {/if}
</SEOToolPage>
