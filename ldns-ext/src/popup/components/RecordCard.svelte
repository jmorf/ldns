<script lang="ts">
  import CopyRow from './CopyRow.svelte';
  import type { DnsRecordResult, AsnInfo } from '@ldns/core/types';
  import { cn } from '$lib/utils/cn';
  import { createCopied } from '$lib/utils/copied.svelte';

  interface Props {
    type: string;
    records: DnsRecordResult[];
    ptrResults?: Record<string, string>;
    asnResults?: Record<string, AsnInfo>;
  }

  let { type, records, ptrResults = {}, asnResults = {} }: Props = $props();
  const copied = createCopied();

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
  <div class="card-flush fade-in-up">
    <div class="px-3 py-1.5 border-b border-line flex items-center justify-between">
      <span class="section-title">{type}</span>
      <span class="text-[10px] text-fg-subtle tnum">{records.length}</span>
    </div>
    <div class="divide-y divide-line">
      {#each records as record, i}
        <CopyRow
          value={record.data}
          k={`${i}`}
          {copied}
          class="px-3 py-1.5"
          align="start"
          copiedText
          label={`Copy ${type} record: ${record.data}`}
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
        </CopyRow>
      {/each}
    </div>
  </div>
{/if}
