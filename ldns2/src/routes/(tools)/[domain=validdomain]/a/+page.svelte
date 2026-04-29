<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import { A_PAGE } from "$lib/utils/seoContent";
    import { generateARecordFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupDnsRecordsWithToolState("A"); },
        'dns'
    );

    const aRecords = $derived(
        domain.toolState.dns.data?.A ?? []
    );

    const faqJsonLd = $derived(
        domain.toolState.dns.hasData
            ? generateARecordFaqJsonLd(domain.name, aRecords)
            : null
    );
</script>

<SEO
    title={A_PAGE.title($page.params.domain ?? '')}
    description={A_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={A_PAGE}
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

    {#if aRecords.length > 0}
        <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <table class="w-full">
                <thead class="bg-gray-900">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IPv4 Address</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">TTL</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    {#each aRecords as record}
                        <tr class="hover:bg-gray-750 transition-colors">
                            <td class="px-6 py-4 text-white font-mono text-sm">{record.data}</td>
                            <td class="px-6 py-4 text-gray-300 font-mono text-sm">{record.ttl}s</td>
                            <td class="px-6 py-4">
                                <CopyButton text={record.data} size="sm" variant="compact" />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else if domain.toolState.dns.hasData}
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <p class="text-gray-400">No A records found for {domain.name}. This domain may not have an IPv4 address configured.</p>
        </div>
    {/if}
</SEOToolPage>
