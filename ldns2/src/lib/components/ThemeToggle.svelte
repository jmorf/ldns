<script lang="ts">
  import { Sun, Moon, Monitor } from 'lucide-svelte';
  import { theme } from '$lib/theme';
</script>

<button
  type="button"
  onclick={() => theme.cycle()}
  class="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
  aria-label={`Theme: ${theme.current} (click to cycle)`}
  title={theme.current === 'system' ? `System (${theme.resolved})` : theme.current === 'dark' ? 'Dark' : 'Light'}
>
  {#if theme.current === 'system'}
    <Monitor class="w-4 h-4" />
  {:else if theme.current === 'dark'}
    <Moon class="w-4 h-4" />
  {:else}
    <Sun class="w-4 h-4" />
  {/if}
</button>
