<script lang="ts">
    import { domain } from "$lib/state.svelte";
    import { page } from "$app/stores";
    import SEOToolPage from "$lib/components/SEOToolPage.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import { PROPAGATION_PAGE } from "$lib/utils/seoContent";
    import { useToolPage } from "$lib/utils/useToolPage.svelte";

    const { handleRefresh } = useToolPage(
        async () => { if (domain.name && domain.isValid) await domain.lookupPropagation(); },
        'propagation'
    );

    const data = $derived(domain.toolState.propagation.data);
    const endpoints = ['cloudflare', 'google', 'dns-sb'];
    const endpointNames: Record<string, string> = { cloudflare: 'Cloudflare', google: 'Google', 'dns-sb': 'DNS.SB' };
    const recordTypeOrder = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA'];

    function getAllRecordTypes() {
        if (!data) return [];
        const types = new Set<string>();
        for (const ep of endpoints) {
            const providerData = data[ep];
            if (providerData) {
                for (const [type, records] of Object.entries(providerData)) {
                    if (records && records.length > 0) types.add(type);
                }
            }
        }
        return Array.from(types).sort((a, b) => {
            const ai = recordTypeOrder.indexOf(a);
            const bi = recordTypeOrder.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
    }

    function hasDiscrepancy(type: string): boolean {
        if (!data) return false;
        const sets = endpoints.map(ep => {
            const records = data[ep]?.[type] || [];
            return records.map(r => r.data).sort().join(',');
        });
        return new Set(sets).size > 1;
    }

    const allTypes = $derived(getAllRecordTypes());
</script>

<SEO
    title={PROPAGATION_PAGE.title($page.params.domain ?? '')}
    description={PROPAGATION_PAGE.description($page.params.domain ?? '')}
/>

<SEOToolPage
    config={PROPAGATION_PAGE}
    domainName={domain.name}
    isLoading={domain.toolState.propagation.loading}
    error={domain.toolState.propagation.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.propagation.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    {#if data && allTypes.length > 0}
        <div class="space-y-4">
            {#each allTypes as type}
                {@const mismatch = hasDiscrepancy(type)}
                <div class="bg-gray-800 rounded-lg overflow-hidden border {mismatch ? 'border-yellow-500/50' : 'border-line'}">
                    <div class="px-6 py-3 bg-gray-900 flex items-center justify-between">
                        <span class="text-sm font-medium text-white">{type} Records</span>
                        {#if mismatch}
                            <span class="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">Mismatch</span>
                        {/if}
                    </div>
                    <div class="grid grid-cols-3 divide-x divide-line">
                        {#each endpoints as ep}
                            {@const records = data[ep]?.[type] || []}
                            <div class="p-4">
                                <p class="text-xs text-fg-muted font-medium mb-2">{endpointNames[ep]}</p>
                                {#if records.length > 0}
                                    {#each records as record}
                                        <p class="text-sm text-white font-mono break-all leading-relaxed">{record.data}</p>
                                    {/each}
                                {:else}
                                    <p class="text-sm text-gray-600 italic">No records</p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {:else if domain.toolState.propagation.hasData}
        <div class="bg-surface-2 border border-line rounded-xl p-6 text-center">
            <p class="text-fg-muted">No DNS records found across any provider for {domain.name}.</p>
        </div>
    {/if}
</SEOToolPage>
