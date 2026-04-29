<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type SubdomainsResponse } from '$lib/proxy-client';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import { Search, Download } from 'lucide-svelte';
  import { SUBDOMAINS_PAGE } from '$lib/utils/seoContent';

  // Cap rendered rows so domains with massive CT corpora (google.com,
  // cloudflare.com, …) don't lock up the browser trying to mount tens of
  // thousands of nodes. Filter and CSV export still operate on the full set.
  const RENDER_CAP = 500;

  let result = $state<SubdomainsResponse | null>(null);
  let loading = $state(false);
  let error = $state('');
  let filter = $state('');

  async function load() {
    loading = true;
    error = '';
    try {
      result = await proxy.subdomains(domain.name);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Subdomain discovery failed';
    } finally {
      loading = false;
    }
  }

  function copyAll() {
    if (!filtered.length) return;
    navigator.clipboard.writeText(filtered.join('\n'));
  }
  function exportCsv() {
    if (!filtered.length) return;
    const csv = 'subdomain\n' + filtered.map((s) => `"${s.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain.name}-subdomains.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    if (!result) load();
  });

  const filtered = $derived.by(() => {
    if (!result) return [] as string[];
    if (!filter) return result.subdomains;
    const f = filter.toLowerCase();
    return result.subdomains.filter((s) => s.toLowerCase().includes(f));
  });
  const visible = $derived(filtered.slice(0, RENDER_CAP));
  const truncated = $derived(filtered.length > RENDER_CAP);
</script>

<SEO title={SUBDOMAINS_PAGE.title($page.params.domain ?? '')} description={SUBDOMAINS_PAGE.description($page.params.domain ?? '')} />

<SEOToolPage config={SUBDOMAINS_PAGE} domainName={domain.name} isLoading={loading && !result} error={error}>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={5} />
  {:else if result}
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-line">
        <p class="text-sm text-fg-muted">
          <span class="text-fg font-medium tabular-nums">{filtered.length.toLocaleString()}</span>
          {#if filter}<span class="text-fg-subtle"> of {result.total.toLocaleString()}</span>{/if}
          subdomain{filtered.length === 1 ? '' : 's'} from CT logs
        </p>
        <div class="flex gap-3">
          <button onclick={copyAll} class="text-[11px] text-fg-muted hover:text-fg transition-colors">Copy all</button>
          <button onclick={exportCsv} class="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg transition-colors"><Download class="w-3 h-3" />CSV</button>
        </div>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
        <input
          bind:value={filter}
          placeholder="Filter subdomains…"
          class="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line rounded-lg text-sm text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500/60"
        />
      </div>

      {#if filtered.length > 0}
        <div class="bg-surface-2 border border-line rounded-xl divide-y divide-line max-h-[640px] overflow-y-auto">
          {#each visible as sub}
            <div class="flex items-center justify-between gap-3 p-3 hover:bg-surface-3 transition-colors group">
              <span class="font-mono text-xs text-fg break-all flex-1">{sub}</span>
              <CopyButton text={sub} size="sm" variant="compact" />
            </div>
          {/each}
        </div>
        {#if truncated}
          <div class="bg-warn-500/10 border border-warn-500/30 rounded-lg px-4 py-3 text-[12px] text-warn-400 leading-relaxed">
            Showing the first <span class="font-medium tabular-nums">{RENDER_CAP.toLocaleString()}</span>
            of <span class="font-medium tabular-nums">{filtered.length.toLocaleString()}</span> matches.
            Use the filter above to narrow the list, or click <span class="font-mono">CSV</span> to export every result.
          </div>
        {/if}
      {:else}
        <p class="text-center text-sm text-fg-subtle py-6">No subdomains match the filter.</p>
      {/if}

      <p class="text-[10px] text-fg-subtle text-center">Subdomains via crt.sh public Certificate Transparency log search · cached at the edge.</p>
    </div>
  {/if}
</SEOToolPage>
