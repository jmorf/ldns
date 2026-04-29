<script lang="ts">
  import { extensionState, type TabName } from '$lib/state/extension-state.svelte';
  import { Database, IdCard, AtSign, Cpu, Network } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';

  const tabs: { id: TabName; label: string; icon: typeof Database }[] = [
    { id: 'dns', label: 'DNS', icon: Database },
    { id: 'rdap', label: 'RDAP', icon: IdCard },
    { id: 'email', label: 'Email', icon: AtSign },
    { id: 'server', label: 'Server', icon: Cpu },
    { id: 'subdomains', label: 'Subs', icon: Network }
  ];

  function handleTabClick(tabId: TabName) {
    extensionState.setActiveTab(tabId);
  }
</script>

<nav class="px-3 pt-2 pb-1.5 border-b border-line flex items-center gap-0.5">
  {#each tabs as tab}
    {@const Icon = tab.icon}
    {@const active = extensionState.activeTab === tab.id}
    <button
      onclick={() => handleTabClick(tab.id)}
      class={cn(
        'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all',
        active
          ? 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/25'
          : 'text-fg-muted hover:text-fg hover:bg-surface-3'
      )}
      aria-pressed={active}
    >
      <Icon class={cn('w-3 h-3', active ? '' : 'opacity-60')} />
      <span>{tab.label}</span>
    </button>
  {/each}
</nav>
