<script lang="ts">
  /**
   * Editorial section header inspired by factory.ai —
   *   01 — Section name
   * Numerals are mono, primary-tinted; the dash is gray; label is sentence-case.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** "01", "02", etc — pass as a string so we can render leading zeros consistently */
    n?: string;
    title: string;
    id?: string;
    children?: Snippet;
    /** Optional right-aligned slot for actions */
    actions?: Snippet;
  }
  let { n, title, id, children, actions }: Props = $props();
</script>

<section {id} class="mb-6">
  <header class="flex items-end justify-between gap-3 mb-3 pb-2 border-b border-line">
    <h2 class="flex items-baseline gap-2.5 font-semibold text-fg">
      {#if n}
        <span class="font-mono text-primary-500 tnum text-sm">{n}</span>
        <span class="text-fg-subtle">—</span>
      {/if}
      <span class="text-base tracking-tight">{title}</span>
    </h2>
    {#if actions}<div class="flex-shrink-0">{@render actions()}</div>{/if}
  </header>
  {#if children}{@render children()}{/if}
</section>
