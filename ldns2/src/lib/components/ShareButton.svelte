<script lang="ts">
    import { Link } from "lucide-svelte";
    
    interface Props {
        variant?: "primary" | "secondary";
    }

    let { variant = "secondary" }: Props = $props();

    let showCopiedTooltip = $state(false);

    async function handleShare() {
        const url = window.location.href;
        
        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Use native share on mobile devices
            try {
                await navigator.share({
                    title: document.title,
                    url: url
                });
            } catch (err) {
                // User cancelled share or error occurred
                console.log('Share cancelled or failed:', err);
            }
        } else {
            // Copy to clipboard on desktop
            try {
                await navigator.clipboard.writeText(url);
                showCopiedTooltip = true;
                setTimeout(() => {
                    showCopiedTooltip = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy URL:', err);
            }
        }
    }

    function getButtonClasses(variant: string) {
        const baseClasses = "px-2 py-1.5 sm:px-4 sm:py-2 rounded text-fg font-medium transition-colors flex items-center gap-2 relative text-sm sm:text-base";

        switch (variant) {
            case "primary":
                return `${baseClasses} bg-primary-500 hover:bg-primary-600`;
            case "secondary":
            default:
                return `${baseClasses} bg-surface-3 hover:bg-surface-3 border border-line-strong`;
        }
    }
</script>

<button
    onclick={handleShare}
    class={getButtonClasses(variant)}
    type="button"
>
    <Link class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    Share
    
    {#if showCopiedTooltip}
        <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-surface-2 text-fg text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            Link copied!
        </div>
    {/if}
</button>