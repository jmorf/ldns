<script lang="ts">
  /**
   * Reusable page shell for "lookup record type X for this domain" pages.
   * Used by /aaaa, /caa, /soa, /cname and could replace the duplicate logic
   * in /a, /mx, /ns, /txt eventually.
   */
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import ToolPage from './ToolPage.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import ShareButton from './ShareButton.svelte';
  import CopyButton from './CopyButton.svelte';
  import SkeletonRows from './SkeletonRows.svelte';
  import SEO from './SEO.svelte';

  interface Props {
    recordType: string;
    title: string;
    description: string;
    emptyMessage: string;
  }
  let { recordType, title, description, emptyMessage }: Props = $props();

  async function load() {
    if (!domain.name || !domain.isValid) return;
    await domain.lookupDnsRecordsWithToolState(recordType);
  }

  onMount(() => {
    if (!domain.toolState.dns?.data?.[recordType]) load();
  });

  const records = $derived((domain.toolState.dns?.data?.[recordType] ?? []) as Array<{ data: string; ttl: number }>);
  const hasData = $derived(domain.toolState.dns?.hasData);
</script>

<SEO title="{$page.params.domain} {recordType} Record Lookup" description={description.replace('{domain}', $page.params.domain ?? '')} />

<ToolPage
  title="{domain.name} {title}"
  description={description.replace('{domain}', domain.name)}
  domainName={domain.name}
  isLoading={domain.toolState.dns?.loading}
  error={domain.toolState.dns?.error}
  badge={records.length > 0 ? { text: `${records.length} record${records.length === 1 ? '' : 's'}`, color: 'gray' } : undefined}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={domain.toolState.dns?.loading} variant="secondary" />
  {/snippet}

  {#if domain.toolState.dns?.loading && !hasData}
    <SkeletonRows rows={3} />
  {:else if records.length > 0}
    <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800">
      {#each records as record}
        <div class="p-4 flex items-start justify-between gap-3 hover:bg-gray-800/50 transition-colors">
          <div class="flex-1 min-w-0">
            <p class="font-mono text-sm text-white break-all">{record.data}</p>
            <p class="text-[11px] text-gray-500 mt-1">TTL: <span class="font-mono tabular-nums text-gray-400">{record.ttl}s</span></p>
          </div>
          <CopyButton text={record.data} size="sm" variant="compact" />
        </div>
      {/each}
    </div>
  {:else if hasData}
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
      <p class="text-sm text-gray-400">{emptyMessage}</p>
    </div>
  {/if}
</ToolPage>
