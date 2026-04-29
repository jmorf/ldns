import { describe, it, expect } from 'vitest';
import {
    buildFaqSchema,
    generateMxFaqJsonLd,
    generateNsFaqJsonLd,
    generateARecordFaqJsonLd,
    generateTxtFaqJsonLd,
    generateSpfFaqJsonLd,
    generateDmarcFaqJsonLd,
    generateIpFaqJsonLd,
    generateDnsFaqJsonLd,
    generateEmailFaqJsonLd,
    generateRdapFaqJsonLd,
} from './faqJsonLd';
import type { DnsData, EmailData, ParsedRdapData } from '$lib/state.svelte';

const DOMAIN = 'example.com';

function assertValidFaqPage(result: any) {
    expect(result).not.toBeNull();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('FAQPage');
    expect(Array.isArray(result.mainEntity)).toBe(true);
    expect(result.mainEntity.length).toBeGreaterThan(0);
    for (const q of result.mainEntity) {
        expect(q['@type']).toBe('Question');
        expect(typeof q.name).toBe('string');
        expect(q.acceptedAnswer['@type']).toBe('Answer');
        expect(typeof q.acceptedAnswer.text).toBe('string');
    }
}

// ─── Per-Record-Type FAQ Generators ─────────────────────────────

describe('generateMxFaqJsonLd', () => {
    it('returns valid FAQ schema with MX records', () => {
        const records = [
            { data: '10 aspmx.l.google.com', ttl: 300, type: 15 },
            { data: '20 alt1.aspmx.l.google.com', ttl: 300, type: 15 },
        ];
        const result = generateMxFaqJsonLd(DOMAIN, records);
        assertValidFaqPage(result);
        // Should mention the domain
        const text = JSON.stringify(result);
        expect(text).toContain(DOMAIN);
    });

    it('returns FAQ with educational questions when no MX records', () => {
        const result = generateMxFaqJsonLd(DOMAIN, []);
        assertValidFaqPage(result);
    });

    it('returns null for empty domain', () => {
        expect(generateMxFaqJsonLd('', [])).toBeNull();
    });
});

describe('generateNsFaqJsonLd', () => {
    it('returns valid FAQ schema with NS records', () => {
        const records = [
            { data: 'ns1.cloudflare.com', ttl: 86400, type: 2 },
            { data: 'ns2.cloudflare.com', ttl: 86400, type: 2 },
        ];
        const result = generateNsFaqJsonLd(DOMAIN, records);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain(DOMAIN);
    });

    it('returns null for empty domain', () => {
        expect(generateNsFaqJsonLd('', [])).toBeNull();
    });
});

describe('generateARecordFaqJsonLd', () => {
    it('returns valid FAQ schema with A records', () => {
        const records = [
            { data: '93.184.216.34', ttl: 300, type: 1 },
        ];
        const result = generateARecordFaqJsonLd(DOMAIN, records);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('93.184.216.34');
    });

    it('mentions multiple IPs when present', () => {
        const records = [
            { data: '1.2.3.4', ttl: 300, type: 1 },
            { data: '5.6.7.8', ttl: 300, type: 1 },
        ];
        const result = generateARecordFaqJsonLd(DOMAIN, records);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('multiple');
    });

    it('returns null for empty domain', () => {
        expect(generateARecordFaqJsonLd('', [])).toBeNull();
    });
});

describe('generateTxtFaqJsonLd', () => {
    it('returns valid FAQ schema with TXT records', () => {
        const records = [
            { data: 'v=spf1 include:_spf.google.com ~all', ttl: 300, type: 16 },
        ];
        const result = generateTxtFaqJsonLd(DOMAIN, records);
        assertValidFaqPage(result);
        // Should detect SPF
        expect(JSON.stringify(result).toLowerCase()).toContain('spf');
    });

    it('returns null for empty domain', () => {
        expect(generateTxtFaqJsonLd('', [])).toBeNull();
    });
});

describe('generateSpfFaqJsonLd', () => {
    const baseEmailData: EmailData = {
        mx: [], spf: [], txt: [], dmarc: [], mtaSts: [], bimi: [],
        isEmailEnabled: false, provider: '', spfAnalysis: null, dmarcAnalysis: null
    };

    it('returns valid FAQ schema with SPF data', () => {
        const emailData: EmailData = {
            ...baseEmailData,
            spf: [{ data: 'v=spf1 include:_spf.google.com -all', ttl: 300, type: 16 }],
        };
        const result = generateSpfFaqJsonLd(DOMAIN, emailData);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('-all');
    });

    it('handles missing SPF records', () => {
        const result = generateSpfFaqJsonLd(DOMAIN, baseEmailData);
        assertValidFaqPage(result);
        expect(JSON.stringify(result).toLowerCase()).toContain('does not have');
    });

    it('returns null for empty domain', () => {
        expect(generateSpfFaqJsonLd('', null)).toBeNull();
    });
});

