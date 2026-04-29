<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type SecurityHeadersResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';

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
    ok: 'bg-green-500/15 text-green-400 border-green-500/30',
    warn: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    bad: 'bg-red-500/15 text-red-400 border-red-500/30'
  } as const;

  const okCount = $derived(result ? result.audit.filter((c) => c.level === 'ok').length : 0);
  const total = $derived(result?.audit.length ?? 0);
</script>

<SEO title="{$page.params.domain} Security Headers" description="HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy audit for {$page.params.domain}." />

<ToolPage
  title="{domain.name} Security Headers"
  description="Audit of HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy."
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
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-sm text-gray-100">{check.label}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border {auditClass[check.level]}">
              {check.level === 'ok' ? '✓ Good' : check.level === 'warn' ? '! Weak' : '× Missing'}
            </span>
          </div>
          <p class="text-[11px] text-gray-400">{check.hint}</p>
          {#if check.value}
            <p class="text-[11px] font-mono text-gray-300 mt-2 break-all p-2 bg-gray-950 rounded">{check.value}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</ToolPage>
