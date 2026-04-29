<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import { DNS_ENDPOINTS } from '@ldns/core/constants';
  import type { DnsEndpoint } from '@ldns/core/types';
  import { cn } from '$lib/utils/cn';

  interface Props {
    filterTypes?: string[] | null;
  }

  let { filterTypes = null }: Props = $props();

  const endpoints: DnsEndpoint[] = ['cloudflare', 'google', 'dns-sb'];
  const recordTypeOrder = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'];

  function getAllRecordTypes() {
    const data = extensionState.propagationState.data?.results;
    if (!data) return [];
    const types = new Set<string>();
    for (const endpoint of endpoints) {
      const providerData = data[endpoint];
      if (providerData) {
        for (const [type, records] of Object.entries(providerData)) {
          if (records && records.length > 0) types.add(type);
        }
      }
    }
    let filtered = Array.from(types);
    if (filterTypes && filterTypes.length > 0) {
      filtered = filtered.filter((t) => filterTypes.includes(t));
    }
    return filtered.sort((a, b) => {
      const ai = recordTypeOrder.indexOf(a);
      const bi = recordTypeOrder.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }

  function hasDiscrepancy(type: string): boolean {
    const data = extensionState.propagationState.data?.results;
    if (!data) return false;
    const sets = endpoints.map((ep) => {
      const records = data[ep]?.[type] || [];
      return records
        .map((r) => r.data)
        .sort()
        .join(',');
    });
    return new Set(sets).size > 1;
  }

  const allTypes = $derived(getAllRecordTypes());
  const latencies = $derived(extensionState.propagationState.data?.latencies ?? []);
  const mismatches = $derived(allTypes.filter(hasDiscrepancy));

  function latencyColor(ms: number | null): string {
    if (ms === null) return 'text-fg-subtle';
    if (ms < 80) return 'text-ok-400';
    if (ms < 200) return 'text-warn-400';
    return 'text-bad-400';
  }
</script>

<div class="space-y-2.5">
  {#if extensionState.propagationState.loading}
    <LoadingState message="Comparing DNS providers…" />
  {:else if extensionState.propagationState.error}
    <ErrorState message={extensionState.propagationState.error} />
  {:else if extensionState.propagationState.hasData}
    {#if allTypes.length === 0}
      <div class="text-center py-6 text-fg-subtle">
        <p class="text-xs">No records found across any provider.</p>
      </div>
    {:else}
      <!-- Latency strip -->
      <div class="flex items-center justify-between gap-2 px-2 py-1.5 bg-surface-2 border border-line rounded-lg">
        {#each latencies as l}
          {@const name = DNS_ENDPOINTS[l.endpoint].name}
          <div class="flex flex-col items-center flex-1">
            <span class="text-[9px] uppercase tracking-wide text-fg-subtle">{name}</span>
            <span class={cn('text-xs font-mono tnum mt-0.5', latencyColor(l.ms))}>
              {l.ms === null ? '—' : `${l.ms}ms`}
            </span>
          </div>
        {/each}
      </div>

      <p class="text-[10px] text-fg-muted px-1">
        {#if mismatches.length === 0}
          <span class="text-ok-400">✓</span> All records consistent across providers
        {:else}
          <span class="text-warn-400">⚠</span> {mismatches.length} record type{mismatches.length === 1 ? '' : 's'} differ:
          <span class="font-mono">{mismatches.join(', ')}</span>
        {/if}
      </p>

      {#each allTypes as type}
        {@const mismatch = hasDiscrepancy(type)}
        <div
          class={cn(
            'bg-surface-2 rounded-xl overflow-hidden border fade-in-up',
            mismatch ? 'border-warn-500/50' : 'border-line'
          )}
        >
          <div
            class={cn(
              'px-3 py-1.5 border-b flex items-center justify-between',
              mismatch ? 'bg-warn-500/10 border-warn-500/30' : 'border-line'
            )}
          >
            <span class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">{type}</span>
            {#if mismatch}
              <span class="text-[10px] text-warn-400 font-medium">Mismatch</span>
            {/if}
          </div>
          <div class="grid grid-cols-3 divide-x divide-line">
            {#each endpoints as endpoint}
              {@const records = extensionState.propagationState.data?.results[endpoint]?.[type] || []}
              <div class="p-2">
                <p class="text-[10px] text-fg-subtle font-medium mb-1">{DNS_ENDPOINTS[endpoint].name}</p>
                {#if records.length > 0}
                  {#each records as record}
                    <p class="text-[10px] text-fg font-mono break-all leading-relaxed">{record.data}</p>
                  {/each}
                {:else}
                  <p class="text-[10px] text-fg-subtle italic">None</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {:else}
    <div class="text-center py-6 text-fg-subtle">
      <p class="text-xs">Click "Compare" to check DNS propagation.</p>
    </div>
  {/if}
</div>
