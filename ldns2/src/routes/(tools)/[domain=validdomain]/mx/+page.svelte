<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import DataTable from "$lib/components/DataTable.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import Badge from "$lib/components/Badge.svelte";
    import { MX_PAGE } from "$lib/utils/seoContent";
    import { generateMxFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupDnsRecordsWithToolState("MX"); },
        'dns'
    );

    const mxRecords = $derived(
        domain.toolState.dns.data?.MX ?? []
    );

    const faqJsonLd = $derived(
        domain.toolState.dns.hasData
            ? generateMxFaqJsonLd(domain.name, mxRecords)
            : null
    );
</script>

<SEO
    title={MX_PAGE.title($page.params.domain ?? '')}
    description={MX_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={MX_PAGE}
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

    {#if mxRecords.length > 0}
        <div class="bg-surface-2 border border-line rounded-xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-surface">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Priority</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Mail Server</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">TTL</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-line">
                    {#each mxRecords as record}
                        {@const parts = record.data.split(' ')}
                        {@const priority = parts[0]}
                        {@const server = parts.slice(1).join(' ')}
                        <tr class="hover:bg-surface-3 transition-colors">
                            <td class="px-6 py-4">
                                <Badge text={priority} color="orange" size="sm" />
                            </td>
                            <td class="px-6 py-4 text-fg font-mono text-sm">{server}</td>
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
            <p class="text-fg-muted">No MX records found for {domain.name}. This domain may not be configured to receive email.</p>
        </div>
    {/if}
</SEOToolPage>
