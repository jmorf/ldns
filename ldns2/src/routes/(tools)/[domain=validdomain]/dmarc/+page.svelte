<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import DMARCAnalyzer from "$lib/components/DMARCAnalyzer.svelte";
    import { DMARC_PAGE } from "$lib/utils/seoContent";
    import { generateDmarcFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupEmailRecords(); },
        'email'
    );

    const emailData = $derived(domain.toolState.email.data);
    const dmarcRecords = $derived(emailData?.dmarc ?? []);

    const faqJsonLd = $derived(
        domain.toolState.email.hasData
            ? generateDmarcFaqJsonLd(domain.name, emailData)
            : null
    );
</script>

<SEO
    title={DMARC_PAGE.title($page.params.domain ?? '')}
    description={DMARC_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={DMARC_PAGE}
    domainName={domain.name}
    isLoading={domain.toolState.email.loading}
    error={domain.toolState.email.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.email.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    {#if dmarcRecords.length > 0}
        <!-- Raw DMARC Record -->
        <div class="bg-surface-2 border border-line rounded-xl p-4 mb-6">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-medium text-fg-muted uppercase">DMARC Record</h3>
                <CopyButton text={dmarcRecords[0]?.data ?? ''} size="sm" variant="compact" />
            </div>
            <p class="text-fg font-mono text-sm break-all">{dmarcRecords[0]?.data}</p>
        </div>

        <!-- DMARC Analyzer -->
        <DMARCAnalyzer dmarcRecords={dmarcRecords} />
    {:else if domain.toolState.email.hasData}
        <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
            <p class="text-fg-muted">No DMARC record found for {domain.name}. This domain has not configured a DMARC policy for email authentication.</p>
        </div>
    {/if}
</SEOToolPage>
