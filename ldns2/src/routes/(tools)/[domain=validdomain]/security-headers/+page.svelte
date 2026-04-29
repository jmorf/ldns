<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type SecurityHeadersResponse } from '$lib/proxy-client';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import { SECURITY_HEADERS_PAGE } from '$lib/utils/seoContent';

  let result = $state<SecurityHeadersResponse | null>(null);
  let loading = $state(false);
  let error = $state('');

  async function load() {
    loading = true; error = '';
    try { result = await proxy.securityHeaders(domain.name); }
    catch (e) { error = e instanceof Error ? e.message : 'Lookup failed'; }
    finally { loading = false; }
  }
  onMount(() => { if (!result) load(); });

  const auditClass = {
    ok: 'bg-ok-500/15 text-ok-400 border-ok-500/30',
    warn: 'bg-warn-500/15 text-warn-400 border-warn-500/30',
    bad: 'bg-bad-500/15 text-bad-400 border-bad-500/30'
  } as const;

  const okCount = $derived(result ? result.audit.filter((c) => c.level === 'ok').length : 0);
  const total = $derived(result?.audit.length ?? 0);
</script>

<SEO title="{$page.params.domain} Security Headers" description="HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy audit for {$page.params.domain}." />

<SEOToolPage
  config={SECURITY_HEADERS_PAGE}
  domainName={domain.name}
  isLoading={loading}
  error={error}
  badge={result ? { text: `${okCount}/${total} OK`, color: okCount === total ? 'green' : okCount >= total / 2 ? 'yellow' : 'red' } : { text: 'Ready', color: 'gray' }}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={6} />
  {:else if result}
    <div class="space-y-3">
      {#each result.audit as check}
        <div class="bg-surface border border-line rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-sm text-fg">{check.label}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border {auditClass[check.level]}">
              {check.level === 'ok' ? '✓ Good' : check.level === 'warn' ? '! Weak' : '× Missing'}
            </span>
          </div>
          <p class="text-[11px] text-fg-muted">{check.hint}</p>
          {#if check.value}
            <p class="text-[11px] font-mono text-fg-muted mt-2 break-all p-2 bg-surface rounded">{check.value}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</SEOToolPage>
