<script lang="ts">
  interface Metric {
    label: string;
    value: string | number;
    color?: string;
    suffix?: string;
  }

  interface Props {
    title: string;
    metrics: Metric[];
    columns?: number;
    description?: string;
  }

  let { title, metrics, columns = 4, description }: Props = $props();

  function getColorClass(color?: string) {
    const colorMap: Record<string, string> = {
      primary: 'text-primary-400',
      blue: 'text-blue-400',
      green: 'text-ok-400',
      red: 'text-bad-400',
      yellow: 'text-warn-400',
      purple: 'text-purple-400',
      orange: 'text-primary-400',
      gray: 'text-fg-muted'
    };
    return colorMap[color || 'primary'] || 'text-primary-400';
  }

  function getGridColumns(cols: number) {
    const columnMap: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
    };
    return columnMap[cols] || 'grid-cols-2 md:grid-cols-4';
  }
</script>

<div class="bg-surface-2 border border-line rounded-xl overflow-hidden">
  {#if title}
    <div class="px-4 py-3 border-b border-line">
      <h3 class="text-[11px] font-semibold uppercase tracking-wider text-primary-400">{title}</h3>
      {#if description}
        <p class="text-xs text-fg-muted mt-1">{description}</p>
      {/if}
    </div>
  {/if}
  <div class="p-5">
    <div class="grid {getGridColumns(columns)} gap-5">
      {#each metrics as metric}
        <div>
          <div class="text-2xl sm:text-3xl font-semibold tnum {getColorClass(metric.color)}">
            {metric.value}{#if metric.suffix}<span class="text-base text-fg-subtle ml-0.5">{metric.suffix}</span>{/if}
          </div>
          <div class="text-[11px] uppercase tracking-wider text-fg-subtle mt-1">{metric.label}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
