<script lang="ts">
    interface Props {
        text: string;
        size?: "sm" | "md" | "lg";
        variant?: "default" | "compact";
        label?: string;
        children?: any;
    }

    let { text, size = "sm", variant = "default", label, children }: Props = $props();

    let copied = $state(false);

    // Copy to clipboard function with feedback
    async function copyToClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                copied = true;
                setTimeout(() => {
                    copied = false;
                }, 2000);
            } else {
                // Fallback: create a temporary textarea and use the selection API
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                textArea.setAttribute('readonly', '');
                document.body.appendChild(textArea);
                
                // Try to select and copy
                textArea.select();
                textArea.setSelectionRange(0, 99999); // For mobile devices
                
                try {
                    // Use the more modern approach
                    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            copied = true;
                            setTimeout(() => {
                                copied = false;
                            }, 2000);
                        }
                    } else {
                        throw new Error('Copy command not supported');
                    }
                } catch (fallbackErr) {
                    console.warn('Fallback copy failed, providing manual copy instruction');
                    // In this case, the text is still selected, user can manually copy
                    alert(`Please manually copy this text: ${text}`);
                } finally {
                    textArea.remove();
                }
            }
        } catch (err) {
            console.error("Failed to copy:", err);
            // Last resort - show the text for manual copying
            alert(`Copy this text manually: ${text}`);
        }
    }

    // Get size classes
    function getSizeClasses(size: string, variant: string) {
        if (variant === "compact") {
            switch (size) {
                case "sm":
                    return "px-2 py-1 text-xs min-w-[65px]";
                case "md":
                    return "px-3 py-1.5 text-sm min-w-[75px]";
                case "lg":
                    return "px-4 py-2 text-base min-w-[85px]";
                default:
                    return "px-2 py-1 text-xs min-w-[65px]";
            }
        } else {
            switch (size) {
                case "sm":
                    return "px-2 py-1 text-xs min-w-[70px]";
                case "md":
                    return "px-3 py-1.5 text-sm min-w-[80px]";
                case "lg":
                    return "px-4 py-2 text-base min-w-[90px]";
                default:
                    return "px-2 py-1 text-xs min-w-[70px]";
            }
        }
    }
</script>

<button
    onclick={copyToClipboard}
    class={`${getSizeClasses(size, variant)} rounded transition-colors ${
        copied
            ? "bg-ok-500 hover:bg-ok-500 text-fg"
            : "bg-surface-3 hover:bg-surface-3 text-fg"
    }`}
>
    {#if copied}
        Copied!
    {:else if children}
        {@render children()}
    {:else}
        {label || "Copy"}
    {/if}
</button>
