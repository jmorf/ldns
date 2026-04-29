import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { domain, queryConfig } from './state.svelte';

// ─── Helpers ─────────────────────────────────────────────────────

/** Build a DoH JSON response for a single record type */
function dnsJsonResponse(answers: Array<{ data: string; TTL: number; type: number }>) {
    return {
        Status: 0,
        Answer: answers,
    };
}

/** Empty DoH JSON response (NXDOMAIN / no records) */
function emptyDnsResponse() {
    return { Status: 3 };
}

/** Mock fetch to return specific responses per URL pattern */
function mockFetch(handlers: Record<string, () => Response | Promise<Response>>) {
    return vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        for (const [pattern, handler] of Object.entries(handlers)) {
            if (url.includes(pattern)) {
                return handler();
            }
        }
        return new Response(JSON.stringify(emptyDnsResponse()), {
            status: 200,
            headers: { 'Content-Type': 'application/dns-json' },
        });
    });
}

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// ─── Domain Validation ──────────────────────────────────────────

describe('domain validation', () => {
    beforeEach(() => {
        domain.name = '';
    });

    it('isValid returns false for empty name', () => {
        domain.name = '';
        expect(domain.isValid).toBe(false);
    });

    it('isValid returns true for valid domain', () => {
        domain.name = 'example.com';
        expect(domain.isValid).toBe(true);
    });

    it('isValid returns true for subdomain', () => {
        domain.name = 'sub.example.com';
        expect(domain.isValid).toBe(true);
    });

    it('extracts TLD correctly', () => {
        domain.name = 'example.com';
        expect(domain.tld).toBe('com');
    });

    it('extracts TLD for country-code domains', () => {
        domain.name = 'example.co.uk';
        expect(domain.tld).toBe('co.uk');
    });

    it('extracts SLD correctly', () => {
        domain.name = 'example.com';
        expect(domain.sld).toBe('example');
    });

    it('extracts subdomain correctly', () => {
        domain.name = 'blog.example.com';
        expect(domain.subdomain).toBe('blog');
    });

    it('returns empty subdomain for apex domain', () => {
        domain.name = 'example.com';
        expect(domain.subdomain).toBe('');
    });

    it('extracts nested subdomain', () => {
        domain.name = 'a.b.example.com';
        expect(domain.subdomain).toBe('a.b');
    });

    it('extracts rootDomain correctly', () => {
        domain.name = 'sub.example.com';
        expect(domain.rootDomain).toBe('example.com');
    });

    it('rootDomain equals name for apex domain', () => {
        domain.name = 'example.com';
        expect(domain.rootDomain).toBe('example.com');
    });

    it('returns empty strings for empty name', () => {
        domain.name = '';
        expect(domain.tld).toBe('');
        expect(domain.sld).toBe('');
        expect(domain.subdomain).toBe('');
        expect(domain.rootDomain).toBe('');
    });
});

// ─── DNS Lookup ─────────────────────────────────────────────────

