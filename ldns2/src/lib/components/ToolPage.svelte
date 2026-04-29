<script lang="ts">
  import Badge from '$lib/components/ui/badge.svelte';
  import DomainBreadcrumb from './DomainBreadcrumb.svelte';
  import Eyebrow from './Eyebrow.svelte';
  import SkeletonRows from './SkeletonRows.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description: string;
    domainName: string;
    isLoading?: boolean;
    error?: string;
    badge?: {
      text: string;
      color: string;
    };
    /**
     * Mono caption rendered above the title in homepage-feature style,
     * e.g. "dns · a records" or "security · tls cert". Optional — when
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
    badge,
    eyebrow,
    children,
    actions
  }: Props = $props();

  type BadgeColor = 'green' | 'yellow' | 'red' | 'orange' | 'blue' | 'gray' | 'primary';
  const colorMap: Record<string, BadgeColor> = {
    green: 'green',
    yellow: 'yellow',
    red: 'red',
    orange: 'orange',
    blue: 'blue',
    gray: 'gray',
    primary: 'primary'
  };
</script>

<div class="w-full max-w-7xl mx-auto">
  <!-- Page header: mirrors the homepage section rhythm — eyebrow caption,
       then a large semibold heading, then a muted description paragraph. -->
  <header class="mb-10 pt-2">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
      <div class="min-w-0">
        {#if eyebrow}
          <Eyebrow text={eyebrow} />
        {/if}
        <div class="flex items-center gap-3 mb-3 flex-wrap">
          {#if badge}
            <Badge variant={colorMap[badge.color] ?? 'gray'} class="text-[11px] tabular-nums">
              {badge.text}
            </Badge>
          {/if}
          <DomainBreadcrumb domain={domainName} />
        </div>
        <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-fg leading-[1.1]">
          {title}
        </h1>
      </div>
      {#if actions}
        <div class="flex items-center gap-2 flex-shrink-0">
          {@render actions()}
        </div>
      {/if}
    </div>
    <p class="text-fg-muted text-sm sm:text-base leading-relaxed max-w-3xl">{description}</p>
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
