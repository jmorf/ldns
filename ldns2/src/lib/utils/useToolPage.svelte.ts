import { domain } from "$lib/state.svelte";
import { onMount } from "svelte";

/**
 * Shared composable for SEO tool pages.
 *
 * Encapsulates the common lifecycle logic every tool page needs:
 * - Calls `lookupFn` on mount when a valid domain is present
 * - Tracks domain name changes via `$effect` and re-fetches automatically
 * - Returns a `handleRefresh` function wired to `domain.refreshTool`
 *
 * @param lookupFn - Async function that performs the lookup (should include the domain validity check)
 * @param refreshTool - Which tool category to refresh: 'dns', 'email', 'rdap', 'server', 'security', 'propagation', or 'subdomains'
 * @returns Object containing `handleRefresh`
 */
export function useToolPage(
    lookupFn: () => Promise<void>,
    refreshTool: 'dns' | 'email' | 'rdap' | 'server' | 'security' | 'propagation' | 'subdomains'
): { handleRefresh: () => Promise<void> } {
    let currentDomain = domain.name;

    $effect(() => {
        if (domain.name && domain.name !== currentDomain) {
            currentDomain = domain.name;
            lookupFn();
        }
    });

    onMount(() => {
        if (domain.name && domain.isValid) {
            lookupFn();
        }
    });

    async function handleRefresh(): Promise<void> {
        await domain.refreshTool(refreshTool);
    }

    return { handleRefresh };
}
