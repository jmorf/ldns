<script lang="ts">
  /**
   * Mono uppercase eyebrow, used above marketing-style section titles to give
   * the page a code/terminal aesthetic. Renders as `// label` in Geist Mono.
   */
  interface Props {
    children?: import('svelte').Snippet;
    text?: string;
  }
  let { children, text }: Props = $props();
</script>

<p class="font-mono text-[11px] uppercase tracking-wider text-fg-subtle mb-2">
  <span class="text-primary-500/80">// </span>
  {#if text}{text}{:else if children}{@render children()}{/if}
</p>
