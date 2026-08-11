<script lang="ts">
  import { untrack } from 'svelte';
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import RecordCard from './RecordCard.svelte';
  import PropagationResults from './PropagationResults.svelte';
  import EmptyState from './EmptyState.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import QuickActions from './QuickActions.svelte';
  import { lookupPtrBatch } from '@ldns/core/ptr';
  import { RECORD_TYPE_ORDER } from '@ldns/core/constants';
  import { ShieldAlert } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'ip', label: 'A/AAAA' },
    { id: 'mx', label: 'MX' },
    { id: 'txt', label: 'TXT' },
    { id: 'ns', label: 'NS' },
    { id: 'other', label: 'Other' }
  ];

  let activeFilter = $state('all');
  let ptrResults = $state<Record<string, string>>({});

  const filterMap: Record<string, string[]> = {
    all: [],
    ip: ['A', 'AAAA'],
    mx: ['MX'],
    txt: ['TXT'],
    ns: ['NS', 'SOA'],
    other: ['CNAME', 'CAA', 'DNSKEY', 'HTTPS', 'SRV', 'DS']
  };

  function getFilteredRecords() {
    const data = extensionState.dnsState.data;
    if (!data) return [];

    const result: { type: string; records: typeof data[string] }[] = [];
    const allowedTypes = filterMap[activeFilter];

    for (const type of RECORD_TYPE_ORDER) {
      if (data[type] && data[type].length > 0) {
        if (activeFilter === 'all' || allowedTypes.includes(type)) {
          result.push({ type, records: data[type] });
        }
      }
    }
    for (const [type, records] of Object.entries(data)) {
      if (!RECORD_TYPE_ORDER.includes(type) && records.length > 0) {
        if (activeFilter === 'all' || activeFilter === 'other' || allowedTypes.includes(type)) {
          result.push({ type, records });
        }
      }
    }
    return result;
  }

  // Trigger parallel PTR lookups when DNS data changes (covers IPv4 and IPv6)
  $effect(() => {
    const data = extensionState.dnsState.data;
    const a = data?.A?.map((r) => r.data) ?? [];
    const aaaa = data?.AAAA?.map((r) => r.data) ?? [];
    const ips = [...a, ...aaaa];
    if (ips.length === 0) return;
    // Guard against a stale batch landing after the domain changed. A slow
    // PTR response for the previous domain must not replace the current map.
    const forDomain = extensionState.domain;
    untrack(() => {
      const pending: Record<string, string> = {};
      ips.forEach((ip) => (pending[ip] = '...'));
      ptrResults = pending;
      lookupPtrBatch(ips).then((batch) => {
        if (extensionState.domain === forDomain) ptrResults = batch;
      });
    });
  });

  const filteredRecords = $derived(getFilteredRecords());
  const hasRecords = $derived(filteredRecords.length > 0);

  function getFilterRecordTypes(): string[] | null {
    if (activeFilter === 'all') return null;
    return filterMap[activeFilter] || null;
  }

  function togglePropagation() {
    extensionState.propagationMode = !extensionState.propagationMode;
    if (
      extensionState.propagationMode &&
      !extensionState.propagationState.hasData &&
      !extensionState.propagationState.loading
    ) {
      extensionState.queryPropagation();
    }
  }

  const compareFilterTypes = $derived(getFilterRecordTypes());
  const asnResults = $derived(extensionState.asnState.data ?? {});
  const caaCheck = $derived(extensionState.caaCheckState.data);
</script>

<div class="space-y-2.5">
  {#if extensionState.dnsState.loading}
    <LoadingState message="Looking up DNS records…" />
  {:else if extensionState.dnsState.error}
    <ErrorState message={extensionState.dnsState.error} />
  {:else if extensionState.dnsState.hasData}
    <!-- Propagation toggle + Filter chips -->
    <div class="flex flex-wrap items-center gap-1.5 pb-2 border-b border-line">
      <button
        onclick={togglePropagation}
        class={cn(
          'flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded-lg transition-colors',
          extensionState.propagationMode
            ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
            : 'bg-surface-2 text-fg-muted border border-line hover:bg-surface-3'
        )}
        aria-pressed={extensionState.propagationMode}
      >
        <span
          class={cn(
            'w-6 h-3 rounded-full relative transition-colors',
            extensionState.propagationMode ? 'bg-primary-500' : 'bg-fg-subtle/40'
          )}
        >
          <span
            class={cn(
              'absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all',
              extensionState.propagationMode ? 'left-3.5' : 'left-0.5'
            )}
          ></span>
        </span>
        <span>Compare</span>
      </button>
      <div class="w-px h-4 bg-line self-center"></div>
      {#each filters as filter}
        <button
          onclick={() => (activeFilter = filter.id)}
          class={cn(
            'px-2 py-0.5 text-[11px] rounded-lg transition-colors',
            activeFilter === filter.id
              ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
              : 'bg-surface-2 text-fg-muted border border-line hover:bg-surface-3 hover:text-fg'
          )}
        >
          {filter.label}
        </button>
      {/each}
      <div class="ml-auto">
        <RefreshButton onClick={() => extensionState.queryDns(true)} loading={extensionState.dnsState.loading} />
      </div>
    </div>

    {#if caaCheck && (caaCheck.verdict === 'not-covered' || caaCheck.verdict === 'forbids-all')}
      <div class="rounded-xl p-3 border bg-warn-500/10 border-warn-500/30">
        <div class="flex items-center gap-1.5 mb-1">
          <ShieldAlert class="w-3.5 h-3.5 text-warn-400" />
          <h3 class="section-title !text-warn-400">CAA mismatch</h3>
        </div>
        <p class="text-[10px] text-fg-muted leading-relaxed">{caaCheck.explanation}</p>
      </div>
    {/if}

    {#if extensionState.propagationMode}
      <PropagationResults filterTypes={compareFilterTypes} />
    {:else if hasRecords}
      {#each filteredRecords as { type, records }}
        <RecordCard {type} {records} {ptrResults} {asnResults} />
      {/each}
    {:else}
      <div class="text-center py-6 text-fg-subtle">
        <p class="text-xs">
          No {activeFilter === 'all' ? '' : activeFilter.toUpperCase() + ' '}records found.
        </p>
      </div>
    {/if}
  {:else}
    <EmptyState title="DNS records" hint="Enter a domain to look up records." />
  {/if}

  {#if extensionState.dnsState.hasData}
    <QuickActions tab="dns" />
  {/if}
</div>
