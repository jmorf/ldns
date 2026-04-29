<script lang="ts">
    import { domain, navigationState } from '$lib/state.svelte';
    import { page } from '$app/stores';
    import {
        Server,
        Globe,
        FileSearch,
        Mail,
        ShieldCheck,
        ChevronRight
    } from 'lucide-svelte';
    import ThemeToggle from './ThemeToggle.svelte';

    const domainName = $derived(domain.name || 'example.com');
    const currentPath = $derived($page.url.pathname);

    interface SubTool {
        slug: string;
        label: string;
    }
    interface SubGroup {
        label: string;
        items: SubTool[];
    }
    interface TopLevel {
        slug: string; // empty string for the root /{d}
        label: string;
        icon: typeof Globe;
        groups: SubGroup[];
    }

    // The top-level entries map to /{d}, /{d}/rdap, /{d}/email, /{d}/security,
    // /{d}/server. Sub-tools nest underneath their parent and are arranged in
    // small subgroups when there are enough of them to warrant labelling.
    const sections: TopLevel[] = [
        {
            slug: '',
            label: 'DNS',
            icon: Globe,
            groups: [
                {
                    label: 'records',
                    items: [
                        { slug: 'a', label: 'A' },
                        { slug: 'aaaa', label: 'AAAA' },
                        { slug: 'mx', label: 'MX' },
                        { slug: 'ns', label: 'NS' },
                        { slug: 'txt', label: 'TXT' },
                        { slug: 'cname', label: 'CNAME' },
                        { slug: 'caa', label: 'CAA' },
                        { slug: 'soa', label: 'SOA' }
                    ]
                },
                {
                    label: 'ip',
                    items: [
                        { slug: 'ip', label: 'IP Addresses' },
                        { slug: 'asn', label: 'ASN / Origin' },
                        { slug: 'geo', label: 'IP Geolocation' },
                        { slug: 'reverse-dns', label: 'Reverse DNS' }
                    ]
                },
                {
                    label: 'discovery',
                    items: [
                        { slug: 'propagation', label: 'Propagation' },
                        { slug: 'subdomains', label: 'Subdomains' }
                    ]
                }
            ]
        },
        {
            slug: 'rdap',
            label: 'RDAP',
            icon: FileSearch,
            groups: [
                {
                    label: '',
                    items: [{ slug: 'whois', label: 'WHOIS Fallback' }]
                }
            ]
        },
        {
            slug: 'email',
            label: 'Email',
            icon: Mail,
            groups: [
                {
                    label: '',
                    items: [
                        { slug: 'spf', label: 'SPF' },
                        { slug: 'dmarc', label: 'DMARC' },
                        { slug: 'dkim', label: 'DKIM' }
                    ]
                }
            ]
        },
        {
            slug: 'security',
            label: 'Security',
            icon: ShieldCheck,
            groups: [
                {
                    label: '',
                    items: [
                        { slug: 'security-headers', label: 'Security Headers' },
                        { slug: 'tls', label: 'TLS Certificate' }
                    ]
                }
            ]
        },
        {
            slug: 'server',
            label: 'Server',
            icon: Server,
            groups: [
                {
                    label: '',
                    items: [{ slug: 'headers', label: 'HTTP Headers' }]
                }
            ]
        }
    ];

    function pathFor(topSlug: string, subSlug = ''): string {
        const base = `/${domainName}${topSlug ? `/${topSlug}` : ''}`;
        return subSlug ? `${base.replace(/\/$/, '')}/${subSlug}` : base;
        // Note: topSlug is '' for DNS root, so base = `/${domainName}`.
        // When sub is provided we drop the parent slug and append sub directly,
        // because all current sub-tools are flat children of /{domainName}.
    }
    function subPathFor(subSlug: string): string {
        return `/${domainName}/${subSlug}`;
    }

    function topLevelPath(topSlug: string): string {
        return topSlug ? `/${domainName}/${topSlug}` : `/${domainName}`;
    }

    // A section is "current" if the URL is its top-level path or any of its
    // sub-tool paths. Used to auto-expand and to highlight the parent row.
    function sectionContainsCurrent(s: TopLevel): boolean {
        if (currentPath === topLevelPath(s.slug)) return true;
        for (const group of s.groups) {
            for (const item of group.items) {
                if (currentPath === subPathFor(item.slug)) return true;
            }
        }
        return false;
    }

    function isActiveTop(s: TopLevel): boolean {
        return currentPath === topLevelPath(s.slug);
    }
    function isActiveSub(subSlug: string): boolean {
        return currentPath === subPathFor(subSlug);
    }

    // Per-section expand state. Default each section open if it contains the
    // current page; manual toggles win after that.
    let openSections = $state<Record<string, boolean>>({});
    let lastSyncedPath = '';
    $effect(() => {
        const path = currentPath;
        if (path === lastSyncedPath) return;
        lastSyncedPath = path;
        const next: Record<string, boolean> = { ...openSections };
        for (const s of sections) {
            if (sectionContainsCurrent(s)) next[s.slug] = true;
        }
        openSections = next;
    });

    function toggleSection(slug: string) {
        openSections = { ...openSections, [slug]: !openSections[slug] };
    }

    function handleBackdropClick() {
        navigationState.closeSidebar();
    }
    function handleBackdropKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
            navigationState.closeSidebar();
        }
    }
    function handleNavClick() {
        navigationState.closeSidebar();
    }
