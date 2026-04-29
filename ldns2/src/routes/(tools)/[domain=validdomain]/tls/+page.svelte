<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type TlsResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';

  let result = $state<TlsResponse | { ok: false; error: string } | null>(null);
  let loading = $state(false);
  let error = $state('');

  async function load() {
    loading = true; error = '';
    try { result = await proxy.tls(domain.name); }
    catch (e) { error = e instanceof Error ? e.message : 'TLS lookup failed'; }
    finally { loading = false; }
  }
  onMount(() => { if (!result) load(); });

  const cert = $derived(result && result.ok ? result.certificate : null);
  function expiryColor(days: number): 'green' | 'yellow' | 'red' {
    if (days < 7) return 'red';
    if (days < 30) return 'yellow';
    return 'green';
  }
  const colorMap = { green: 'text-ok-400', yellow: 'text-warn-400', red: 'text-bad-400' } as const;
</script>

<SEO title="{$page.params.domain} TLS Certificate" description="TLS / SSL certificate details for {$page.params.domain} from public Certificate Transparency logs." />

<ToolPage
  title="{domain.name} TLS Certificate"
  description="Issuer, validity, and Subject Alternative Names for the most recently issued certificate."
  domainName={domain.name}
  isLoading={loading}
  error={error || (result && !result.ok ? result.error : '')}
  badge={cert ? { text: `${cert.daysUntilExpiry}d left`, color: expiryColor(cert.daysUntilExpiry) } : { text: loading ? 'Loading…' : 'Ready', color: 'gray' }}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={4} />
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
</ToolPage>
