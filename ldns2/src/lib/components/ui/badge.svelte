<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
		variants: {
			variant: {
				default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
				secondary: 'border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
				destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
				outline: 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
				// Color variants matching Flowbite's Badge colors
				blue: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
				green: 'border-transparent bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
				red: 'border-transparent bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
				yellow: 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
				orange: 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
				purple: 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
				indigo: 'border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100',
				pink: 'border-transparent bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100',
				gray: 'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
				primary: 'border-transparent bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100',
				lime: 'border-transparent bg-lime-100 text-lime-800 dark:bg-lime-800 dark:text-lime-100',
				amber: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
				emerald: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100',
				teal: 'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100',
				violet: 'border-transparent bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-100',
				rose: 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100',
				fuchsia: 'border-transparent bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-800 dark:text-fuchsia-100'
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: BadgeVariant;
		class?: string;
	}

	let { variant = 'default', class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
