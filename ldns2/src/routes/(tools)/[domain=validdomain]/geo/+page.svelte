<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type GeoResponse } from '$lib/proxy-client';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import { GEO_PAGE } from '$lib/utils/seoContent';

  let results = $state<Record<string, GeoResponse>>({});
  let loading = $state(false);
  let error = $state('');

  async function load() {
    if (!domain.toolState.dns?.hasData) {
      try { await domain.lookupDnsRecordsWithToolState('ALL'); } catch {}
    }
    const ips = [
      ...((domain.toolState.dns?.data?.A ?? []).map((r: { data: string }) => r.data)),
      ...((domain.toolState.dns?.data?.AAAA ?? []).map((r: { data: string }) => r.data))
    ];
    if (ips.length === 0) { error = `No A or AAAA records found for ${domain.name}`; return; }

    loading = true; error = ''; results = {};
    await Promise.all(ips.map(async (ip) => {
      try { results = { ...results, [ip]: await proxy.geo(ip) }; } catch {}
    }));
    loading = false;
  }
  onMount(() => { if (Object.keys(results).length === 0) load(); });
</script>

<SEO title="{$page.params.domain} IP Geolocation" description="Approximate location, ISP, and ASN for every IP returned by {$page.params.domain}." />

<SEOToolPage
  config={GEO_PAGE}
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
  {:else}
    <div class="space-y-4">
      {#each Object.entries(results) as [ip, info]}
        <div class="bg-surface border border-line rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="font-mono text-sm text-fg">{ip}</p>
            {#if info.ok}
              <span class="text-[11px] text-fg-muted">{info.city || info.region}, {info.country}</span>
            {/if}
          </div>
          {#if info.ok}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><p class="text-[10px] uppercase tracking-wider text-fg-subtle">Country</p><p class="text-fg mt-0.5">{info.country} <span class="text-[11px] text-fg-subtle font-mono">{info.countryCode}</span></p></div>
              <div><p class="text-[10px] uppercase tracking-wider text-fg-subtle">Region</p><p class="text-fg mt-0.5">{info.region || '—'}</p></div>
              <div><p class="text-[10px] uppercase tracking-wider text-fg-subtle">City</p><p class="text-fg mt-0.5">{info.city || '—'}</p></div>
              <div><p class="text-[10px] uppercase tracking-wider text-fg-subtle">Timezone</p><p class="text-fg mt-0.5 font-mono text-xs">{info.timezone ?? '—'}</p></div>
              {#if info.org}<div class="md:col-span-2"><p class="text-[10px] uppercase tracking-wider text-fg-subtle">Organization</p><p class="text-fg mt-0.5">{info.org}</p></div>{/if}
              {#if info.isp}<div class="md:col-span-2"><p class="text-[10px] uppercase tracking-wider text-fg-subtle">ISP</p><p class="text-fg mt-0.5">{info.isp}</p></div>{/if}
            </div>
            <a class="block mt-3 text-[11px] text-primary-400 hover:underline" href={`https://www.openstreetmap.org/?mlat=${info.lat}&mlon=${info.lon}#map=10/${info.lat}/${info.lon}`} target="_blank" rel="noopener noreferrer">View on OpenStreetMap →</a>
          {:else}
            <p class="text-sm text-fg-muted">{info.error}</p>
          {/if}
        </div>
      {/each}
      <p class="text-[10px] text-fg-subtle text-center">Geolocation is approximate (country/region usually accurate, city often not).</p>
    </div>
  {/if}
</SEOToolPage>
