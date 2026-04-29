<script lang="ts">
    import type { FaqPage } from "$lib/utils/faqJsonLd";

    interface Props {
        faqData: FaqPage | null;
    }

    let { faqData }: Props = $props();

    // Reactive JSON string generation
    const jsonLdString = $derived(
        faqData ? JSON.stringify(faqData, null, 2) : ''
    );
</script>

<svelte:head>
    {#if faqData}
        {@html `<script type="application/ld+json">${jsonLdString}</script>`}
    {/if}
</svelte:head>