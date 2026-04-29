<script lang="ts">
  import { Copy, Check } from 'lucide-svelte';
  import type { DnsRecordResult, AsnInfo } from '@ldns/core/types';
  import { cn } from '$lib/utils/cn';

  interface Props {
    type: string;
    records: DnsRecordResult[];
    ptrResults?: Record<string, string>;
    asnResults?: Record<string, AsnInfo>;
  }

  let { type, records, ptrResults = {}, asnResults = {} }: Props = $props();
  let copiedIndex = $state<number | null>(null);

  async function copyToClipboard(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      copiedIndex = index;
      setTimeout(() => (copiedIndex = null), 1600);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function formatTTL(ttl: number): string {
    if (ttl >= 86400) return `${Math.floor(ttl / 86400)}d`;
    if (ttl >= 3600) return `${Math.floor(ttl / 3600)}h`;
    if (ttl >= 60) return `${Math.floor(ttl / 60)}m`;
    return `${ttl}s`;
  }

  function ttlColor(ttl: number): string {
    if (ttl >= 3600) return 'text-fg-muted';
    if (ttl >= 300) return 'text-warn-400';
    return 'text-bad-400';
  }
</script>

{#if records.length > 0}
  <div class="bg-surface-2 rounded-xl overflow-hidden border border-line fade-in-up">
    <div class="px-3 py-1.5 border-b border-line flex items-center justify-between">
      <span class="text-[11px] font-semibold tracking-wide text-primary-400 uppercase">{type}</span>
      <span class="text-[10px] text-fg-subtle tnum">{records.length}</span>
    </div>
    <div class="divide-y divide-line">
      {#each records as record, i}
        <button
          type="button"
          onclick={() => copyToClipboard(record.data, i)}
          class={cn(
            'w-full px-3 py-1.5 flex items-start justify-between gap-2 text-left transition-colors group',
            copiedIndex === i ? 'bg-ok-500/10' : 'hover:bg-surface-3'
          )}
          aria-label={`Copy ${type} record: ${record.data}`}
          title="Click to copy"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs text-fg break-all font-mono">{record.data}</p>
            <p class="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap">
              <span class="text-fg-subtle">TTL</span>
              <span class={cn('font-mono tnum', ttlColor(record.ttl))}>{formatTTL(record.ttl)}</span>
              {#if (type === 'A' || type === 'AAAA') && asnResults[record.data]?.asn}
                {@const asn = asnResults[record.data]}
                <span class="text-fg-subtle">·</span>
                <span class="font-mono text-fg-muted">AS{asn.asn}</span>
                {#if asn.country}
                  <span class="font-mono text-fg-subtle">{asn.country}</span>
                {/if}
                {#if asn.asName}
                  <span class="text-fg-muted truncate max-w-[200px]" title={asn.asName}>{asn.asName}</span>
                {/if}
              {/if}
            </p>
            {#if (type === 'A' || type === 'AAAA') && ptrResults[record.data]}
              <p class="text-[10px] text-fg-muted mt-0.5 font-mono">
                {#if ptrResults[record.data] === '...'}
                  <span class="text-fg-subtle italic">resolving PTR…</span>
                {:else}
                  <span class="text-fg-subtle">PTR</span>
                  <span class="ml-1">{ptrResults[record.data]}</span>
                {/if}
              </p>
            {/if}
          </div>
          <span class="flex-shrink-0 mt-0.5 transition-opacity opacity-50 group-hover:opacity-100">
            {#if copiedIndex === i}
              <span class="flex items-center gap-1 text-[10px] text-ok-400">
                <Check class="w-3 h-3" />
                Copied
              </span>
            {:else}
              <Copy class="w-3 h-3 text-fg-subtle group-hover:text-fg" />
            {/if}
          </span>
        </button>
      {/each}
    </div>
  </div>
{/if}