describe('lookupDnsRecordsWithToolState', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        domain.name = 'example.com';
        domain.resetToolState('dns');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('queries a single record type', async () => {
        globalThis.fetch = mockFetch({
            'type=A': () => jsonResponse(dnsJsonResponse([
                { data: '93.184.216.34', TTL: 300, type: 1 },
            ])),
        });

        const result = await domain.lookupDnsRecordsWithToolState('A');
        expect(result).not.toBeNull();
        expect(result!.A).toHaveLength(1);
        expect(result!.A[0].data).toBe('93.184.216.34');
        expect(result!.A[0].ttl).toBe(300);
    });

    it('queries multiple record types', async () => {
        // Use exact match patterns to avoid 'type=A' matching 'type=AAAA'
        globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('type=AAAA')) {
                return jsonResponse(dnsJsonResponse([
                    { data: '2606:2800:220:1:248:1893:25c8:1946', TTL: 300, type: 28 },
                ]));
            }
            if (url.includes('type=A')) {
                return jsonResponse(dnsJsonResponse([
                    { data: '93.184.216.34', TTL: 300, type: 1 },
                ]));
            }
            return jsonResponse(emptyDnsResponse());
        });

        const result = await domain.lookupDnsRecordsWithToolState(['A', 'AAAA']);
        expect(result).not.toBeNull();
        expect(result!.A).toHaveLength(1);
        expect(result!.AAAA).toHaveLength(1);
    });

    it('queries ALL common types', async () => {
        globalThis.fetch = mockFetch({});

        const result = await domain.lookupDnsRecordsWithToolState('ALL');
        expect(result).not.toBeNull();
        // ALL should query: A, AAAA, NS, MX, TXT, SOA, CAA, DNSKEY, HTTPS
        expect(globalThis.fetch).toHaveBeenCalledTimes(9);
    });

    it('sets toolState correctly on success', async () => {
        globalThis.fetch = mockFetch({
            'type=A': () => jsonResponse(dnsJsonResponse([
                { data: '1.2.3.4', TTL: 60, type: 1 },
            ])),
        });

        await domain.lookupDnsRecordsWithToolState('A');
        expect(domain.toolState.dns.loading).toBe(false);
        expect(domain.toolState.dns.error).toBe('');
        expect(domain.toolState.dns.hasData).toBe(true);
        expect(domain.toolState.dns.data).not.toBeNull();
    });

    it('handles empty responses', async () => {
        globalThis.fetch = mockFetch({
            'type=A': () => jsonResponse(emptyDnsResponse()),
        });

        const result = await domain.lookupDnsRecordsWithToolState('A');
        expect(result).not.toBeNull();
        expect(result!.A).toHaveLength(0);
    });

    it('returns null for invalid domain', async () => {
        domain.name = '';
        const result = await domain.lookupDnsRecordsWithToolState('A');
        expect(result).toBeNull();
        expect(domain.toolState.dns.error).toBe('Invalid domain');
    });

    it('strips trailing dots from record data', async () => {
        globalThis.fetch = mockFetch({
            'type=NS': () => jsonResponse(dnsJsonResponse([
                { data: 'ns1.example.com.', TTL: 86400, type: 2 },
            ])),
        });

        const result = await domain.lookupDnsRecordsWithToolState('NS');
        expect(result!.NS[0].data).toBe('ns1.example.com');
    });

    it('handles fetch errors gracefully per query', async () => {
        globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        // Individual query errors are caught and return empty arrays
        const result = await domain.lookupDnsRecordsWithToolState('A');
        expect(result).not.toBeNull();
        expect(result!.A).toHaveLength(0);
        expect(domain.toolState.dns.loading).toBe(false);
        expect(domain.toolState.dns.hasData).toBe(true);
    });
});

// ─── RDAP Lookup ────────────────────────────────────────────────

describe('lookupRdap', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        domain.name = 'example.com';
        domain.resetToolState('rdap');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('parses RDAP response correctly', async () => {
        const rdapResponse = {
            ldhName: 'example.com',
            handle: 'D1234-EXAMPLE',
            status: ['active', 'clientTransferProhibited'],
            events: [
                { eventAction: 'registration', eventDate: '2010-01-01T00:00:00Z' },
                { eventAction: 'expiration', eventDate: '2030-01-01T00:00:00Z' },
                { eventAction: 'last changed', eventDate: '2024-06-15T12:00:00Z' },
            ],
            entities: [
                {
                    roles: ['registrar'],
                    handle: 'R1234',
                    vcardArray: ['vcard', [['fn', {}, 'text', 'Example Registrar Inc.']]],
                },
            ],
            nameservers: [
                { ldhName: 'ns1.example.com' },
                { ldhName: 'ns2.example.com' },
            ],
            secureDNS: { delegationSigned: true },
        };

        globalThis.fetch = vi.fn(async () => jsonResponse(rdapResponse));

        const result = await domain.lookupRdap();
        expect(result).not.toBeNull();
        expect(result!.domainName).toBe('example.com');
        expect(result!.status).toEqual(['active', 'clientTransferProhibited']);
        expect(result!.nameservers).toEqual(['ns1.example.com', 'ns2.example.com']);
        expect(result!.created).toBe('2010-01-01T00:00:00Z');
        expect(result!.expires).toBe('2030-01-01T00:00:00Z');
        expect(result!.updated).toBe('2024-06-15T12:00:00Z');
        expect(result!.registrar).toBe('Example Registrar Inc.');
        expect(result!.dnssecEnabled).toBe(true);
    });

    it('sets toolState on success', async () => {
        globalThis.fetch = vi.fn(async () => jsonResponse({
            ldhName: 'example.com',
            status: ['active'],
            events: [],
            entities: [],
            nameservers: [],
        }));

        await domain.lookupRdap();
        expect(domain.toolState.rdap.loading).toBe(false);
        expect(domain.toolState.rdap.hasData).toBe(true);
        expect(domain.toolState.rdap.error).toBe('');
    });

    it('handles 404 (domain not found)', async () => {
        globalThis.fetch = vi.fn(async () => new Response('Not found', { status: 404 }));

        const result = await domain.lookupRdap();
        expect(result).toBeNull();
        expect(domain.toolState.rdap.error).toContain('not found');
    });

    it('handles missing optional fields', async () => {
        globalThis.fetch = vi.fn(async () => jsonResponse({
            ldhName: 'example.com',
        }));

        const result = await domain.lookupRdap();
        expect(result).not.toBeNull();
        expect(result!.status).toEqual([]);
        expect(result!.nameservers).toEqual([]);
        expect(result!.registrar).toBeNull();
        expect(result!.dnssecEnabled).toBe(false);
    });

    it('returns null for invalid domain', async () => {
        domain.name = '';
        const result = await domain.lookupRdap();
        expect(result).toBeNull();
    });
});

