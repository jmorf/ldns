<script lang="ts">
    import type { FaqPage } from "$lib/utils/faqJsonLd";
    import { jsonLdScript } from "$lib/utils/jsonLdScript";

    interface Props {
        faqData: FaqPage | null;
    }

    let { faqData }: Props = $props();
</script>

<svelte:head>
    {#if faqData}
        {@html jsonLdScript(faqData)}
    {/if}
</svelte:head>