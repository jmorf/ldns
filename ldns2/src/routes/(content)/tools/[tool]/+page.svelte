<script lang="ts">
    import { page } from "$app/stores";
    import DomainForm from "$lib/components/DomainForm.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import { SEO_PAGES, PAGE_LABELS, EXISTING_PAGES, ALL_PAGE_SLUGS } from "$lib/utils/seoContent";
    import type { SEOPageConfig } from "$lib/utils/seoContent";
    import { ArrowRight } from "lucide-svelte";
    import FaqSection from "$lib/components/FaqSection.svelte";

    const domain = 'ldns.com';

    const toolSlug = $derived($page.params.tool ?? '');

    const seoConfig: SEOPageConfig | undefined = $derived(SEO_PAGES[toolSlug]);

    interface ToolMeta {
        label: string;
        shortDescription: string;
        path: string;
    }

    const toolMeta: ToolMeta | undefined = $derived(
        PAGE_LABELS[toolSlug]
            ? { ...PAGE_LABELS[toolSlug], path: `/${toolSlug}` }
            : EXISTING_PAGES[toolSlug]
                ? { ...EXISTING_PAGES[toolSlug] }
                : undefined
    );

    const toolDescription = $derived(
        seoConfig
            ? seoConfig.landingDescription
            : toolMeta
                ? (EXISTING_PAGES[toolSlug]?.landingDescription ?? toolMeta.shortDescription)
                : ''
    );

    const toolPath = $derived(
        toolMeta?.path ?? (seoConfig ? `/${seoConfig.slug}` : '')
    );

    // Related tool links (other /tools/{slug} pages, excluding current)
    const relatedTools = $derived([
        ...ALL_PAGE_SLUGS
            .filter((slug) => slug !== toolSlug)
            .map((slug) => ({
                href: `/tools/${slug}`,
                label: PAGE_LABELS[slug].label,
                description: PAGE_LABELS[slug].shortDescription,
            })),
        ...Object.entries(EXISTING_PAGES)
            .filter(([slug]) => slug !== toolSlug)
            .map(([slug, info]) => ({
                href: `/tools/${slug}`,
                label: info.label,
                description: info.shortDescription,
            })),
    ]);
</script>

{#if seoConfig || toolMeta}
    <SEO
        title={`Free ${toolMeta?.label ?? seoConfig?.slug.toUpperCase()} Tool`}
        description={toolDescription}
    />

    <!-- WebApplication JSON-LD structured data -->
    {@html `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": `${toolMeta?.label ?? seoConfig?.slug.toUpperCase()} — LDNS`,
        "url": `https://${domain}/tools/${toolSlug}`,
        "description": toolDescription,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "browserRequirements": "Requires JavaScript",
        "softwareHelp": {
            "@type": "CreativeWork",
            "url": `https://${domain}/about`
        }
    }, null, 2)}</script>`}

    <div class="flex items-center justify-center py-16 sm:py-24">
        <div class="text-center space-y-8 max-w-2xl w-full">
            <div class="space-y-4">
                <h1 class="text-4xl font-bold text-white">
                    Free {toolMeta?.label ?? seoConfig?.slug.toUpperCase()} Tool
                </h1>
                <p class="text-lg text-gray-300">
                    {toolDescription}
                </p>
            </div>
            <DomainForm targetPath={toolPath} />
        </div>
    </div>

    {#if seoConfig}
        <!-- Educational content -->
        <div class="mt-8 space-y-8 border-t border-gray-700 pt-8">
            {#each seoConfig.genericSections as section}
                <section>
                    <h2 class="text-xl font-semibold text-white mb-3">{section.heading}</h2>
                    {#each section.paragraphs as paragraph}
                        <p class="text-gray-300 text-sm leading-relaxed mb-3">{paragraph}</p>
                    {/each}
                </section>
            {/each}
        </div>

        <!-- FAQ section -->
        {#if seoConfig.genericFaqs?.length}
            <FaqSection faqs={seoConfig.genericFaqs} />
        {/if}

        <!-- Related tools -->
        <div class="mt-10">
            <h3 class="text-lg font-semibold text-white mb-4">More DNS & Domain Tools</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {#each relatedTools as tool}
                    <a
                        href={tool.href}
                        class="group flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-primary-500 hover:bg-gray-750 transition-colors"
                    >
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                                {tool.label}
                            </div>
                            <div class="text-xs text-gray-400">{tool.description}</div>
                        </div>
                        <ArrowRight class="w-4 h-4 text-gray-500 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
                    </a>
                {/each}
            </div>
        </div>
    {/if}
{:else}
    <SEO title="Tool Not Found" description="The requested tool was not found." />
    <div class="min-h-[60vh] flex items-center justify-center">
        <div class="text-center space-y-4">
            <h1 class="text-3xl font-bold text-white">Tool Not Found</h1>
            <p class="text-gray-400">The tool "{toolSlug}" doesn't exist.</p>
            <a href="/" class="text-primary-400 hover:text-primary-300">Back to home</a>
        </div>
    </div>
{/if}