describe('generateDmarcFaqJsonLd', () => {
    const baseEmailData: EmailData = {
        mx: [], spf: [], txt: [], dmarc: [], mtaSts: [], bimi: [],
        isEmailEnabled: false, provider: '', spfAnalysis: null, dmarcAnalysis: null
    };

    it('returns valid FAQ schema with DMARC data', () => {
        const emailData: EmailData = {
            ...baseEmailData,
            dmarc: [{ data: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com', ttl: 300, type: 16 }],
        };
        const result = generateDmarcFaqJsonLd(DOMAIN, emailData);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('reject');
    });

    it('returns null for empty domain', () => {
        expect(generateDmarcFaqJsonLd('', null)).toBeNull();
    });
});

describe('generateIpFaqJsonLd', () => {
    it('returns valid FAQ schema with both IPv4 and IPv6', () => {
        const aRecords = [{ data: '93.184.216.34', ttl: 300, type: 1 }];
        const aaaaRecords = [{ data: '2606:2800:220:1:248:1893:25c8:1946', ttl: 300, type: 28 }];
        const result = generateIpFaqJsonLd(DOMAIN, aRecords, aaaaRecords);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('IPv6');
    });

    it('reports no IPv6 when absent', () => {
        const result = generateIpFaqJsonLd(DOMAIN, [{ data: '1.2.3.4', ttl: 300, type: 1 }], []);
        assertValidFaqPage(result);
        expect(JSON.stringify(result)).toContain('does not');
    });

    it('returns null for empty domain', () => {
        expect(generateIpFaqJsonLd('', [], [])).toBeNull();
    });
});

// ─── Existing FAQ Generators ─────────────────────────────────────

describe('generateDnsFaqJsonLd', () => {
    it('returns null for null data', () => {
        expect(generateDnsFaqJsonLd(DOMAIN, null)).toBeNull();
    });

    it('returns valid FAQ with A records', () => {
        const data: DnsData = { A: [{ data: '1.2.3.4', ttl: 300, type: 1 }] };
        const result = generateDnsFaqJsonLd(DOMAIN, data);
        assertValidFaqPage(result);
    });

    it('returns null for empty domain', () => {
        expect(generateDnsFaqJsonLd('', { A: [] })).toBeNull();
    });
});

describe('generateEmailFaqJsonLd', () => {
    it('returns null for null data', () => {
        expect(generateEmailFaqJsonLd(DOMAIN, null)).toBeNull();
    });

    it('returns valid FAQ with email data', () => {
        const data: EmailData = {
            isEmailEnabled: true,
            mx: [{ data: '10 mail.example.com', ttl: 300, type: 15 }],
            spf: [], txt: [], dmarc: [], mtaSts: [], bimi: [],
            provider: '', spfAnalysis: null, dmarcAnalysis: null
        };
        const result = generateEmailFaqJsonLd(DOMAIN, data);
        assertValidFaqPage(result);
    });
});

describe('generateRdapFaqJsonLd', () => {
    it('returns null for null data', () => {
        expect(generateRdapFaqJsonLd(DOMAIN, null)).toBeNull();
    });

    it('returns valid FAQ with RDAP data', () => {
        const data: ParsedRdapData = {
            domainName: DOMAIN,
            status: ['active'],
            events: [{ action: 'registration', date: '2020-01-01T00:00:00Z', actor: '' }],
            entities: [],
            nameservers: ['ns1.example.com'],
            created: '2020-01-01T00:00:00Z',
            updated: '2024-01-01T00:00:00Z',
            expires: '2026-01-01T00:00:00Z',
            registrar: 'Example Registrar',
            rdapServer: 'https://rdap.example.com',
            dnssecEnabled: false,
            dnssecData: undefined,
        };
        const result = generateRdapFaqJsonLd(DOMAIN, data);
        assertValidFaqPage(result);
    });
});

// ─── buildFaqSchema (exported helper) ───────────────────────────

describe('buildFaqSchema', () => {
    it('builds valid FAQ schema from static items', () => {
        const items = [
            { question: 'What is DNS?', answer: 'DNS translates domain names to IP addresses.' },
            { question: 'What is an A record?', answer: 'An A record maps a domain to an IPv4 address.' },
        ];
        const result = buildFaqSchema(items);
        assertValidFaqPage(result);
        expect(result.mainEntity).toHaveLength(2);
        expect(result.mainEntity[0].name).toBe('What is DNS?');
        expect(result.mainEntity[1].acceptedAnswer.text).toBe('An A record maps a domain to an IPv4 address.');
    });

    it('returns valid schema with empty array', () => {
        const result = buildFaqSchema([]);
        expect(result['@context']).toBe('https://schema.org');
        expect(result['@type']).toBe('FAQPage');
        expect(result.mainEntity).toHaveLength(0);
    });
});
