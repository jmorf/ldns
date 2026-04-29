<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type HeadersResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';

  let result = $state<HeadersResponse | null>(null);
  let loading = $state(false);
  let error = $state('');
  let filter = $state('');

  async function load() {
    loading = true;
    error = '';
    try {
      result = await proxy.headers(domain.name);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Headers lookup failed';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!result) load();
  });

  const filtered = $derived.by(() => {
    if (!result) return [] as Array<[string, string]>;
    const entries = Object.entries(result.headers).sort((a, b) => a[0].localeCompare(b[0]));
    if (!filter) return entries;
    const f = filter.toLowerCase();
    return entries.filter(([k, v]) => k.toLowerCase().includes(f) || String(v).toLowerCase().includes(f));
  });
</script>

<SEO title="{$page.params.domain} HTTP Response Headers" description="Inspect every HTTP response header returned by {$page.params.domain}." />

<ToolPage
  title="{domain.name} HTTP Headers"
  description="Every response header returned by {domain.name}, fetched server-side."
  domainName={domain.name}
  isLoading={loading}
  error={error}
  badge={result ? { text: `${Object.keys(result.headers).length} headers`, color: 'gray' } : { text: 'Ready', color: 'gray' }}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={6} />
  {:else if result}
    <div class="space-y-3">
      <input
        bind:value={filter}
        placeholder="Filter headers…"
        class="w-full px-3 py-2 bg-surface border border-line rounded-lg text-sm text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500"
      />
      <div class="bg-surface border border-line rounded-xl divide-y divide-line">
        {#each filtered as [k, v]}
          <div class="flex items-start justify-between gap-3 p-3 group">
            <div class="flex-1 min-w-0">
              <p class="font-mono text-[11px] text-primary-400">{k}</p>
              <p class="font-mono text-xs text-fg break-all mt-1">{v}</p>
            </div>
            <CopyButton text={v} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</ToolPage>
