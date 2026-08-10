<script lang="ts">
  import { Copy, Check } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';
  import type { Snippet } from 'svelte';
  import type { CopiedState } from '$lib/utils/copied.svelte';

  interface Props {
    /** Text written to the clipboard on click. */
    value: string;
    /** Unique key within the surrounding copied-state scope. */
    k: string;
    /** Shared copied-state from createCopied(). */
    copied: CopiedState;
    /** Extra layout classes for the row (padding, rounding). */
    class?: string;
    /** 'start' aligns the icon to the top for multi-line content. */
    align?: 'center' | 'start';
    /** Show the "Copied" text next to the check icon. */
    copiedText?: boolean;
    /** Accessible label for the button. */
    label: string;
    children: Snippet;
  }

  let {
    value,
    k,
    copied,
    class: klass = '',
    align = 'center',
    copiedText = false,
    label,
    children
  }: Props = $props();
</script>

<button
  type="button"
  onclick={() => copied.copy(value, k)}
  class={cn(
    'w-full flex justify-between gap-2 text-left transition-colors group',
    align === 'start' ? 'items-start' : 'items-center',
    copied.is(k) ? 'bg-ok-500/10' : 'hover:bg-surface-3',
    klass
  )}
  aria-label={label}
  title="Click to copy"
>
  {@render children()}
  <span class={cn('flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity', align === 'start' && 'mt-0.5')}>
    {#if copied.is(k)}
      {#if copiedText}
        <span class="flex items-center gap-1 text-[10px] text-ok-400">
          <Check class="w-3 h-3" />
          Copied
        </span>
      {:else}
        <Check class="w-3 h-3 text-ok-400" />
      {/if}
    {:else}
      <Copy class="w-3 h-3 text-fg-subtle group-hover:text-fg" />
    {/if}
  </span>
</button>
