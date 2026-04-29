<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import Badge from "$lib/components/ui/badge.svelte";
    import { WHOIS_PAGE } from "$lib/utils/seoContent";
    import { generateRdapFaqJsonLd } from "$lib/utils/faqJsonLd";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupRdap(); },
        'rdap'
    );

    const rdapData = $derived(domain.toolState.rdap.data);

    const faqJsonLd = $derived(
        domain.toolState.rdap.hasData
            ? generateRdapFaqJsonLd(domain.name, rdapData)
            : null
    );

    // Extract key registration info from parsed data
    const registrationDate = $derived(rdapData?.created);
    const expirationDate = $derived(rdapData?.expires);
    const lastUpdated = $derived(rdapData?.updated);
    const registrar = $derived(rdapData?.registrar);

    function formatDate(dateStr: string | undefined): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
</script>

<SEO
    title={WHOIS_PAGE.title($page.params.domain ?? '')}
    description={WHOIS_PAGE.description($page.params.domain ?? '')}
/>

<FaqJsonLd faqData={faqJsonLd} />

<SEOToolPage
    config={WHOIS_PAGE}
    domainName={domain.name}
    isLoading={domain.toolState.rdap.loading}
    error={domain.toolState.rdap.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.rdap.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    {#if rdapData}
        <!-- Key Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-2 border border-line rounded-xl p-4">
                <div class="text-xs text-fg-muted uppercase mb-1">Registered</div>
                <div class="text-white font-medium text-sm">{formatDate(registrationDate)}</div>
            </div>
            <div class="bg-surface-2 border border-line rounded-xl p-4">
                <div class="text-xs text-fg-muted uppercase mb-1">Expires</div>
                <div class="text-white font-medium text-sm">{formatDate(expirationDate)}</div>
            </div>
            <div class="bg-surface-2 border border-line rounded-xl p-4">
                <div class="text-xs text-fg-muted uppercase mb-1">Last Updated</div>
                <div class="text-white font-medium text-sm">{formatDate(lastUpdated)}</div>
            </div>
            <div class="bg-surface-2 border border-line rounded-xl p-4">
                <div class="text-xs text-fg-muted uppercase mb-1">Registrar</div>
                <div class="text-white font-medium text-sm truncate">{registrar || 'N/A'}</div>
            </div>
        </div>

        <!-- Status Codes -->
        {#if rdapData.status && rdapData.status.length > 0}
            <div class="bg-surface-2 border border-line rounded-xl p-4 mb-6">
                <h3 class="text-sm font-medium text-fg-muted uppercase mb-3">Domain Status</h3>
                <div class="flex flex-wrap gap-2">
                    {#each rdapData.status as status}
                        <Badge color={undefined} class="text-xs bg-gray-700 text-gray-100 border border-gray-600">{status}</Badge>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Nameservers -->
        {#if rdapData.nameservers && rdapData.nameservers.length > 0}
            <div class="bg-surface-2 border border-line rounded-xl overflow-hidden mb-6">
                <div class="px-4 py-3 bg-gray-900">
                    <h3 class="text-sm font-medium text-fg-muted uppercase">Nameservers</h3>
                </div>
                <div class="divide-y divide-line">
                    {#each rdapData.nameservers as ns}
                        <div class="px-4 py-3 flex items-center justify-between">
                            <span class="text-white font-mono text-sm">{ns}</span>
                            <CopyButton text={ns} size="sm" variant="compact" />
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- DNSSEC -->
        <div class="bg-surface-2 border border-line rounded-xl p-4">
            <h3 class="text-sm font-medium text-fg-muted uppercase mb-2">DNSSEC</h3>
            {#if rdapData.dnssecEnabled}
                <Badge color="green" class="text-xs">Enabled</Badge>
            {:else}
                <Badge color="yellow" class="text-xs">Not Enabled</Badge>
            {/if}
        </div>

        <!-- Link to full RDAP page -->
        <div class="mt-6 text-center">
            <a href="/{domain.name}/rdap" class="text-primary-400 hover:text-primary-300 text-sm">
                View full RDAP data &rarr;
            </a>
        </div>
    {:else if domain.toolState.rdap.hasData}
        <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
            <p class="text-fg-muted">No WHOIS data available for {domain.name}.</p>
        </div>
    {/if}
</SEOToolPage>
