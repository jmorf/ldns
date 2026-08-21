<script lang="ts">
  import DomainBreadcrumb from './DomainBreadcrumb.svelte';
  import Eyebrow from './Eyebrow.svelte';
  import SkeletonRows from './SkeletonRows.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    /**
     * Optional intro paragraph. The SEO record-type pages pass crafted copy
     * here; the app-style tool pages omit it so the header stays terse and
     * the data starts immediately.
     */
    description?: string;
    domainName: string;
    isLoading?: boolean;
    error?: string;
    /**
     * Mono caption rendered above the title in homepage-feature style,
     * e.g. "dns · a records" or "security · tls cert". Optional, when
     * omitted the header reads as a plain breadcrumb + heading.
     */
    eyebrow?: string;
    children: Snippet;
    actions?: Snippet;
  }

  let {
    title,
    description,
    domainName,
    isLoading = false,
    error,
    eyebrow,
    children,
    actions
  }: Props = $props();
</script>

<div class="w-full max-w-7xl mx-auto">
  <!-- Terse page header: eyebrow, breadcrumb, heading, actions. Data starts
       right below: no badges or filler sentences between the user and the
       results. -->
  <header class="mb-6 pt-2">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        {#if eyebrow}
          <Eyebrow text={eyebrow} />
        {/if}
        <div class="mb-2">
          <DomainBreadcrumb domain={domainName} />
        </div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-[1.1]">
          {title}
        </h1>
      </div>
      {#if actions}
        <div class="flex items-center gap-2 flex-shrink-0">
          {@render actions()}
        </div>
      {/if}
    </div>
    {#if description}
      <p class="mt-3 text-fg-muted text-sm leading-relaxed max-w-3xl">{description}</p>
    {/if}
  </header>

  {#if isLoading}
    <div class="bg-surface-2 border border-line rounded-xl p-5">
      <SkeletonRows rows={5} />
    </div>
  {:else if error}
    <div class="bg-bad-500/10 border border-bad-500/30 rounded-xl p-4 mb-6">
      <p class="text-bad-400 text-sm">
        <span class="font-semibold">Error:</span>
        <span class="ml-1">{error}</span>
      </p>
    </div>
  {:else}
    {@render children()}
  {/if}
</div>
