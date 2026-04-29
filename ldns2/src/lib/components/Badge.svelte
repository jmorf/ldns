<script lang="ts">
    interface Props {
        text: string;
        color?:
            | 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'gray' | 'indigo' | 'pink'
            | 'lime' | 'amber' | 'emerald' | 'teal' | 'violet' | 'rose' | 'fuchsia';
        size?: 'sm' | 'md' | 'lg';
        variant?: 'solid' | 'outlined';
    }

    let {
        text,
        color = 'blue',
        size = 'md',
        variant = 'solid'
    }: Props = $props();

    function getColorClasses(color: string, variant: string) {
        const colorMap: Record<string, string> = {
            blue: variant === 'solid' 
                ? 'bg-blue-600 text-blue-100 dark:bg-blue-800 dark:text-blue-100'
                : 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
            green: variant === 'solid'
                ? 'bg-green-600 text-green-100 dark:bg-green-800 dark:text-green-100'
                : 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
            red: variant === 'solid'
                ? 'bg-red-600 text-red-100 dark:bg-red-800 dark:text-red-100'
                : 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
            yellow: variant === 'solid'
                ? 'bg-yellow-600 text-yellow-100 dark:bg-yellow-800 dark:text-yellow-100'
                : 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
            orange: variant === 'solid'
                ? 'bg-primary-500 text-primary-100 dark:bg-primary-800 dark:text-primary-100'
                : 'border-primary-500 text-primary-500 dark:border-primary-400 dark:text-primary-400',
            purple: variant === 'solid'
                ? 'bg-purple-600 text-purple-100 dark:bg-purple-800 dark:text-purple-100'
                : 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
            gray: variant === 'solid'
                ? 'bg-gray-600 text-gray-100 dark:bg-gray-700 dark:text-gray-100'
                : 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
            indigo: variant === 'solid'
                ? 'bg-indigo-600 text-indigo-100 dark:bg-indigo-800 dark:text-indigo-100'
                : 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400',
            pink: variant === 'solid'
                ? 'bg-pink-600 text-pink-100 dark:bg-pink-800 dark:text-pink-100'
                : 'border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400',
            lime: variant === 'solid'
                ? 'bg-lime-600 text-lime-100 dark:bg-lime-800 dark:text-lime-100'
                : 'border-lime-600 text-lime-600 dark:border-lime-400 dark:text-lime-400',
            amber: variant === 'solid'
                ? 'bg-amber-600 text-amber-100 dark:bg-amber-800 dark:text-amber-100'
                : 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
            emerald: variant === 'solid'
                ? 'bg-emerald-600 text-emerald-100 dark:bg-emerald-800 dark:text-emerald-100'
                : 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
            teal: variant === 'solid'
                ? 'bg-teal-600 text-teal-100 dark:bg-teal-800 dark:text-teal-100'
                : 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400',
            violet: variant === 'solid'
                ? 'bg-violet-600 text-violet-100 dark:bg-violet-800 dark:text-violet-100'
                : 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400',
            rose: variant === 'solid'
                ? 'bg-rose-600 text-rose-100 dark:bg-rose-800 dark:text-rose-100'
                : 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400',
            fuchsia: variant === 'solid'
                ? 'bg-fuchsia-600 text-fuchsia-100 dark:bg-fuchsia-800 dark:text-fuchsia-100'
                : 'border-fuchsia-600 text-fuchsia-600 dark:border-fuchsia-400 dark:text-fuchsia-400'
        };
        return colorMap[color] || colorMap.blue;
    }

    function getSizeClasses(size: string) {
        const sizeMap: Record<string, string> = {
            sm: 'px-2 py-1 text-xs',
            md: 'px-3 py-1 text-sm', 
            lg: 'px-4 py-2 text-base'
        };
        return sizeMap[size] || sizeMap.md;
    }

    let classes = $derived(`inline-flex items-center font-medium rounded-full ${getSizeClasses(size)} ${getColorClasses(color, variant)} ${variant === 'outlined' ? 'border' : ''}`);
</script>

<span class={classes}>
    {text}
</span>