</script>

{#if navigationState.sidebarOpen}
    <div
        class="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onclick={handleBackdropClick}
        onkeydown={handleBackdropKeydown}
        role="button"
        tabindex="-1"
    ></div>
{/if}

<aside
    class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform {navigationState.sidebarOpen
        ? 'translate-x-0'
        : '-translate-x-full'} lg:translate-x-0"
>
    <div class="flex flex-col h-full bg-surface-2 border-r border-line">
        <!-- Brand + theme toggle -->
        <div class="flex items-center justify-between p-4 border-b border-line">
            <a href="/" onclick={handleNavClick} class="flex items-center gap-2">
                <img src="/favicon.ico" class="w-6 h-6 rounded" alt="LDNS" />
                <span class="text-base font-semibold tracking-tight text-fg">LDNS</span>
            </a>
            <ThemeToggle />
        </div>

        <!-- Primary nav -->
        <nav class="flex-1 overflow-y-auto py-3 px-3">
            <ul class="space-y-1">
                {#each sections as s}
                    {@const Icon = s.icon}
                    {@const open = !!openSections[s.slug]}
                    {@const active = isActiveTop(s)}
                    {@const containsCurrent = sectionContainsCurrent(s)}
                    <li>
                        <div
                            class="flex items-stretch rounded-lg overflow-hidden {active
                                ? 'bg-primary-500/15'
                                : containsCurrent
                                    ? 'bg-surface-3/40'
                                    : ''}"
                        >
                            <a
                                href={topLevelPath(s.slug)}
                                onclick={handleNavClick}
                                class="flex items-center gap-3 flex-1 p-2 text-sm transition-colors {active
                                    ? 'text-primary-400'
                                    : 'text-fg-muted hover:text-fg'}"
                            >
                                <Icon class="w-4 h-4" />
                                <span>{s.label}</span>
                            </a>
                            <button
                                type="button"
                                onclick={() => toggleSection(s.slug)}
                                aria-label="{open ? 'Collapse' : 'Expand'} {s.label} tools"
                                aria-expanded={open}
                                class="px-2 text-fg-subtle hover:text-fg transition-colors"
                            >
                                <ChevronRight class="w-3.5 h-3.5 transition-transform {open ? 'rotate-90' : ''}" />
                            </button>
                        </div>

                        {#if open}
                            <div class="ml-4 mt-1 mb-2 pl-3 border-l border-line space-y-2">
                                {#each s.groups as g}
                                    <div>
                                        {#if g.label}
                                            <p class="px-2 font-mono text-[9px] uppercase tracking-wider text-fg-subtle/70 mb-1">// {g.label}</p>
                                        {/if}
                                        <ul class="space-y-0.5">
                                            {#each g.items as item}
                                                <li>
                                                    <a
                                                        href={subPathFor(item.slug)}
                                                        onclick={handleNavClick}
                                                        class="block px-2 py-1 text-xs rounded-md transition-colors {isActiveSub(item.slug)
                                                            ? 'bg-primary-500/15 text-primary-400'
                                                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                                                    >
                                                        {item.label}
                                                    </a>
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        </nav>

        <!-- Footer with extension link -->
        <div class="p-3 border-t border-line">
            <a
                href="/extension"
                class="flex items-center justify-between px-2 py-1.5 text-[11px] text-fg-subtle hover:text-fg-muted transition-colors"
            >
                <span class="font-mono uppercase tracking-wider">// browser extension</span>
                <span class="font-mono">→</span>
            </a>
        </div>
    </div>
</aside>
