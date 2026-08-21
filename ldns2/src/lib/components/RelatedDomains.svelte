<script lang="ts">
    import { generateRelatedDomains, type RelatedDomain } from '$lib/utils/relatedDomains';
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import { ExternalLink, Link } from 'lucide-svelte';

    interface Props {
        domain: string;
    }

    let { domain }: Props = $props();

    // Derived so the list follows client-side navigations between domains
    const generatedDomains: RelatedDomain[] = $derived(generateRelatedDomains(domain));

    const groupedDomainsData: Record<string, RelatedDomain[]> = $derived.by(() => {
        const grouped: Record<string, RelatedDomain[]> = {};
        for (const rd of generatedDomains) {
            (grouped[rd.type] ??= []).push(rd);
        }
        return grouped;
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
            <h3 class="text-xl font-semibold text-fg flex items-center gap-2">
                <Link class="w-5 h-5" />
                Related Domains
            </h3>
            <p class="text-sm text-fg-muted mt-1">
                Explore related domains, subdomains, and alternative TLDs
            </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {#each generatedDomains as related (related.domain)}
                <a
                    href="/{related.domain}"
                    data-sveltekit-preload-data="off"
                    class="group relative flex flex-col bg-surface-2 border border-line rounded-lg p-3 hover:bg-surface-3 hover:border-line-strong transition-all duration-200 will-change-[background-color,border-color]"
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
                        <ExternalLink class="w-4 h-4 text-fg-subtle group-hover:text-fg-muted flex-shrink-0" />
                    </div>

                    <div class="font-mono text-sm text-fg break-all">
                        {related.domain}
                    </div>

                    <div class="text-xs text-fg-subtle mt-1">
                        {related.description}
                    </div>
                </a>
            {/each}
        </div>

        {#if Object.keys(groupedDomainsData).length > 1}
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-fg-subtle">
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

