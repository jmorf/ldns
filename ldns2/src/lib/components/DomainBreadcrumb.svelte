<script lang="ts">
    import { ChevronRight } from 'lucide-svelte';
    import psl from 'psl';

    interface Props {
        domain: string;
    }

    let { domain }: Props = $props();

    // Parse the domain to get parts
    function parseDomainParts(domainStr: string): string[] {
        const parsed = psl.parse(domainStr);
        if (!parsed || parsed.error) return [];

        const parts: string[] = [];
        
        // Add root domain (sld + tld)
        if (parsed.sld && parsed.tld) {
            parts.push(`${parsed.sld}.${parsed.tld}`);
        }

        // Add subdomain parts if they exist
        if (parsed.subdomain) {
            // Split subdomain by dots and build incremental paths
            const subdomainParts = parsed.subdomain.split('.');
            let currentDomain = `${parsed.sld}.${parsed.tld}`;
            
            // Add each subdomain level
            for (let i = subdomainParts.length - 1; i >= 0; i--) {
                currentDomain = `${subdomainParts[i]}.${currentDomain}`;
                parts.push(currentDomain);
            }
        }

        // If domain is just the root (e.g., apple.com), don't show breadcrumb
        // Only show breadcrumb for subdomains
        return parts;
    }

    // Use $derived for reactive computations in Svelte 5
    const domainParts = $derived(parseDomainParts(domain));
    const showBreadcrumb = $derived(domainParts.length > 1);
</script>

{#if showBreadcrumb}
    <nav aria-label="Breadcrumb" class="hidden sm:inline-flex">
        <ol class="inline-flex items-center">
            {#each domainParts as part, index}
                <li class="inline-flex items-center">
                    {#if index > 0}
                        <ChevronRight class="w-3 h-3 mx-2 text-fg-subtle" />
                    {/if}
                    {#if index < domainParts.length - 1}
                        <a
                            href="/{part}"
                            class="text-fg-muted hover:text-primary-400 transition-colors text-sm"
                            data-sveltekit-preload-data="off"
                        >
                            {index === 0 ? part : part.split('.')[0]}
                        </a>
                    {:else}
                        <span class="text-fg-muted font-medium text-sm">
                            {index === 0 ? part : part.split('.')[0]}
                        </span>
                    {/if}
                </li>
            {/each}
        </ol>
    </nav>
{/if}