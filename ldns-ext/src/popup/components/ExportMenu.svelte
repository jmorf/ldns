<script lang="ts">
  import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-svelte';
  import { downloadJson, downloadDnsCsv, downloadZoneFile } from '$lib/utils/export';
  import { extensionState } from '$lib/state/extension-state.svelte';

  let open = $state(false);
  let containerEl = $state<HTMLDivElement | null>(null);

  function close() {
    open = false;
  }

  function pickJson() {
    downloadJson();
    close();
  }

  function pickCsv() {
    downloadDnsCsv();
    close();
  }

  function pickZone() {
    downloadZoneFile();
    close();
  }

  // Close on outside click or Escape
  $effect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerEl && !containerEl.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  });

  const hasDns = $derived(extensionState.dnsState.hasData);
</script>

<div class="relative" bind:this={containerEl}>
  <button
    onclick={() => (open = !open)}
    class="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg transition-colors"
    aria-label="Download lookup results"
    aria-haspopup="menu"
    aria-expanded={open}
    title="Download"
  >
    <Download class="w-3.5 h-3.5" />
  </button>

  {#if open}
    <div
      role="menu"
      class="absolute top-full right-0 mt-1 z-30 min-w-[180px] bg-surface-2 border border-line rounded-xl shadow-lg overflow-hidden fade-in-up"
    >
      <button
        role="menuitem"
        onclick={pickCsv}
        disabled={!hasDns}
        class="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-fg hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FileSpreadsheet class="w-3.5 h-3.5 text-fg-muted" />
        <div class="flex-1 min-w-0">
          <div class="font-medium">DNS records (CSV)</div>
          <div class="text-[10px] text-fg-subtle">type, data, ttl</div>
        </div>
      </button>
      <button
        role="menuitem"
        onclick={pickZone}
        disabled={!hasDns}
        class="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-fg hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-t border-line"
      >
        <FileText class="w-3.5 h-3.5 text-fg-muted" />
        <div class="flex-1 min-w-0">
          <div class="font-medium">Zone file (BIND)</div>
          <div class="text-[10px] text-fg-subtle">records as {'{domain}'}.zone</div>
        </div>
      </button>
      <button
        role="menuitem"
        onclick={pickJson}
        class="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-fg hover:bg-surface-3 transition-colors border-t border-line"
      >
        <FileJson class="w-3.5 h-3.5 text-fg-muted" />
        <div class="flex-1 min-w-0">
          <div class="font-medium">Full lookup (JSON)</div>
          <div class="text-[10px] text-fg-subtle">every tab's data</div>
        </div>
      </button>
    </div>
  {/if}
</div>
