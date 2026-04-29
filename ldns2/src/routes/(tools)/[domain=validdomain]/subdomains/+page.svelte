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

  let result = $state<SubdomainsResponse | null>(null);
  let loading = $state(false);
  let error = $state('');
  let filter = $state('');

  async function load() {
    loading = true; error = '';
    try { result = await proxy.subdomains(domain.name); }
    catch (e) { error = e instanceof Error ? e.message : 'Subdomain discovery failed'; }
    finally { loading = false; }
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
    a.href = url; a.download = `${domain.name}-subdomains.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => { if (!result) load(); });

  const filtered = $derived.by(() => {
    if (!result) return [] as string[];
    if (!filter) return result.subdomains;
    const f = filter.toLowerCase();
    return result.subdomains.filter((s) => s.toLowerCase().includes(f));
  });
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
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-gray-800">
        <p class="text-sm text-gray-400">
          <span class="text-white font-medium tabular-nums">{filtered.length}</span>
          {#if filter}<span class="text-gray-500"> of {result.total}</span>{/if}
          subdomain{filtered.length === 1 ? '' : 's'} from CT logs
        </p>
        <div class="flex gap-2">
          <button onclick={copyAll} class="text-[11px] text-gray-400 hover:text-white">Copy all</button>
          <button onclick={exportCsv} class="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"><Download class="w-3 h-3" />CSV</button>
        </div>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          bind:value={filter}
          placeholder="Filter subdomains…"
          class="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {#if filtered.length > 0}
        <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800 max-h-[640px] overflow-y-auto">
          {#each filtered as sub}
            <div class="flex items-center justify-between gap-3 p-3 hover:bg-gray-800/50 transition-colors group">
              <span class="font-mono text-xs text-white break-all flex-1">{sub}</span>
              <CopyButton text={sub} size="sm" variant="compact" />
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-center text-sm text-gray-500 py-6">No subdomains match the filter.</p>
      {/if}

      <p class="text-[10px] text-gray-600 text-center">Subdomains via crt.sh public Certificate Transparency log search · cached at the edge.</p>
    </div>
  {/if}
</SEOToolPage>
