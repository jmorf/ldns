<script lang="ts">
    import { queryConfig } from '$lib/state.svelte';
    import { browser } from '$app/environment';
    import { ChevronDown } from 'lucide-svelte';

    interface Props {
        onchange?: () => void;
    }

    let { onchange }: Props = $props();

    const endpoints = [
        { id: 'cloudflare', name: 'Cloudflare' },
        { id: 'google', name: 'Google' },
        { id: 'dns-sb', name: 'DNS.SB' }
    ];

    function handleChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const id = select.value;
        if (queryConfig.endpoint === id) return;
        queryConfig.endpoint = id;
        if (browser) {
            const url = new URL(window.location.href);
            url.searchParams.set('ep', id);
            window.history.replaceState({}, '', url.toString());
        }
        onchange?.();
    }
</script>

<!-- Match the icon-button shell so the action bar reads as one unit. -->
<label
    for="dns-endpoint"
    class="h-9 inline-flex items-center gap-2 bg-surface-2 border border-line rounded-lg text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors cursor-pointer pl-3 pr-2 relative"
>
    <span class="font-mono uppercase tracking-wider text-[10px] text-fg-subtle">DNS</span>
    <select
        id="dns-endpoint"
        class="appearance-none bg-transparent text-fg text-xs font-medium pr-5 focus:outline-none cursor-pointer"
        value={queryConfig.endpoint}
        onchange={handleChange}
    >
        {#each endpoints as ep}
            <option value={ep.id}>{ep.name}</option>
        {/each}
    </select>
    <ChevronDown class="w-3 h-3 text-fg-subtle absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
</label>
