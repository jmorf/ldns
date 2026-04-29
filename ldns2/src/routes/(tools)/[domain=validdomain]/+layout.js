import { error } from '@sveltejs/kit';
import { domain, queryConfig } from "$lib/state.svelte";

/** @type {import('./$types').LayoutLoad} */
export function load({ params, url }) {
    if (params.domain) {
        domain.name = params.domain.toLowerCase();

        // Capture the endpoint parameter and store it in queryConfig
        const endpoint = url.searchParams.get('ep');
        if (endpoint && ['cloudflare', 'google', 'dns-sb'].includes(endpoint)) {
            queryConfig.endpoint = endpoint;
        } else {
            // Default to cloudflare if no valid endpoint is provided
            queryConfig.endpoint = 'cloudflare';
        }
    }
    else {
        throw error(404, "Not found");
    }
}