// ─── Email Record Lookup ────────────────────────────────────────

describe('lookupEmailRecords', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        domain.name = 'example.com';
        domain.resetToolState('email');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('identifies email as enabled when MX records exist', async () => {
        globalThis.fetch = mockFetch({
            'type=MX': () => jsonResponse(dnsJsonResponse([
                { data: '10 aspmx.l.google.com.', TTL: 300, type: 15 },
            ])),
            'type=TXT': () => jsonResponse(dnsJsonResponse([
                { data: '"v=spf1 include:_spf.google.com ~all"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result).not.toBeNull();
        expect(result!.isEmailEnabled).toBe(true);
        expect(result!.mx).toHaveLength(1);
    });

    it('identifies email provider from MX records', async () => {
        globalThis.fetch = mockFetch({
            'type=MX': () => jsonResponse(dnsJsonResponse([
                { data: '1 aspmx.l.google.com.', TTL: 300, type: 15 },
                { data: '5 alt1.aspmx.l.google.com.', TTL: 300, type: 15 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.provider).toContain('Google');
    });

    it('parses SPF records from TXT', async () => {
        globalThis.fetch = mockFetch({
            'name=example.com&type=TXT': () => jsonResponse(dnsJsonResponse([
                { data: '"v=spf1 include:_spf.google.com -all"', TTL: 300, type: 16 },
                { data: '"unrelated-txt-record"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.spf).toHaveLength(1);
        expect(result!.spfAnalysis).not.toBeNull();
        expect(result!.spfAnalysis!.policy).toBe('fail');
    });

    it('parses DMARC records', async () => {
        globalThis.fetch = mockFetch({
            '_dmarc': () => jsonResponse(dnsJsonResponse([
                { data: '"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.dmarc).toHaveLength(1);
        expect(result!.dmarcAnalysis).not.toBeNull();
        expect(result!.dmarcAnalysis!.policy).toBe('reject');
        expect(result!.dmarcAnalysis!.strictness).toBe('high');
    });

    it('handles no email records', async () => {
        globalThis.fetch = mockFetch({});

        const result = await domain.lookupEmailRecords();
        expect(result!.isEmailEnabled).toBe(false);
        expect(result!.mx).toHaveLength(0);
    });

    it('returns null for invalid domain', async () => {
        domain.name = '';
        const result = await domain.lookupEmailRecords();
        expect(result).toBeNull();
    });
});

// ─── SPF Parsing (via lookupEmailRecords) ───────────────────────

describe('SPF parsing', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        domain.name = 'example.com';
        domain.resetToolState('email');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('detects softfail policy (~all)', async () => {
        globalThis.fetch = mockFetch({
            'name=example.com&type=TXT': () => jsonResponse(dnsJsonResponse([
                { data: '"v=spf1 include:_spf.google.com ~all"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.spfAnalysis!.policy).toBe('softfail');
    });

    it('detects hardfail policy (-all)', async () => {
        globalThis.fetch = mockFetch({
            'name=example.com&type=TXT': () => jsonResponse(dnsJsonResponse([
                { data: '"v=spf1 include:_spf.google.com -all"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.spfAnalysis!.policy).toBe('fail');
    });

    it('extracts email providers from SPF includes', async () => {
        globalThis.fetch = mockFetch({
            'name=example.com&type=TXT': () => jsonResponse(dnsJsonResponse([
                { data: '"v=spf1 include:_spf.google.com include:sendgrid.net ~all"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.spfAnalysis!.providers).toContain('Google Workspace');
        expect(result!.spfAnalysis!.providers).toContain('SendGrid');
    });
});

// ─── DMARC Parsing (via lookupEmailRecords) ─────────────────────

describe('DMARC parsing', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        domain.name = 'example.com';
        domain.resetToolState('email');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('parses quarantine policy', async () => {
        globalThis.fetch = mockFetch({
            '_dmarc': () => jsonResponse(dnsJsonResponse([
                { data: '"v=DMARC1; p=quarantine; pct=50"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.dmarcAnalysis!.policy).toBe('quarantine');
        expect(result!.dmarcAnalysis!.percentage).toBe(50);
        expect(result!.dmarcAnalysis!.strictness).toBe('medium');
    });

    it('parses none policy', async () => {
        globalThis.fetch = mockFetch({
            '_dmarc': () => jsonResponse(dnsJsonResponse([
                { data: '"v=DMARC1; p=none; rua=mailto:reports@example.com"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.dmarcAnalysis!.policy).toBe('none');
        expect(result!.dmarcAnalysis!.strictness).toBe('low');
        expect(result!.dmarcAnalysis!.reportingAddresses.aggregate).toContain('reports@example.com');
    });

    it('extracts subdomain policy', async () => {
        globalThis.fetch = mockFetch({
            '_dmarc': () => jsonResponse(dnsJsonResponse([
                { data: '"v=DMARC1; p=reject; sp=quarantine"', TTL: 300, type: 16 },
            ])),
        });

        const result = await domain.lookupEmailRecords();
        expect(result!.dmarcAnalysis!.policy).toBe('reject');
        expect(result!.dmarcAnalysis!.subdomainPolicy).toBe('quarantine');
    });
});

// ─── resetToolState ─────────────────────────────────────────────

describe('resetToolState', () => {
    it('resets dns tool state', () => {
        domain.toolState.dns = {
            loading: true,
            error: 'something',
            data: { A: [] },
            hasData: true,
        };

        domain.resetToolState('dns');

        expect(domain.toolState.dns.loading).toBe(false);
        expect(domain.toolState.dns.error).toBe('');
        expect(domain.toolState.dns.data).toBeNull();
        expect(domain.toolState.dns.hasData).toBe(false);
    });

    it('resets email tool state', () => {
        domain.resetToolState('email');
        expect(domain.toolState.email.loading).toBe(false);
        expect(domain.toolState.email.data).toBeNull();
    });

    it('resets rdap tool state', () => {
        domain.resetToolState('rdap');
        expect(domain.toolState.rdap.data).toBeNull();
    });

    it('resets server tool state', () => {
        domain.resetToolState('server');
        expect(domain.toolState.server.data).toBeNull();
    });

    it('resets security tool state', () => {
        domain.resetToolState('security');
        expect(domain.toolState.security.data).toBeNull();
    });
});

// ─── QueryConfig ────────────────────────────────────────────────

describe('queryConfig', () => {
    it('defaults to cloudflare endpoint', () => {
        expect(queryConfig.endpoint).toBe('cloudflare');
    });

    it('returns correct cloudflare URL', () => {
        queryConfig.endpoint = 'cloudflare';
        expect(queryConfig.endpointUrl).toBe('https://cloudflare-dns.com/dns-query');
    });

    it('returns correct google URL', () => {
        queryConfig.endpoint = 'google';
        expect(queryConfig.endpointUrl).toBe('https://dns.google/resolve');
    });

    it('returns correct dns-sb URL', () => {
        queryConfig.endpoint = 'dns-sb';
        expect(queryConfig.endpointUrl).toBe('https://doh.dns.sb/dns-query');
    });

    it('returns display name', () => {
        queryConfig.endpoint = 'cloudflare';
        expect(queryConfig.endpointName).toBe('Cloudflare');
        queryConfig.endpoint = 'google';
        expect(queryConfig.endpointName).toBe('Google');
        queryConfig.endpoint = 'dns-sb';
        expect(queryConfig.endpointName).toBe('DNS.SB');
    });
});
