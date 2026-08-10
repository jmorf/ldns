<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { Search, X } from 'lucide-svelte';
  import { DNS_ENDPOINTS } from '@ldns/core/constants';
  import type { DnsEndpoint } from '@ldns/core/types';
  import { cn } from '$lib/utils/cn';

  let inputValue = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);


  async function handleSubmit(e: Event) {
    e.preventDefault();
    const value = inputValue.trim();
    if (value) {
      extensionState.setActiveTab('dns');
      await extensionState.setDomain(value, true);
    }
  }

  function handleInput(e: Event) {
    inputValue = (e.target as HTMLInputElement).value;
    extensionState.inputDomain = inputValue.trim();
    if (!inputValue.trim()) extensionState.reset();
  }

  function clearInput() {
    inputValue = '';
    extensionState.reset();
    inputEl?.focus();
  }

  // Keyboard shortcut: "/" focuses the input
  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== inputEl) {
        e.preventDefault();
        inputEl?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Sync input with state on initial mount
  $effect(() => {
    if (extensionState.domain && !inputValue) {
      inputValue = extensionState.domain;
      extensionState.inputDomain = extensionState.domain;
    }
  });

  function setEndpoint(ep: DnsEndpoint) {
    extensionState.setEndpoint(ep);
    if (extensionState.domain && extensionState.isValidDomain) {
      extensionState.queryDns();
      extensionState.queryEmail();
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-2">
  <div class="flex gap-2">
    <div class="relative flex-1">
      <input
        bind:this={inputEl}
        type="text"
        value={inputValue}
        oninput={handleInput}
        placeholder="Enter domain or URL"
        class="w-full pl-3 pr-12 py-2 text-sm bg-surface-2 border border-line rounded-xl text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 font-medium"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
      {#if inputValue}
        <button
          type="button"
          onclick={clearInput}
          class="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 text-fg-subtle hover:text-fg"
          aria-label="Clear"
        >
          <X class="w-3 h-3" />
        </button>
      {/if}
      <kbd class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-fg-subtle border border-line rounded px-1 py-0.5">/</kbd>
    </div>
    <button
      type="submit"
      disabled={!inputValue.trim()}
      class="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-3 disabled:text-fg-subtle disabled:cursor-not-allowed text-white rounded-xl transition-colors active:scale-[0.97]"
      aria-label="Look up domain"
    >
      <Search class="w-3.5 h-3.5" />
    </button>
  </div>

  <div class="flex items-center justify-end gap-2">
    <!-- Right: Segmented endpoint switcher -->
    <div class="flex items-center gap-0.5 p-0.5 bg-surface-2 border border-line rounded-lg">
      {#each Object.entries(DNS_ENDPOINTS) as [key, { name }]}
        {@const active = extensionState.endpoint === key}
        <button
          type="button"
          onclick={() => setEndpoint(key as DnsEndpoint)}
          class={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors',
            active ? 'bg-primary-500/15 text-primary-400' : 'text-fg-muted hover:text-fg'
          )}
          aria-pressed={active}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
</form>
