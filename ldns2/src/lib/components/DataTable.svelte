<script lang="ts">
  import CopyButton from './CopyButton.svelte';

  interface TableRow {
    [key: string]: unknown;
  }

  interface Props {
    title: string;
    data: TableRow[];
    columns: { key: string; label: string; width?: string }[];
    emptyMessage?: string;
    enableCopy?: boolean;
    copyColumn?: string;
    highlightColumns?: string[];
  }

  let {
    title,
    data,
    columns,
    emptyMessage = 'No data available',
    enableCopy = false,
    copyColumn = 'value',
    highlightColumns = []
  }: Props = $props();

  function fmt(v: unknown): string {
    if (v == null || v === '') return ', ';
    return String(v);
  }
</script>

<div class="bg-surface-2 border border-line rounded-xl overflow-hidden fade-in-up">
  {#if title}
    <div class="px-4 py-3 border-b border-line">
      <h3 class="text-[11px] font-semibold uppercase tracking-wider text-primary-400">{title}</h3>
    </div>
  {/if}

  {#if data.length > 0}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            {#each columns as column}
              <th
                class="px-4 py-2 text-left text-[10px] font-medium text-fg-subtle uppercase tracking-wider border-b border-line"
                style={column.width ? `width: ${column.width}` : ''}
              >
                {column.label}
              </th>
            {/each}
            {#if enableCopy}
              <th
                class="px-4 py-2 text-left text-[10px] font-medium text-fg-subtle uppercase tracking-wider border-b border-line"
                style="width: 60px"
              >
                <span class="sr-only">Copy</span>
              </th>
            {/if}
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {#each data as row}
            <tr class="hover:bg-surface-3 transition-colors group">
              {#each columns as column}
                <td
                  class="px-4 py-2.5 text-sm font-mono break-words {highlightColumns.includes(column.key) || column.key === 'value' || column.key === 'data' ? 'text-fg' : 'text-fg-muted'}"
                >
                  {fmt(row[column.key])}
                </td>
              {/each}
              {#if enableCopy}
                <td class="px-4 py-2.5 whitespace-nowrap">
                  <CopyButton text={String(row[copyColumn] ?? '')} size="sm" variant="compact" />
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="p-8 text-center">
      <p class="text-fg-subtle italic text-sm">{emptyMessage}</p>
    </div>
  {/if}
</div>
