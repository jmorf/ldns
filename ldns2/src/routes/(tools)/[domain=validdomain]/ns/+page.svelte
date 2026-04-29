<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import { NS_PAGE } from "$lib/utils/seoContent";
    import { generateNsFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupDnsRecordsWithToolState("NS"); },
        'dns'
    );

    const nsRecords = $derived(
        domain.toolState.dns.data?.NS ?? []
    );

    const faqJsonLd = $derived(
        domain.toolState.dns.hasData
            ? generateNsFaqJsonLd(domain.name, nsRecords)
            : null
    );
</script>

<SEO
    title={NS_PAGE.title($page.params.domain ?? '')}
    description={NS_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={NS_PAGE}
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

    {#if nsRecords.length > 0}
        <div class="bg-surface-2 border border-line rounded-xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-surface">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Nameserver</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">TTL</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-line">
                    {#each nsRecords as record}
                        <tr class="hover:bg-surface-3 transition-colors">
                            <td class="px-6 py-4 text-fg font-mono text-sm">{record.data}</td>
                            <td class="px-6 py-4 text-fg-muted font-mono text-sm">{record.ttl}s</td>
                            <td class="px-6 py-4">
                                <CopyButton text={record.data} size="sm" variant="compact" />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else if domain.toolState.dns.hasData}
        <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
            <p class="text-fg-muted">No NS records found for {domain.name}.</p>
        </div>
    {/if}
</SEOToolPage>
