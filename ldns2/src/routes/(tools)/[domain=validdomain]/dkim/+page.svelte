<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type DkimResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';

  let result = $state<DkimResponse | null>(null);
  let loading = $state(false);
  let error = $state('');

  async function load() {
    loading = true; error = '';
    try { result = await proxy.dkim(domain.name); }
    catch (e) { error = e instanceof Error ? e.message : 'DKIM probe failed'; }
    finally { loading = false; }
  }
  onMount(() => { if (!result) load(); });
</script>

<SEO title="{$page.params.domain} DKIM Selectors" description="Discovered DKIM selectors with algorithm and key length for {$page.params.domain}." />

<ToolPage
  title="{domain.name} DKIM Selectors"
  description="Probe results across {result?.probed ?? 22} common selectors."
  domainName={domain.name}
  isLoading={loading}
  error={error}
  badge={result ? { text: `${result.found}/${result.probed}`, color: result.found > 0 ? 'green' : 'gray' } : { text: 'Ready', color: 'gray' }}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={4} />
  {:else if result}
    {#if result.found === 0}
      <div class="bg-surface border border-line rounded-xl p-8 text-center">
        <p class="text-sm text-fg-muted">No DKIM records found at any of the {result.probed} probed selectors.</p>
        <p class="text-[11px] text-fg-subtle mt-2">DKIM keys live at <span class="font-mono">selector._domainkey.{domain.name}</span>. If this domain uses a non-standard selector we may not detect it.</p>
      </div>
    {:else}
      <div class="bg-surface border border-line rounded-xl divide-y divide-line">
        {#each result.selectors as sel}
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs text-primary-400">{sel.selector}._domainkey</span>
              <span class="flex items-center gap-2 text-[10px] text-fg-muted">
                {#if sel.algorithm}<span class="font-mono">{sel.algorithm}</span>{/if}
                {#if sel.keyLength}<span class="font-mono tabular-nums">{sel.keyLength}-bit</span>{/if}
                {#if sel.policy === 'y'}<span class="px-1 py-0.5 bg-warn-500/15 text-warn-400 border border-warn-500/30 rounded">testing</span>{/if}
              </span>
            </div>
            <p class="text-[11px] font-mono text-fg-muted break-all">{sel.raw}</p>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</ToolPage>
