<script lang="ts">
    import { queryConfig } from "$lib/state.svelte";
    import { browser } from "$app/environment";

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

<div class="flex items-center gap-2">
    <label for="dns-endpoint" class="text-xs text-gray-500">DNS:</label>
    <select
        id="dns-endpoint"
        class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-200 border border-gray-600 hover:border-gray-500 focus:border-primary-500 focus:outline-none cursor-pointer"
        value={queryConfig.endpoint}
        onchange={handleChange}
    >
        {#each endpoints as ep}
            <option value={ep.id}>{ep.name}</option>
        {/each}
    </select>
</div>
