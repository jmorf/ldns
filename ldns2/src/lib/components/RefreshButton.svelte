<script lang="ts">
    import { RefreshCw } from 'lucide-svelte';

    interface Props {
        onClick: () => void | Promise<void>;
        loading: boolean;
        disabled?: boolean;
        /**
         * Kept for backwards compatibility with existing call sites. The
         * new design is a single tight icon-button regardless of variant.
         */
        variant?: 'primary' | 'secondary';
        loadingText?: string;
        defaultText?: string;
    }

    let { onClick, loading, disabled = false }: Props = $props();

    async function handleClick() {
        await onClick();
    }
</script>

<button
    onclick={handleClick}
    disabled={loading || disabled}
    aria-label="Refresh data"
    title="Refresh"
    class="h-9 px-3 inline-flex items-center gap-1.5 bg-surface-2 border border-line rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
>
    <RefreshCw class="w-3.5 h-3.5 {loading ? 'animate-spin' : ''}" />
    <span class="hidden sm:inline">{loading ? 'Refreshing' : 'Refresh'}</span>
</button>
