<script lang="ts">
    import ToolPage from './ToolPage.svelte';
    import InternalLinks from './InternalLinks.svelte';
    import type { SEOPageConfig } from '$lib/utils/seoContent';
    import type { Snippet } from 'svelte';

    interface Props {
        config: SEOPageConfig;
        domainName: string;
        isLoading?: boolean;
        error?: string;
        children?: Snippet;
        actions?: Snippet;
    }

    let {
        config,
        domainName,
        isLoading = false,
        error,
        children,
        actions: actionsSnippet,
    }: Props = $props();

    // Eyebrow caption: "{datasource} · {slug-or-record-type}", styled after
    // the homepage section captions. Short, lowercase, mono, sets the
    // page in context before the heading lands.
    const eyebrow = $derived(
        `${config.dataSource} · ${config.recordType ? config.recordType.toLowerCase() : config.slug}`
    );
</script>

<ToolPage
    title={config.h1(domainName)}
    description={config.intro(domainName)}
    {domainName}
    {isLoading}
    {error}
    {eyebrow}
>
    {#snippet actions()}
        {#if actionsSnippet}
            {@render actionsSnippet()}
        {/if}
    {/snippet}

    <!-- Live data area (rendered by parent page via children) -->
    {#if children}
        {@render children()}
    {/if}

    <!-- Educational content sections (always rendered for SEO) -->
    <div class="mt-16 space-y-8 border-t border-line pt-10 max-w-3xl">
        {#each config.sections(domainName) as section, i}
            <section>
                <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-2">
                    <span class="text-primary-500/80">// </span>{String(i + 1).padStart(2, '0')}
                </p>
                <h2 class="text-xl font-semibold tracking-tight text-fg mb-3">{section.heading}</h2>
                {#each section.paragraphs as paragraph}
                    <p class="text-fg-muted text-sm leading-[1.7] mb-3 max-w-prose">{paragraph}</p>
                {/each}
            </section>
        {/each}
    </div>

    <!-- Internal links to related pages -->
    <div class="mt-10">
        <InternalLinks
            domain={domainName}
            currentSlug={config.slug}
            relatedSlugs={config.relatedPages}
        />
    </div>
</ToolPage>
