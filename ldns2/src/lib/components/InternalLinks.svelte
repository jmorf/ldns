<script lang="ts">
    import { PAGE_LABELS, EXISTING_PAGES } from '$lib/utils/seoContent';
    import { ArrowRight } from 'lucide-svelte';

    interface Props {
        domain: string;
        currentSlug: string;
        relatedSlugs: string[];
    }

    let { domain, currentSlug, relatedSlugs }: Props = $props();

    const links = $derived(
        relatedSlugs
            .filter((slug) => slug !== currentSlug)
            .map((slug) => {
                const info = PAGE_LABELS[slug];
                if (!info) return null;
                return {
                    href: `/${domain}/${slug}`,
                    label: info.label,
                    description: info.shortDescription,
                };
            })
            .filter(Boolean) as Array<{ href: string; label: string; description: string }>
    );

    // Add links to existing tool pages that aren't the current page
    const existingLinks = $derived(
        Object.entries(EXISTING_PAGES)
            .filter(([key]) => key !== currentSlug)
            .map(([, info]) => ({
                href: `/${domain}${info.path}`,
                label: info.label,
                description: info.shortDescription,
            }))
    );
</script>

<div>
    <h3 class="text-lg font-semibold text-white mb-4">More tools for {domain}</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each links as link}
            <a
                href={link.href}
                class="group flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-750 transition-colors"
            >
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                        {link.label}
                    </div>
                    <div class="text-xs text-gray-400">{link.description}</div>
                </div>
                <ArrowRight class="w-4 h-4 text-gray-500 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
            </a>
        {/each}
        {#each existingLinks as link}
            <a
                href={link.href}
                class="group flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-750 transition-colors"
            >
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                        {link.label}
                    </div>
                    <div class="text-xs text-gray-400">{link.description}</div>
                </div>
                <ArrowRight class="w-4 h-4 text-gray-500 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
            </a>
        {/each}
    </div>
</div>
