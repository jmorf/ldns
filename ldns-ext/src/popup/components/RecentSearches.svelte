<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { Clock, Trash2, Globe } from 'lucide-svelte';
  import EmptyState from './EmptyState.svelte';

  async function handleSearchClick(domain: string) {
    await extensionState.setDomain(domain, true);
  }

  async function handleClear() {
    await extensionState.clearRecent();
  }

  function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  const hasRecent = $derived(extensionState.recentSearches.length > 0);
</script>

<div class="space-y-2.5">
  {#if hasRecent}
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-fg-muted">
        <Clock class="w-3.5 h-3.5" />
        <span class="text-[11px] uppercase tracking-wide font-semibold">Recent</span>
      </div>
      <button
        onclick={handleClear}
        class="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-fg-subtle hover:text-bad-400 hover:bg-surface-3 rounded-lg transition-colors"
        aria-label="Clear recent searches"
      >
        <Trash2 class="w-3 h-3" />
        Clear
      </button>
    </div>

    <div class="space-y-1">
      {#each extensionState.recentSearches as search}
        <button
          onclick={() => handleSearchClick(search.domain)}
          class="w-full flex items-center justify-between px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-xl border border-line transition-colors text-left"
        >
          <div class="flex items-center gap-2">
            <Globe class="w-3.5 h-3.5 text-fg-subtle" />
            <span class="text-xs text-fg">{search.domain}</span>
          </div>
          <span class="text-[10px] text-fg-subtle tnum">{formatTimeAgo(search.timestamp)}</span>
        </button>
      {/each}
    </div>
  {:else}
    <EmptyState title="No recent searches" hint="Enter a domain above to get started." />
  {/if}
</div>
