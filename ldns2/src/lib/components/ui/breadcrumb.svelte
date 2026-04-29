<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { ChevronRight } from 'lucide-svelte';

	interface BreadcrumbItem {
		href?: string;
		label: string;
	}

	interface Props extends HTMLAttributes<HTMLElement> {
		items: BreadcrumbItem[];
		class?: string;
		separator?: typeof ChevronRight;
	}

	let { items, class: className, separator: Separator = ChevronRight, ...restProps }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class={cn('inline-flex', className)} {...restProps}>
	<ol class="inline-flex items-center">
		{#each items as item, index}
			<li class="inline-flex items-center">
				{#if index > 0}
					<Separator class="w-3 h-3 mx-2 text-fg-subtle" />
				{/if}
				{#if item.href && index < items.length - 1}
					<a
						href={item.href}
						class="text-fg-muted hover:text-primary-400 transition-colors text-sm"
						data-sveltekit-preload-data="off"
					>
						{item.label}
					</a>
				{:else}
					<span class="text-fg-muted font-medium text-sm">
						{item.label}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
