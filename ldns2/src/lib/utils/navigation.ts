/** Route groups mapped to their page slugs */
const ROUTE_GROUPS: Record<string, string[]> = {
    dns: ['', 'a', 'aaaa', 'mx', 'ns', 'txt', 'cname', 'caa', 'soa', 'ip', 'asn', 'geo', 'propagation', 'reverse-dns', 'subdomains'],
    email: ['email', 'spf', 'dmarc', 'dkim'],
    rdap: ['rdap', 'whois'],
    server: ['server', 'headers'],
    security: ['security', 'security-headers', 'tls']
};

export type PageGroup = 'dns' | 'rdap' | 'server' | 'email' | 'security';

/**
 * Determine the navigation page group from a URL pathname.
 * Extracts the last segment of the path and matches it to a group.
 */
export function getPageGroup(pathname: string): PageGroup {
    const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';

    for (const [group, slugs] of Object.entries(ROUTE_GROUPS)) {
        if (slugs.includes(lastSegment)) {
            return group as PageGroup;
        }
    }

    // Default to dns for any unrecognized route (e.g., bare domain)
    return 'dns';
}
