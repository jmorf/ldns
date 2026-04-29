<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";

    interface Props {
        id: string;
        title: string;
        level?: 'h2' | 'h3' | 'h4';
        showHashLink?: boolean;
    }

    let {
        id,
        title,
        level = 'h3',
        showHashLink = true
    }: Props = $props();

    // Function to copy section link to clipboard
    function copyHashLink(sectionId: string) {
        if (browser) {
            const url = `${window.location.origin}${$page.url.pathname}#${sectionId}`;
            navigator.clipboard.writeText(url).then(() => {
                console.log('Link copied to clipboard:', url);
            }).catch(err => {
                console.error('Failed to copy link:', err);
            });
        }
    }

    function getHeaderClasses(level: string) {
        const headerMap: Record<string, string> = {
            h2: 'text-xl font-semibold tracking-tight text-fg',
            h3: 'text-base font-semibold tracking-tight text-fg',
            h4: 'text-sm font-medium text-fg'
        };
        return headerMap[level] || headerMap.h3;
    }
</script>

<div {id} class="flex items-center gap-2 mb-3 pb-2 border-b border-line">
    {#if level === 'h2'}
        <h2 class={getHeaderClasses(level)}>{title}</h2>
    {:else if level === 'h3'}
        <h3 class={getHeaderClasses(level)}>{title}</h3>
    {:else if level === 'h4'}
        <h4 class={getHeaderClasses(level)}>{title}</h4>
    {/if}

    {#if showHashLink}
        <button
            class="text-fg-subtle hover:text-primary-400 transition-colors cursor-pointer font-mono"
            onclick={() => copyHashLink(id)}
            title="Copy link to this section"
            aria-label="Copy link to this section"
        >
            #
        </button>
    {/if}
</div>