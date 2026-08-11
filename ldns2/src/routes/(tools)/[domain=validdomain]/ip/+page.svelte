<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import { untrack } from "svelte";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import Badge from "$lib/components/Badge.svelte";
    import AsnInline from "$lib/components/AsnInline.svelte";
    import { IP_PAGE } from "$lib/utils/seoContent";
    import { generateIpFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";
    import { proxy, type AsnResponse } from "$lib/proxy-client";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupDnsRecordsWithToolState("ALL"); },
        'dns'
    );

    const aRecords = $derived(domain.toolState.dns.data?.A ?? []);
    const aaaaRecords = $derived(domain.toolState.dns.data?.AAAA ?? []);
    const hasIPv6 = $derived(aaaaRecords.length > 0);

    // Derive a stable list of IPs so the ASN effect only fires when the set
    // of IPs actually changes, not on every asnByIp mutation.
    const ipList = $derived([
        ...aRecords.map((r: { data: string }) => r.data),
        ...aaaaRecords.map((r: { data: string }) => r.data)
    ]);

    let asnByIp = $state<Record<string, AsnResponse>>({});
    $effect(() => {
        const ips = ipList;
        // untrack the asnByIp read/write so this effect does not retrigger
        // itself on every per-IP fetch completion (root cause of the page
        // "constantly refreshing". Every set was bumping the dep graph).
        untrack(() => {
            ips.forEach(async (ip) => {
                if (asnByIp[ip]) return;
                try { asnByIp = { ...asnByIp, [ip]: await proxy.asn(ip) }; } catch {}
            });
        });
    });

    const faqJsonLd = $derived(
        domain.toolState.dns.hasData
            ? generateIpFaqJsonLd(domain.name, aRecords, aaaaRecords)
            : null
    );
</script>

<SEO
    title={IP_PAGE.title($page.params.domain ?? '')}
    description={IP_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={IP_PAGE}
    domainName={domain.name}
    isLoading={domain.toolState.dns.loading}
    error={domain.toolState.dns.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.dns.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    {#if aRecords.length > 0 || aaaaRecords.length > 0}
        <div class="space-y-6">
            <!-- IPv4 -->
            {#if aRecords.length > 0}
                <div>
                    <h3 class="text-sm font-medium text-fg-muted uppercase mb-3 flex items-center gap-2">
                        IPv4 Addresses
                        <Badge text="A Record" color="blue" size="sm" />
                    </h3>
                    <div class="space-y-2">
                        {#each aRecords as record}
                            <div class="bg-surface-2 rounded-lg p-4 border border-line space-y-2">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-fg font-mono text-lg">{record.data}</span>
                                    <div class="flex items-center gap-3 flex-shrink-0">
                                        <span class="text-xs text-fg-subtle font-mono">TTL: {record.ttl}s</span>
                                        <CopyButton text={record.data} size="sm" variant="compact" />
                                    </div>
                                </div>
                                {#if asnByIp[record.data]}
                                    <AsnInline info={asnByIp[record.data]} />
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- IPv6 -->
            {#if aaaaRecords.length > 0}
                <div>
                    <h3 class="text-sm font-medium text-fg-muted uppercase mb-3 flex items-center gap-2">
                        IPv6 Addresses
                        <Badge text="AAAA Record" color="green" size="sm" />
                    </h3>
                    <div class="space-y-2">
                        {#each aaaaRecords as record}
                            <div class="bg-surface-2 rounded-lg p-4 border border-line space-y-2">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-fg font-mono text-sm break-all">{record.data}</span>
                                    <div class="flex items-center gap-3 flex-shrink-0">
                                        <span class="text-xs text-fg-subtle font-mono">TTL: {record.ttl}s</span>
                                        <CopyButton text={record.data} size="sm" variant="compact" />
                                    </div>
                                </div>
                                {#if asnByIp[record.data]}
                                    <AsnInline info={asnByIp[record.data]} />
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="bg-surface-2 rounded-lg p-4 border border-line">
                    <p class="text-fg-muted text-sm">No IPv6 (AAAA) records found. This domain does not support IPv6.</p>
                </div>
            {/if}

            <!-- Summary -->
            <div class="bg-surface-2 rounded-lg p-4 border border-line">
                <h3 class="text-sm font-medium text-fg-muted uppercase mb-2">Summary</h3>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span class="text-fg-muted">{aRecords.length} IPv4 address{aRecords.length !== 1 ? 'es' : ''}</span>
                    <span class="text-line-strong">|</span>
                    <span class="text-fg-muted">{aaaaRecords.length} IPv6 address{aaaaRecords.length !== 1 ? 'es' : ''}</span>
                    <span class="text-line-strong">|</span>
                    <span class={hasIPv6 ? 'text-ok-400' : 'text-warn-400'}>
                        {hasIPv6 ? 'IPv6 Enabled' : 'IPv4 Only'}
                    </span>
                </div>
            </div>
        </div>
    {:else if domain.toolState.dns.hasData}
        <div class="bg-surface-2 rounded-lg p-6 border border-line text-center">
            <p class="text-fg-muted">No IP address records found for {domain.name}.</p>
        </div>
    {/if}
</SEOToolPage>
