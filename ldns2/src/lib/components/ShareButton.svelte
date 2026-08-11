<script lang="ts">
    import { Link2, Check } from 'lucide-svelte';

    interface Props {
        /**
         * Kept for backwards compatibility. The new design is a single
         * tight icon-button regardless of variant.
         */
        variant?: 'primary' | 'secondary';
    }

    let {}: Props = $props();

    let copied = $state(false);

    async function handleShare() {
        const url = window.location.href;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
        if (navigator.share && isMobile) {
            try {
                await navigator.share({ title: document.title, url });
            } catch {
                /* user cancelled */
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            copied = true;
            setTimeout(() => (copied = false), 1800);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    }
</script>

<button
    onclick={handleShare}
    aria-label="Share or copy link to this page"
    title="Copy share link"
    class="h-9 px-3 inline-flex items-center gap-1.5 bg-surface-2 border border-line rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors text-xs font-medium"
>
    {#if copied}
        <Check class="w-3.5 h-3.5 text-ok-400" />
        <span class="hidden sm:inline">Copied</span>
    {:else}
        <Link2 class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Share</span>
    {/if}
</button>
