<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import Badge from "$lib/components/Badge.svelte";
    import { TXT_PAGE } from "$lib/utils/seoContent";
    import { generateTxtFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupDnsRecordsWithToolState("TXT"); },
        'dns'
    );

    const txtRecords = $derived(
        domain.toolState.dns.data?.TXT ?? []
    );

    const faqJsonLd = $derived(
        domain.toolState.dns.hasData
            ? generateTxtFaqJsonLd(domain.name, txtRecords)
            : null
    );

    function getTxtType(data: string): string {
        if (data.startsWith('"v=spf1') || data.startsWith('v=spf1')) return 'SPF';
        if (data.startsWith('"v=DMARC1') || data.startsWith('v=DMARC1')) return 'DMARC';
        if (data.startsWith('"v=DKIM1') || data.startsWith('v=DKIM1')) return 'DKIM';
        if (data.includes('google-site-verification')) return 'Google';
        if (data.includes('MS=')) return 'Microsoft';
        if (data.includes('facebook-domain-verification')) return 'Facebook';
        if (data.includes('apple-domain-verification')) return 'Apple';
        return 'TXT';
    }

    type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'gray' | 'indigo' | 'pink';

    function getBadgeColor(type: string): BadgeColor {
        switch (type) {
            case 'SPF': return 'green';
            case 'DMARC': return 'blue';
            case 'DKIM': return 'purple';
            case 'Google': case 'Microsoft': case 'Facebook': case 'Apple': return 'yellow';
            default: return 'gray';
        }
    }
</script>

<SEO
    title={TXT_PAGE.title($page.params.domain ?? '')}
    description={TXT_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={TXT_PAGE}
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

    {#if txtRecords.length > 0}
        <div class="space-y-3">
            {#each txtRecords as record}
                {@const txtType = getTxtType(record.data)}
                <div class="bg-surface-2 border border-line rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <Badge text={txtType} color={getBadgeColor(txtType)} size="sm" />
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-fg-muted font-mono">TTL: {record.ttl}s</span>
                            <CopyButton text={record.data} size="sm" variant="compact" />
                        </div>
                    </div>
                    <p class="text-white font-mono text-sm break-all">{record.data}</p>
                </div>
            {/each}
        </div>
    {:else if domain.toolState.dns.hasData}
        <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
            <p class="text-fg-muted">No TXT records found for {domain.name}.</p>
        </div>
    {/if}
</SEOToolPage>
