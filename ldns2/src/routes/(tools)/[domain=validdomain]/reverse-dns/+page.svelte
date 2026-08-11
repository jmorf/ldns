<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { page } from '$app/stores';
  import SEOToolPage from '$lib/components/SEOToolPage.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import AsnInline from '$lib/components/AsnInline.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import { lookupPtrBatch } from '@ldns/core/ptr';
  import { proxy, type AsnResponse } from '$lib/proxy-client';
  import { REVERSE_DNS_PAGE } from '$lib/utils/seoContent';
  import { useToolPage } from '$lib/utils/useToolPage.svelte';

  let ptrResults = $state<Record<string, string>>({});
  let asnByIp = $state<Record<string, AsnResponse>>({});
  let loading = $state(false);

  async function doLookup() {
    if (!domain.name || !domain.isValid) return;

    loading = true;
    ptrResults = {};
    asnByIp = {};

    if (!domain.toolState.dns.hasData) {
      await domain.lookupDnsRecordsWithToolState('ALL');
    }

    const a = domain.toolState.dns.data?.A?.map((r: { data: string }) => r.data) ?? [];
    const aaaa = domain.toolState.dns.data?.AAAA?.map((r: { data: string }) => r.data) ?? [];
    const ips = [...a, ...aaaa];

    // PTR + ASN in parallel, PTR uses the shared module (covers IPv4 + IPv6).
    const [ptr] = await Promise.all([
      lookupPtrBatch(ips),
      ...ips.map(async (ip) => {
        try {
          asnByIp = { ...asnByIp, [ip]: await proxy.asn(ip) };
        } catch {
          /* per-IP fail */
        }
      })
    ]);
    ptrResults = ptr;
    loading = false;
  }

  const { handleRefresh } = useToolPage(doLookup, 'dns');

  const aRecords = $derived(domain.toolState.dns.data?.A ?? []);
  const aaaaRecords = $derived(domain.toolState.dns.data?.AAAA ?? []);
  const allRecords = $derived([...aRecords, ...aaaaRecords]);
</script>

<SEO title={REVERSE_DNS_PAGE.title($page.params.domain ?? '')} description={REVERSE_DNS_PAGE.description($page.params.domain ?? '')} />

<SEOToolPage
  config={REVERSE_DNS_PAGE}
  domainName={domain.name}
  isLoading={loading || domain.toolState.dns.loading}
  error={domain.toolState.dns.error}
>
  {#snippet actions()}
    <ShareButton />
    <RefreshButton onClick={handleRefresh} loading={loading || domain.toolState.dns.loading} variant="secondary" />
  {/snippet}

  {#if loading && allRecords.length === 0}
    <SkeletonRows rows={3} />
  {:else if allRecords.length > 0}
    <div class="bg-surface-2 border border-line rounded-xl divide-y divide-line">
      {#each allRecords as record}
        {@const isV6 = String(record.data).includes(':')}
        <div class="p-4 flex items-start gap-4 group">
          <div class="flex-shrink-0">
            <span class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">{isV6 ? 'IPv6' : 'IPv4'}</span>
          </div>
          <div class="flex-1 min-w-0 space-y-1.5">
            <p class="font-mono text-sm text-fg break-all">{record.data}</p>
            <p class="text-[11px] font-mono">
              <span class="text-fg-subtle">PTR </span>
              {#if ptrResults[record.data] === undefined && loading}
                <span class="text-fg-subtle italic">resolving…</span>
              {:else if ptrResults[record.data]}
                <span class="text-ok-400">{ptrResults[record.data]}</span>
              {:else}
                <span class="text-fg-subtle">no PTR record</span>
              {/if}
            </p>
            {#if asnByIp[record.data]}
              <AsnInline info={asnByIp[record.data]} />
            {/if}
          </div>
          <CopyButton text={record.data} size="sm" variant="compact" />
        </div>
      {/each}
    </div>
  {:else if domain.toolState.dns.hasData}
    <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
      <p class="text-fg-muted text-sm">No A or AAAA records found for {domain.name}. Reverse DNS needs an IP first.</p>
    </div>
  {/if}
</SEOToolPage>
