<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    hint?: string;
    children?: Snippet;
  }

  let { title, hint, children }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-10 text-center">
  <!-- Stylized DNS glyph (subtle, on-brand) -->
  <svg class="w-9 h-9 text-fg-subtle mb-3" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <rect x="4" y="6" width="28" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2" />
    <rect x="4" y="15" width="28" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2" opacity="0.7" />
    <rect x="4" y="24" width="28" height="6" rx="1.5" stroke="currentColor" stroke-width="1.2" opacity="0.4" />
    <circle cx="8" cy="9" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" opacity="0.7" />
    <circle cx="8" cy="27" r="1" fill="currentColor" opacity="0.4" />
  </svg>
  {#if title}
    <p class="text-xs text-fg-muted">{title}</p>
  {/if}
  {#if hint}
    <p class="text-[11px] text-fg-subtle mt-1">{hint}</p>
  {/if}
  {#if children}
    <div class="mt-3">{@render children()}</div>
  {/if}
</div>
