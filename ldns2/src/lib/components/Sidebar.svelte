<script lang="ts">
    import { domain, navigationState } from '$lib/state.svelte';
    import {
        Server,
        Globe,
        FileSearch,
        Mail,
        ShieldCheck,
        ChevronDown
    } from 'lucide-svelte';
    import ThemeToggle from './ThemeToggle.svelte';

    let moreToolsOpen = $state(false);

    const domainName = $derived(domain.name || 'example.com');

    const isDnsActive = $derived(navigationState.currentPage === 'dns');
    const isRdapActive = $derived(navigationState.currentPage === 'rdap');
    const isServerActive = $derived(navigationState.currentPage === 'server');
    const isSecurityActive = $derived(navigationState.currentPage === 'security');
    const isEmailActive = $derived(navigationState.currentPage === 'email');

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

    interface NavItem {
        href: string;
        label: string;
    }

    const recordTools: NavItem[] = [
        { href: '/{d}/a', label: 'A Records' },
        { href: '/{d}/aaaa', label: 'AAAA Records' },
        { href: '/{d}/mx', label: 'MX' },
        { href: '/{d}/ns', label: 'NS' },
        { href: '/{d}/txt', label: 'TXT' },
        { href: '/{d}/cname', label: 'CNAME' },
        { href: '/{d}/caa', label: 'CAA' },
        { href: '/{d}/soa', label: 'SOA' }
    ];
    const ipTools: NavItem[] = [
        { href: '/{d}/ip', label: 'IP Addresses' },
        { href: '/{d}/asn', label: 'ASN / Origin' },
        { href: '/{d}/geo', label: 'IP Geolocation' },
        { href: '/{d}/reverse-dns', label: 'Reverse DNS' }
    ];
    const emailTools: NavItem[] = [
        { href: '/{d}/spf', label: 'SPF' },
        { href: '/{d}/dmarc', label: 'DMARC' },
        { href: '/{d}/dkim', label: 'DKIM' }
    ];
    const serverTools: NavItem[] = [
        { href: '/{d}/headers', label: 'HTTP Headers' },
        { href: '/{d}/security-headers', label: 'Security Headers' },
        { href: '/{d}/tls', label: 'TLS Certificate' }
    ];
    const otherTools: NavItem[] = [
        { href: '/{d}/whois', label: 'WHOIS' },
        { href: '/{d}/propagation', label: 'Propagation' },
        { href: '/{d}/subdomains', label: 'Subdomains' }
    ];

    function resolve(items: NavItem[]): NavItem[] {
        return items.map((i) => ({ ...i, href: i.href.replace('{d}', domainName) }));
    }

    const moreGroups = $derived([
        { label: 'records', items: resolve(recordTools) },
        { label: 'ip', items: resolve(ipTools) },
        { label: 'email', items: resolve(emailTools) },
        { label: 'server', items: resolve(serverTools) },
        { label: 'other', items: resolve(otherTools) }
    ]);
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
            <ul class="space-y-0.5">
                <li>
                    <a
                        href="/{domainName}"
                        onclick={handleNavClick}
                        class="flex items-center p-2 rounded-lg transition-colors {isDnsActive
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                    >
                        <Globe class="w-4 h-4" />
                        <span class="ml-3 text-sm">DNS</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/{domainName}/rdap"
                        onclick={handleNavClick}
                        class="flex items-center p-2 rounded-lg transition-colors {isRdapActive
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                    >
                        <FileSearch class="w-4 h-4" />
                        <span class="ml-3 text-sm">RDAP</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/{domainName}/email"
                        onclick={handleNavClick}
                        class="flex items-center p-2 rounded-lg transition-colors {isEmailActive
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                    >
                        <Mail class="w-4 h-4" />
                        <span class="ml-3 text-sm">Email</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/{domainName}/security"
                        onclick={handleNavClick}
                        class="flex items-center p-2 rounded-lg transition-colors {isSecurityActive
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                    >
                        <ShieldCheck class="w-4 h-4" />
                        <span class="ml-3 text-sm">Security</span>
                    </a>
                </li>
                <li>
                    <a
                        href="/{domainName}/server"
                        onclick={handleNavClick}
                        class="flex items-center p-2 rounded-lg transition-colors {isServerActive
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-fg-muted hover:bg-surface-3 hover:text-fg'}"
                    >
                        <Server class="w-4 h-4" />
                        <span class="ml-3 text-sm">Server</span>
                    </a>
                </li>
            </ul>

            <!-- More tools -->
            <div class="mt-3 pt-3 border-t border-line">
                <button
                    onclick={() => (moreToolsOpen = !moreToolsOpen)}
                    class="flex items-center justify-between w-full p-2 rounded-lg text-fg-subtle hover:bg-surface-3 transition-colors"
                >
                    <span class="font-mono text-[10px] uppercase tracking-wider">// more tools</span>
                    <ChevronDown class="w-3 h-3 transition-transform {moreToolsOpen ? 'rotate-180' : ''}" />
                </button>
                {#if moreToolsOpen}
                    <div class="mt-2 space-y-3">
                        {#each moreGroups as group}
                            <div>
                                <p class="px-2 font-mono text-[9px] uppercase tracking-wider text-fg-subtle/70 mb-1">{group.label}</p>
                                <ul class="space-y-0.5">
                                    {#each group.items as item}
                                        <li>
                                            <a
                                                href={item.href}
                                                onclick={handleNavClick}
                                                class="block px-2 py-1 text-xs rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
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
            </div>
        </nav>

        <!-- Footer with extension link -->
        <div class="p-3 border-t border-line">
            <a
                href="/extension"
                class="flex items-center justify-between p-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs hover:bg-primary-500/15 transition-colors"
            >
                <span>Browser extension</span>
                <span class="font-mono text-[10px]">→</span>
            </a>
        </div>
    </div>
</aside>
