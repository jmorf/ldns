<script lang="ts">
    import { generateRelatedDomains, type RelatedDomain } from '$lib/utils/relatedDomains';
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import { ExternalLink, Link } from 'lucide-svelte';

    interface Props {
        domain: string;
    }

    let { domain }: Props = $props();

    // Generate domains ONCE when component is created
    // Store as const so they never change
    const generatedDomains: RelatedDomain[] = generateRelatedDomains(domain);

    // Group domains by type ONCE
    const groupedDomainsData: Record<string, RelatedDomain[]> = {};
    generatedDomains.forEach(rd => {
        if (!groupedDomainsData[rd.type]) {
            groupedDomainsData[rd.type] = [];
        }
        groupedDomainsData[rd.type].push(rd);
    });

    // Get badge variant based on type
    const getBadgeVariant = (type: string): BadgeVariant => {
        const variants: Record<string, BadgeVariant> = {
            'parent': 'blue',
            'subdomain': 'green',
            'tld_variant': 'purple',
            'service': 'orange',
            'variant': 'gray'
        };
        return variants[type] || 'gray';
    };
</script>

{#if generatedDomains.length > 0}
    <div class="mt-8 mb-8">
        <div class="mb-4">
            <h3 class="text-xl font-semibold text-white flex items-center gap-2">
                <Link class="w-5 h-5" />
                Related Domains
            </h3>
            <p class="text-sm text-gray-400 mt-1">
                Explore related domains, subdomains, and alternative TLDs
            </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {#each generatedDomains as related (related.domain)}
                <a
                    href="/{related.domain}"
                    data-sveltekit-preload-data="off"
                    class="group relative flex flex-col bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 will-change-[background-color,border-color]"
                    title={related.description}
                    style="transform: translateZ(0)"
                >
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <Badge variant={getBadgeVariant(related.type)} class="text-xs">
                                    {related.label}
                                </Badge>
                            </div>
                        </div>
                        <ExternalLink class="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
                    </div>
                    
                    <div class="font-mono text-sm text-white break-all">
                        {related.domain}
                    </div>
                    
                    <div class="text-xs text-gray-500 mt-1">
                        {related.description}
                    </div>
                </a>
            {/each}
        </div>

        {#if Object.keys(groupedDomainsData).length > 1}
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>Found:</span>
                {#each Object.entries(groupedDomainsData) as [type, domains]}
                    <span>
                        {domains.length} {domains[0].label.toLowerCase()}{domains.length > 1 ? 's' : ''}
                    </span>
                    {#if type !== Object.keys(groupedDomainsData)[Object.keys(groupedDomainsData).length - 1]}
                        <span>•</span>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
{/if}

