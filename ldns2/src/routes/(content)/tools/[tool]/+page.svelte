<script lang="ts">
  import { page } from '$app/stores';
  import DomainForm from '$lib/components/DomainForm.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';
  import FaqSection from '$lib/components/FaqSection.svelte';
  import { SEO_PAGES, PAGE_LABELS, EXISTING_PAGES, ALL_PAGE_SLUGS } from '$lib/utils/seoContent';
  import type { SEOPageConfig } from '$lib/utils/seoContent';
  import { ArrowRight } from 'lucide-svelte';

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

  const toolPath = $derived(toolMeta?.path ?? (seoConfig ? `/${seoConfig.slug}` : ''));
  const toolLabel = $derived(toolMeta?.label ?? seoConfig?.slug.toUpperCase() ?? toolSlug);

  // Related tool links — surface alternatives so the user can hop between tools
  // without bouncing back to the homepage.
  const relatedTools = $derived([
    ...ALL_PAGE_SLUGS
      .filter((slug) => slug !== toolSlug)
      .map((slug) => ({
        href: `/tools/${slug}`,
        label: PAGE_LABELS[slug].label,
        description: PAGE_LABELS[slug].shortDescription
      })),
    ...Object.entries(EXISTING_PAGES)
      .filter(([slug]) => slug !== toolSlug)
      .map(([slug, info]) => ({
        href: `/tools/${slug}`,
        label: info.label,
        description: info.shortDescription
      }))
  ]);
</script>

{#if seoConfig || toolMeta}
  <SEO
    title={`Free ${toolLabel} Tool`}
    description={toolDescription}
  />

  <!-- WebApplication JSON-LD -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${toolLabel} — LDNS`,
    url: `https://${domain}/tools/${toolSlug}`,
    description: toolDescription,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    browserRequirements: 'Requires JavaScript',
    softwareHelp: { '@type': 'CreativeWork', url: `https://${domain}/about` }
  }, null, 2)}</script>`}

  <!-- ─── Hero ───────────────────────────────────────────────── -->
  <section class="border-b border-line">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
      <Eyebrow text="domain tool" />
      <h1 class="text-4xl sm:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
        Free {toolLabel} <span class="text-primary-500">tool.</span>
      </h1>
      <p class="mt-5 text-lg text-fg-muted leading-relaxed max-w-2xl mx-auto">
        {toolDescription}
      </p>
      <div class="mt-8 max-w-md mx-auto">
        <DomainForm targetPath={toolPath} />
      </div>
    </div>
  </section>

  {#if seoConfig}
    <!-- ─── Educational sections ───────────────────────────── -->
    <section class="border-b border-line">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        {#each seoConfig.genericSections as section, i}
          <div>
            <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-2">
              <span class="text-primary-500/80">// </span>{String(i + 1).padStart(2, '0')}
            </p>
            <h2 class="text-xl sm:text-2xl font-semibold tracking-tight text-fg mb-3">{section.heading}</h2>
            {#each section.paragraphs as paragraph}
              <p class="text-fg-muted text-sm leading-[1.7] mb-3 max-w-prose">{paragraph}</p>
            {/each}
          </div>
        {/each}
      </div>
    </section>

    <!-- ─── FAQ ────────────────────────────────────────────── -->
    {#if seoConfig.genericFaqs?.length}
      <section class="border-b border-line bg-surface-2/30">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <FaqSection faqs={seoConfig.genericFaqs} />
        </div>
      </section>
    {/if}
  {/if}

  <!-- ─── Related tools ─────────────────────────────────────── -->
  <section class="py-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Eyebrow text="more tools" />
      <h2 class="text-xl sm:text-2xl font-semibold tracking-tight text-fg mb-6">
        Other DNS & domain tools
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each relatedTools as tool}
          <a
            href={tool.href}
            class="group flex items-center gap-3 p-3 bg-surface-2 border border-line rounded-lg hover:border-primary-500/30 transition-colors"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-fg group-hover:text-primary-400 transition-colors">
                {tool.label}
              </div>
              <div class="text-xs text-fg-subtle truncate">{tool.description}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-fg-subtle group-hover:text-primary-400 flex-shrink-0 transition-colors" />
          </a>
        {/each}
      </div>
    </div>
  </section>
{:else}
  <SEO title="Tool Not Found" description="The requested tool was not found." />
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center space-y-4">
      <h1 class="text-3xl font-semibold text-fg">Tool not found</h1>
      <p class="text-fg-muted">The tool "<span class="font-mono text-fg">{toolSlug}</span>" doesn't exist.</p>
      <a href="/" class="inline-block text-primary-400 hover:underline">← Back to home</a>
    </div>
  </div>
{/if}
