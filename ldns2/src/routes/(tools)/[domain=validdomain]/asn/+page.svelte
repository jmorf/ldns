<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type AsnResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';

  let results = $state<Record<string, AsnResponse>>({});
  let loading = $state(false);
  let error = $state('');

  async function load() {
    if (!domain.toolState.dns?.hasData) {
      try { await domain.lookupDnsRecordsWithToolState('ALL'); } catch { /* show empty state below */ }
    }
    const ips = [
      ...((domain.toolState.dns?.data?.A ?? []).map((r: { data: string }) => r.data)),
      ...((domain.toolState.dns?.data?.AAAA ?? []).map((r: { data: string }) => r.data))
    ];
    if (ips.length === 0) { error = `No A or AAAA records found for ${domain.name}`; return; }

    loading = true; error = ''; results = {};
    await Promise.all(ips.map(async (ip) => {
      try {
        const r = await proxy.asn(ip);
        results = { ...results, [ip]: r };
      } catch { /* per-IP fail, skip */ }
    }));
    loading = false;
  }

  onMount(() => { if (Object.keys(results).length === 0) load(); });
</script>

<SEO title="{$page.params.domain} ASN / Origin AS" description="Origin AS number, AS name, country, and announced prefix for every IP returned by {$page.params.domain}." />

<ToolPage
  title="{domain.name} ASN / Origin AS"
  description="Origin AS number, name, country, and announced prefix for every IP."
  domainName={domain.name}
  isLoading={loading}
  error={error}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={load} loading={loading} variant="secondary" />
  {/snippet}

  {#if loading && Object.keys(results).length === 0}
    <SkeletonRows rows={3} />
  {:else if Object.keys(results).length > 0}
    <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800">
      {#each Object.entries(results) as [ip, info]}
        <div class="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">IP</p>
            <p class="font-mono text-sm text-white truncate" title={ip}>{ip}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">ASN</p>
            <p class="font-mono text-sm text-gray-200">{info.asn ? `AS${info.asn}` : '—'}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-[10px] uppercase tracking-wider text-gray-500">AS Name</p>
            <p class="text-sm text-gray-200 truncate" title={info.asName ?? ''}>{info.asName ?? '—'}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">Country</p>
            <p class="font-mono text-sm text-gray-200">{info.country ?? '—'}</p>
          </div>
          {#if info.prefix}
            <div class="md:col-span-5 -mt-2">
              <p class="text-[10px] text-gray-500">Announced prefix: <span class="font-mono text-gray-400">{info.prefix}</span></p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    <p class="text-[10px] text-gray-600 text-center mt-4">Origin lookup via Team Cymru DNS service · cached 1 hour at the edge.</p>
  {/if}
</ToolPage>
