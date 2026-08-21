<script lang="ts">
  export interface Stat {
    label: string;
    value: string;
    /** Small secondary line under the value */
    sub?: string;
    /** Colors the value: ok = green, warn = yellow, bad = red */
    tone?: 'ok' | 'warn' | 'bad';
    onclick?: () => void;
  }

  interface Props {
    stats: Stat[];
    /** Tailwind grid-cols classes; default suits 4 stats */
    cols?: string;
  }

  let { stats, cols = 'grid-cols-2 lg:grid-cols-4' }: Props = $props();

  const toneClass: Record<string, string> = {
    ok: 'text-ok-400',
    warn: 'text-warn-400',
    bad: 'text-bad-400'
  };
</script>

<!-- Dense status bar replacing the old padded summary-card grids: one
     bordered strip, one cell per stat, mono uppercase labels. The gap-px
     over bg-line trick draws hairline dividers at any wrap point. -->
<div class="grid {cols} gap-px border border-line rounded-xl bg-line overflow-hidden">
  {#each stats as stat (stat.label)}
    {#snippet cell()}
      <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {stat.label}
      </p>
      <p
        class="text-sm font-semibold truncate {stat.tone ? toneClass[stat.tone] : 'text-fg'}"
        title={stat.value}
      >
        {stat.value}
      </p>
      {#if stat.sub}
        <p class="text-xs text-fg-muted truncate" title={stat.sub}>{stat.sub}</p>
      {/if}
    {/snippet}
    {#if stat.onclick}
      <button
        type="button"
        onclick={stat.onclick}
        class="bg-surface-2 px-4 py-3 text-left cursor-pointer hover:bg-surface-3 transition-colors"
      >
        {@render cell()}
      </button>
    {:else}
      <div class="bg-surface-2 px-4 py-3">
        {@render cell()}
      </div>
    {/if}
  {/each}
</div>
