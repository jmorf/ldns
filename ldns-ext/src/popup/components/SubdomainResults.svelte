<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import QuickActions from './QuickActions.svelte';
  import CopyRow from './CopyRow.svelte';
  import { Copy, Check, Search, Download } from 'lucide-svelte';
  import { createCopied } from '$lib/utils/copied.svelte';
  import { csvCell } from '$lib/utils/export';

  const copied = createCopied();
  let filter = $state('');

  function copyAll() {
    void copied.copy(filtered.join('\n'), 'all');
  }

  function exportCsv() {
    const data = extensionState.subdomainState.data;
    if (!data) return;
    // csvCell neutralizes spreadsheet formula injection, subdomain strings
    // come from attacker-controllable CT-log SANs.
    const csv = 'subdomain\n' + filtered.map((s) => csvCell(s)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extensionState.domain}-subdomains.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleScan() {
    const input = extensionState.inputDomain;
    if (input && input !== extensionState.domain) {
      await extensionState.setDomain(input, true);
    }
    // User explicitly asked for a scan, bypass the cache.
    extensionState.querySubdomains(true);
  }

  const subs = $derived(extensionState.subdomainState.data?.subdomains ?? []);
  const filtered = $derived(
    filter ? subs.filter((s) => s.toLowerCase().includes(filter.toLowerCase())) : subs
  );
</script>

<div class="space-y-2.5">
  {#if extensionState.subdomainState.loading}
    <LoadingState message="Scanning Certificate Transparency logs…" />
  {:else if extensionState.subdomainState.error}
    <ErrorState
      message={extensionState.subdomainState.error}
      service="crt.sh"
      notFoundIsEmpty
      onRetry={handleScan}
      statusUrl={`https://crt.sh/?q=%25.${extensionState.rootDomain || extensionState.domain}`}
    />
    <div class="text-center">
      <button
        onclick={handleScan}
        class="px-4 py-1.5 text-xs bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/25 transition-colors"
      >
        Retry
      </button>
    </div>
  {:else if extensionState.subdomainState.hasData && extensionState.subdomainState.data}
    {@const total = extensionState.subdomainState.data.total}
    <!-- Top bar -->
    <div class="flex items-center justify-between gap-2 pb-2 border-b border-line">
      <span class="text-[11px] text-fg-muted">
        <span class="text-fg font-semibold tnum">{filtered.length}</span>
        {#if filter}<span class="text-fg-subtle"> of {total}</span>{/if}
        subdomain{filtered.length !== 1 ? 's' : ''}
      </span>
      <div class="flex items-center gap-2">
        <button
          onclick={copyAll}
          class="flex items-center gap-1 text-[10px] text-fg-muted hover:text-fg transition-colors"
          title="Copy all visible"
        >
          {#if copied.is('all')}
            <Check class="w-3 h-3 text-ok-400" />
            <span class="text-ok-400">Copied</span>
          {:else}
            <Copy class="w-3 h-3" />
            <span>Copy</span>
          {/if}
        </button>
        <button
          onclick={exportCsv}
          class="flex items-center gap-1 text-[10px] text-fg-muted hover:text-fg transition-colors"
          title="Export visible as CSV"
        >
          <Download class="w-3 h-3" />
          <span>CSV</span>
        </button>
        <RefreshButton onClick={handleScan} loading={extensionState.subdomainState.loading} label="Rescan" />
      </div>
    </div>

    <!-- Filter -->
    <div class="relative">
      <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-fg-subtle" />
      <input
        type="text"
        bind:value={filter}
        placeholder="Filter subdomains…"
        class="w-full pl-7 pr-2 py-1 text-[11px] bg-surface-2 border border-line rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500/50"
      />
    </div>

    {#if filtered.length > 0}
      <div class="card-flush">
        <div class="divide-y divide-line max-h-[420px] overflow-y-auto">
          {#each filtered as sub}
            <CopyRow value={sub} k={sub} {copied} class="px-3 py-1" label="Copy subdomain">
              <p class="text-xs text-fg font-mono break-all flex-1">{sub}</p>
            </CopyRow>
          {/each}
        </div>
      </div>
    {:else}
      <p class="text-center text-xs text-fg-subtle py-6">No matches.</p>
    {/if}
  {:else}
    <EmptyState title="Subdomain discovery" hint="Scan Certificate Transparency logs for subdomains.">
      <button
        onclick={handleScan}
        class="px-4 py-1.5 text-xs bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/25 transition-colors"
      >
        Scan Subdomains
      </button>
    </EmptyState>
  {/if}

  {#if extensionState.subdomainState.hasData}
    <QuickActions tab="subdomains" />
  {/if}
</div>
