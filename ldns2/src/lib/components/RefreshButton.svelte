<script lang="ts">
    interface Props {
        onClick: () => void | Promise<void>;
        loading: boolean;
        loadingText?: string;
        defaultText?: string;
        disabled?: boolean;
        variant?: "primary" | "secondary";
    }

    let {
        onClick,
        loading,
        loadingText = "Loading...",
        defaultText = "Refresh",
        disabled = false,
        variant = "primary",
    }: Props = $props();

    async function handleClick() {
        await onClick();
    }

    function getButtonClasses(variant: string) {
        const baseClasses =
            "px-2 py-1.5 sm:px-4 sm:py-2 rounded text-fg font-medium disabled:opacity-50 transition-colors text-sm sm:text-base";

        switch (variant) {
            case "secondary":
                return `${baseClasses} bg-surface-3 hover:bg-surface-3 border border-line-strong`;
            case "primary":
            default:
                return `${baseClasses} bg-primary-500 hover:bg-primary-600`;
        }
    }
</script>

<button
    onclick={handleClick}
    class={getButtonClasses(variant)}
    disabled={loading || disabled}
>
    {loading ? loadingText : defaultText}
</button>
