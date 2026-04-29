<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type SubdomainsResult } from '$lib/proxy-client';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import { Search, Download, AlertTriangle, Clock, Activity } from 'lucide-svelte';
  import { SUBDOMAINS_PAGE } from '$lib/utils/seoContent';

  // Cap rendered rows so domains with massive CT corpora (google.com,
  // cloudflare.com, …) don't lock up the browser trying to mount tens of
  // thousands of nodes. Filter and CSV export still operate on the full set.
  const RENDER_CAP = 500;

  let result = $state<SubdomainsResult | null>(null);
  let loading = $state(false);
  let networkError = $state('');
  let filter = $state('');

  async function load(force = false) {
    loading = true;
    networkError = '';
    try {
      result = await proxy.subdomains(domain.name, { force });
    } catch (e) {
      networkError = e instanceof Error ? e.message : 'Subdomain discovery failed';
    } finally {
      loading = false;
    }
  }
  // Retry from a structured failure must bypass the (short) error cache —
  // otherwise the user clicks Retry, the CDN serves the same cached failure
  // for the next 5 minutes, and nothing changes.
  function retry() {
    return load(true);
  }

  function copyAll() {
    if (!subdomains.length) return;
    navigator.clipboard.writeText(filtered.join('\n'));
  }
  function exportCsv() {
    if (!subdomains.length) return;
    const csv = 'subdomain\n' + filtered.map((s) => `"${s.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain.name}-subdomains.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onMount(() => {
    if (!result) load();
  });

  const success = $derived(result?.ok === true ? result : null);
  const failure = $derived(result?.ok === false ? result : null);
  const subdomains = $derived(success?.subdomains ?? []);
  const total = $derived(success?.total ?? 0);

  const filtered = $derived.by(() => {
    if (!subdomains.length) return [] as string[];
    if (!filter) return subdomains;
    const f = filter.toLowerCase();
    return subdomains.filter((s) => s.toLowerCase().includes(f));
  });
  const visible = $derived(filtered.slice(0, RENDER_CAP));
  const truncated = $derived(filtered.length > RENDER_CAP);

  // Map structured failure reasons to a presentable icon + heading.
  // Body copy comes from the server; this only adds visual hierarchy.
  function failureIcon(reason: string | undefined) {
    switch (reason) {
      case 'timeout':
        return Clock;
      case 'overloaded':
      case 'rate-limited':
        return Activity;
      case 'no-results':
        return Search;
      default:
        return AlertTriangle;
    }
  }
  function failureHeading(reason: string | undefined) {
    switch (reason) {
      case 'timeout':
        return 'crt.sh timed out';
      case 'overloaded':
        return 'crt.sh is overloaded right now';
      case 'rate-limited':
        return 'crt.sh rate-limited the request';
      case 'bad-gateway':
        return 'crt.sh returned a gateway error';
      case 'no-results':
        return 'No subdomains found in CT logs';
      default:
        return 'Subdomain discovery failed';
    }
  }
</script>

<SEO title={SUBDOMAINS_PAGE.title($page.params.domain ?? '')} description={SUBDOMAINS_PAGE.description($page.params.domain ?? '')} />

<SEOToolPage config={SUBDOMAINS_PAGE} domainName={domain.name} isLoading={loading && !result} error={networkError}>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={retry} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={5} />
  {:else if failure}
    {@const Icon = failureIcon(failure.reason)}
    <div class="bg-surface-2 border border-line rounded-xl p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-warn-500/15 border border-warn-500/30 flex items-center justify-center">
          <Icon class="w-5 h-5 text-warn-400" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-semibold text-fg">{failureHeading(failure.reason)}</h3>
          <p class="mt-2 text-sm text-fg-muted leading-relaxed">{failure.error}</p>
          <div class="mt-5 flex flex-wrap items-center gap-3">
            <button
              onclick={retry}
              disabled={loading}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-3 border border-line rounded-lg text-fg hover:border-primary-500/30 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Retrying…' : 'Retry now'}
            </button>
            <a
              href="https://crt.sh/?q=%25.{domain.name}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
            >
              Check crt.sh directly →
            </a>
          </div>
        </div>
      </div>
      <div class="mt-5 pt-4 border-t border-line">
        <p class="text-[11px] text-fg-subtle leading-relaxed">
          Subdomain discovery uses crt.sh, a free public Certificate Transparency log search.
          When that service is overloaded or down, no other LDNS data is affected — try the
          <a href="/{domain.name}" class="text-primary-400 hover:underline">DNS</a>,
          <a href="/{domain.name}/server" class="text-primary-400 hover:underline">server</a>, or
          <a href="/{domain.name}/security" class="text-primary-400 hover:underline">security</a> tools instead.
        </p>
      </div>
    </div>
  {:else if success}
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-line">
        <p class="text-sm text-fg-muted">
          <span class="text-fg font-medium tabular-nums">{filtered.length.toLocaleString()}</span>
          {#if filter}<span class="text-fg-subtle"> of {total.toLocaleString()}</span>{/if}
          subdomain{filtered.length === 1 ? '' : 's'} from CT logs
        </p>
        <div class="flex gap-3">
          <button onclick={copyAll} class="text-[11px] text-fg-muted hover:text-fg transition-colors">Copy all</button>
          <button onclick={exportCsv} class="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg transition-colors"><Download class="w-3 h-3" />CSV</button>
        </div>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
        <input
          bind:value={filter}
          placeholder="Filter subdomains…"
          class="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line rounded-lg text-sm text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500/60"
        />
      </div>

      {#if filtered.length > 0}
        <div class="bg-surface-2 border border-line rounded-xl divide-y divide-line max-h-[640px] overflow-y-auto">
          {#each visible as sub}
            <div class="flex items-center justify-between gap-3 p-3 hover:bg-surface-3 transition-colors group">
              <span class="font-mono text-xs text-fg break-all flex-1">{sub}</span>
              <CopyButton text={sub} size="sm" variant="compact" />
            </div>
          {/each}
        </div>
        {#if truncated}
          <div class="bg-warn-500/10 border border-warn-500/30 rounded-lg px-4 py-3 text-[12px] text-warn-400 leading-relaxed">
            Showing the first <span class="font-medium tabular-nums">{RENDER_CAP.toLocaleString()}</span>
            of <span class="font-medium tabular-nums">{filtered.length.toLocaleString()}</span> matches.
            Use the filter above to narrow the list, or click <span class="font-mono">CSV</span> to export every result.
          </div>
        {/if}
      {:else}
        <p class="text-center text-sm text-fg-subtle py-6">No subdomains match the filter.</p>
      {/if}

      <p class="text-[10px] text-fg-subtle text-center">Subdomains via crt.sh public Certificate Transparency log search · cached at the edge.</p>
    </div>
  {/if}
</SEOToolPage>
