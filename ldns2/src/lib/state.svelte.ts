import psl from 'psl';
import type { ForSaleResult } from '@ldns/core/types';

// Re-export ForSale types for consumers
export type { ForSaleResult, ForSaleListing } from '@ldns/core/types';

// ─── Raw API Response Types ────────────────────────────────────────

interface DnsRecord {
    data: string;
    TTL: number;
    type: number;
}

interface DnsResponse {
    Status: number;
    Answer?: DnsRecord[];
}

/** DNS record type name to number mapping */
const DNS_TYPE_MAP: Record<string, number> = {
    'A': 1,
    'NS': 2,
    'CNAME': 5,
    'SOA': 6,
    'PTR': 12,
    'MX': 15,
    'TXT': 16,
    'AAAA': 28,
    'SRV': 33,
    'DS': 43,
    'RRSIG': 46,
    'NSEC': 47,
    'DNSKEY': 48,
    'TLSA': 52,
    'HTTPS': 65,
    'CAA': 257
};

/** Get the DNS record type number from its name */
function getRecordTypeNumber(typeName: string): number {
    return DNS_TYPE_MAP[typeName.toUpperCase()] || 0;
}

interface RdapEvent {
    eventAction: string;
    eventDate: string;
    eventActor?: string;
}

interface RdapEntity {
    roles: string[];
    handle?: string;
    vcardArray?: [string, any[]];
}

interface RdapResponse {
    ldhName?: string;
    handle?: string;
    status?: string[];
    events?: RdapEvent[];
    entities?: RdapEntity[];
    nameservers?: { ldhName: string }[];
    secureDNS?: {
        delegationSigned?: boolean;
        dsData?: Array<{
            keyTag: number;
            algorithm: number;
            digestType: number;
            digest: string;
        }>;
        keyData?: Array<{
            flags: number;
            protocol: number;
            algorithm: number;
            publicKey: string;
        }>;
    };
}

// ─── Parsed / Tool Data Types (exported for consumers) ─────────────

/** A single DNS record result (used across DNS, email, etc.) */
export interface DnsRecordResult {
    data: string;
    ttl: number;
    type: number;
}

/** DNS lookup results keyed by record type */
export type DnsData = Record<string, DnsRecordResult[]>;

/** Parsed RDAP / WHOIS data */
export interface ParsedRdapData {
    domainName: string;
    status: string[];
    events: Array<{ action: string; date: string; actor: string }>;
    entities: Array<{
        role: string;
        handle: string;
        name: string;
        org: string;
        email: string;
        tel: string;
        country: string;
    }>;
    nameservers: string[];
    created: string;
    updated: string;
    expires: string;
    registrar: string | null;
    rdapServer: string;
    dnssecEnabled: boolean;
    dnssecData: RdapResponse['secureDNS'];
}

/** SPF record analysis */
export interface SPFAnalysis {
    mechanisms: string[];
    modifiers: Record<string, string>;
    policy: string;
    includes: number;
    providers: string[];
    raw: string;
}

/** DMARC record analysis */
export interface DMARCAnalysis {
    policy: string;
    subdomainPolicy: string;
    percentage: number;
    alignment: { dkim: string; spf: string };
    reportingAddresses: { aggregate: string[]; forensic: string[] };
    strictness: string;
    tags: Record<string, string>;
    raw: string;
}

/** Email lookup results */
export interface EmailData {
    mx: DnsRecordResult[];
    spf: DnsRecordResult[];
    txt: DnsRecordResult[];
    dmarc: DnsRecordResult[];
    mtaSts: DnsRecordResult[];
    bimi: DnsRecordResult[];
    tlsrpt?: DnsRecordResult[];
    isEmailEnabled: boolean;
    provider: string;
    spfAnalysis: SPFAnalysis | null;
    dmarcAnalysis: DMARCAnalysis | null;
}

/** Server info data */
export interface ServerData {
    info: {
        ip: string | null;
        httpVersion: string | null;
        server: string | null;
        location: string | null;
        lastChecked: string;
    };
    headers: Record<string, string> | null;
    ssl: {
        valid: boolean;
        issuer: string;
        subject?: string;
        validFrom: string;
        validTo: string;
        protocol: string;
        cipher: string;
    } | null;
    response: {
        time: number | null;
        size: number | null;
        status: number | null;
        redirects: number;
        corsBlocked?: boolean;
    } | null;
}

/** SSL analysis from CAA records */
export interface SSLAnalysis {
    enabled: boolean;
    grade: string;
    hasCAA: boolean;
    caaRecords: DnsRecordResult[];
    issues: string[];
    recommendations?: string[];
    score: number;
    details: string;
}

/** Email security analysis */
export interface EmailSecurityAnalysis {
    score: number;
    grade: string;
    spf: boolean;
    dmarc: boolean;
    mx: boolean;
    issues: string[];
    recommendations: string[];
}

/** Domain reputation analysis */
export interface ReputationAnalysis {
    phishtank: { status: string; checked: boolean; details?: unknown; error?: string };
    safeBrowsing: { status: string; checked: boolean; note?: string; error?: string };
    overall: { score: number; status: string; grade: string };
}

/** Certificate info from CT logs */
export interface CertificateInfo {
    id: string;
    issuer: string;
    notBefore: string;
    notAfter: string;
    commonName: string;
    nameValue: string;
}

/** Subdomain discovery results */
export interface SubdomainDiscovery {
    loading: boolean;
    subdomains: string[];
    certificates: CertificateInfo[];
    checked: boolean;
    error: string | null;
}

/** Security recommendation */
export interface SecurityRecommendation {
    category: string;
    priority: string;
    title: string;
    description: string;
}

/** Full security analysis data */
export interface SecurityData {
    overall: { score: number; grade: string; summary: string };
    ssl: SSLAnalysis;
    email: EmailSecurityAnalysis;
    reputation: ReputationAnalysis;
    subdomainDiscovery: SubdomainDiscovery;
    recommendations: SecurityRecommendation[];
}

/** DNS propagation result — per-provider DNS results */
export type PropagationResult = Record<string, DnsData>;

/** Subdomain tool result from CT logs */
export interface SubdomainToolResult {
    subdomains: string[];
    total: number;
    certificates: CertificateInfo[];
}

/** Generic tool state wrapper */
export interface ToolState<T> {
    loading: boolean;
    error: string;
    data: T | null;
    hasData: boolean;
}

// Query configuration class
class QueryConfig {
    endpoint = $state('cloudflare');

    // Common DNS record types for filtering and queries
    recordTypes = $state([
        "A",
        "NS",
        "CNAME",
        "SOA",
        "PTR",
        "HINFO",
        "MX",
        "TXT",
        "RP",
        "AFSDB",
        "SIG",
        "KEY",
        "AAAA",
        "LOC",
        "SRV",
        "NAPTR",
        "KX",
        "CERT",
        "DNAME",
        "OPT",
        "APL",
        "DS",
        "SSHFP",
        "IPSECKEY",
        "RRSIG",
        "NSEC",
        "DNSKEY",
        "DHCID",
        "NSEC3",
        "NSEC3PARAM",
        "TLSA",
        "SMIMEA",
        "HIP",
        "CDS",
        "CDNSKEY",
        "OPENPGPKEY",
        "CSYNC",
        "ZONEMD",
        "SVCB",
        "HTTPS",
        "EUI48",
        "EUI64",
        "TKEY",
        "TSIG",
        "IXFR",
        "AXFR",
        "ALL",
        "URI",
        "CAA",
        "TA",
        "DLV",
    ]);

    // Get DNS endpoint URL
    get endpointUrl(): string {
        switch (this.endpoint) {
            case 'google':
                return 'https://dns.google/resolve';
            case 'dns-sb':
                return 'https://doh.dns.sb/dns-query';
            case 'cloudflare':
            default:
                return 'https://cloudflare-dns.com/dns-query';
        }
    }

    // Get endpoint display name
    get endpointName(): string {
        switch (this.endpoint) {
            case 'google':
                return 'Google';
            case 'dns-sb':
                return 'DNS.SB';
            case 'cloudflare':
            default:
                return 'Cloudflare';
        }
    }
}

class DomainName {
    name = $state('');

    // Generalized tool state
    toolState = $state<{
        server: ToolState<ServerData>;
        email: ToolState<EmailData>;
        rdap: ToolState<ParsedRdapData>;
        dns: ToolState<DnsData>;
        security: ToolState<SecurityData>;
        forSale: ToolState<ForSaleResult>;
        propagation: ToolState<PropagationResult>;
        subdomains: ToolState<SubdomainToolResult>;
    }>({
        server: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        email: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        rdap: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        dns: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        security: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        forSale: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        propagation: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        },
        subdomains: {
            loading: false,
            error: '',
            data: null,
            hasData: false
        }
    });

    get tld(): string {
        if (!this.name) return '';

        try {
            const parsed = psl.parse(this.name);
            if (psl.isValid(this.name) && 'tld' in parsed) {
                return parsed.tld || '';
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    get sld(): string {
        if (!this.name) return '';

        try {
            const parsed = psl.parse(this.name);
            if (psl.isValid(this.name) && 'sld' in parsed) {
                return parsed.sld || '';
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    get subdomain(): string {
        if (!this.name) return '';

        try {
            // Parse the domain with PSL
            const parsed = psl.parse(this.name);

            // If there's no subdomain, return empty string
            if (psl.isValid(this.name) && 'subdomain' in parsed) {
                if (!parsed.subdomain) return '';
                // Return the subdomain directly from PSL parsing
                return parsed.subdomain;
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    get rootDomain(): string {
        if (!this.name) return '';

        try {
            const parsed = psl.parse(this.name);
            if (psl.isValid(this.name) && 'domain' in parsed) {
                return parsed.domain || '';
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    get isValid(): boolean {
        if (!this.name) return false;

        return psl.isValid(this.name);
    }

    /**
     * Pure DNS query helper with no state side effects.
     * @param recordTypes Array of specific record types to query
     * @param subdomain Optional subdomain to prepend to the query
     * @param endpoint The DNS over HTTPS endpoint to use (optional, uses queryConfig.endpoint if not provided)
     * @returns Object with results indexed by record type
     */
    private async _queryDns(
        recordTypes: string[],
        subdomain?: string,
        endpoint?: string
    ): Promise<DnsData> {
        const dnsEndpoint = endpoint || queryConfig.endpoint;
        const queryDomain = subdomain ? `${subdomain}.${this.name}` : this.name;

        const queries = recordTypes.map(async (type: string) => {
            try {
                let dnsEndpointUrl: string;
                switch (dnsEndpoint) {
                    case 'google':
                        dnsEndpointUrl = 'https://dns.google/resolve';
                        break;
                    case 'dns-sb':
                        dnsEndpointUrl = 'https://doh.dns.sb/dns-query';
                        break;
                    case 'cloudflare':
                    default:
                        dnsEndpointUrl = 'https://cloudflare-dns.com/dns-query';
                        break;
                }

                const url = new URL(dnsEndpointUrl);
                url.searchParams.append('name', queryDomain);
                url.searchParams.append('type', type);

                // Google's /resolve API returns JSON natively and doesn't need DoH headers
                // Cloudflare and DNS.SB use the DoH JSON format
                const headers: Record<string, string> = dnsEndpoint === 'google'
                    ? {}
                    : { 'Accept': 'application/dns-json' };

                const response = await fetch(url.toString(), { headers });

                if (!response.ok) {
                    throw new Error(`DNS query failed with status: ${response.status}`);
                }

                const data = await response.json() as DnsResponse;

                let results: DnsRecordResult[] = [];
                if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
                    // Filter by requested type (DNS.SB returns RRSIG records too)
                    const expectedType = getRecordTypeNumber(type);
                    results = data.Answer
                        .filter((record: DnsRecord) => record.type === expectedType)
                        .map((record: DnsRecord) => ({
                            data: record.data.replace(/\.$/, ''),
                            ttl: record.TTL,
                            type: record.type
                        }));
                }

                return { type, results };
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error(`DNS lookup error for ${type}:`, error instanceof Error ? error.message : error);
                }
                return { type, results: [] as DnsRecordResult[] };
            }
        });

        const results = await Promise.all(queries);
        return results.reduce<DnsData>((acc, { type, results }) => {
            acc[type] = results;
            return acc;
        }, {});
    }

    /**
     * Look up DNS records using the toolState pattern
     * @param recordTypes Array of record types to look up, or 'ALL' for common types
     * @param subdomain Optional subdomain to prepend to the query
     * @param endpoint The DNS over HTTPS endpoint to use (optional, uses queryConfig.endpoint if not provided)
     * @returns Object with results indexed by record type
     */
    async lookupDnsRecordsWithToolState(
        recordTypes: string | string[] | 'ALL' = 'ALL',
        subdomain?: string,
        endpoint?: string
    ): Promise<DnsData | null> {
        if (!this.isValid) {
            this.toolState.dns.error = "Invalid domain";
            return null;
        }

        this.toolState.dns = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            const typesToQuery = recordTypes === 'ALL'
                ? ['A', 'AAAA', 'NS', 'MX', 'TXT', 'SOA', 'CAA', 'DNSKEY', 'HTTPS']
                : Array.isArray(recordTypes) ? recordTypes : [recordTypes];

            const dnsData = await this._queryDns(typesToQuery, subdomain, endpoint);

            this.toolState.dns = {
                loading: false,
                error: '',
                data: dnsData,
                hasData: true
            };
            return dnsData;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("DNS lookup batch error:", error);
            }
            this.toolState.dns = {
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
 * Look up RDAP information for the domain
 * Returns parsed RDAP data
 */
    async lookupRdap(): Promise<ParsedRdapData | null> {
        if (!this.isValid) {
            this.toolState.rdap = {
                loading: false,
                error: "Invalid domain",
                data: null,
                hasData: false
            };
            return null;
        }

        this.toolState.rdap = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            // Get the registrable domain (root domain without subdomain)
            const domain = this.rootDomain;

            // First try the IANA bootstrap service to find the right RDAP server
            const bootstrapUrl = `https://rdap.org/domain/${domain}`;

            const response = await fetch(bootstrapUrl, {
                headers: {
                    'Accept': 'application/rdap+json'
                },
                redirect: 'follow' // Follow redirects automatically
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Domain not found - This domain may be unregistered or the TLD may not support RDAP queries. Status: ${response.status}`);
                }
                throw new Error(`RDAP lookup failed with status: ${response.status}`);
            }

            const data = await response.json() as RdapResponse;

            // Extract registrar from entities
            const registrarEntity = (data.entities || []).find((entity: RdapEntity) => 
                entity.roles?.includes('registrar') || 
                entity.roles?.includes('registration')
            );
            let registrarName = null;
            if (registrarEntity) {
                // Try to get registrar name from vCard or handle
                const vcardArray = registrarEntity.vcardArray || ['vcard', []];
                const vcardProps = vcardArray[1] || [];
                registrarName = this.findVcardValue(vcardProps, 'fn') || 
                               this.findVcardValue(vcardProps, 'org') || 
                               registrarEntity.handle || 
                               'Unknown Registrar';
            }

            // Parse and format RDAP data
            const parsedData: ParsedRdapData = {
                domainName: data.ldhName || data.handle || domain,
                status: data.status || [],
                events: this.parseRdapEvents(data.events || []),
                entities: this.parseRdapEntities(data.entities || []),
                nameservers: (data.nameservers || []).map((ns: { ldhName: string }) => ns.ldhName || ''),
                created: this.findEventDate(data.events || [], 'registration'),
                updated: this.findEventDate(data.events || [], 'last changed'),
                expires: this.findEventDate(data.events || [], 'expiration'),
                registrar: registrarName,
                rdapServer: response.url, // The actual RDAP server URL after redirects
                dnssecEnabled: data.secureDNS?.delegationSigned === true,
                dnssecData: data.secureDNS
            };

            this.toolState.rdap = {
                loading: false,
                error: '',
                data: parsedData,
                hasData: true
            };

            return parsedData;
        } catch (error) {
            console.error("RDAP lookup error:", error);
            this.toolState.rdap = {
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    // Helper methods for parsing RDAP data
    private parseRdapEvents(events: RdapEvent[]) {
        return events.map((event: RdapEvent) => ({
            action: event.eventAction || '',
            date: event.eventDate || '',
            actor: event.eventActor || ''
        }));
    }

    private parseRdapEntities(entities: RdapEntity[]) {
        return entities.map((entity: RdapEntity) => {
            const roles = entity.roles || [];
            const vcardArray = entity.vcardArray || ['vcard', []];
            const vcardProps = vcardArray[1] || [];

            // Extract common vCard properties
            const name = this.findVcardValue(vcardProps, 'fn');
            const org = this.findVcardValue(vcardProps, 'org');
            const email = this.findVcardValue(vcardProps, 'email');
            const tel = this.findVcardValue(vcardProps, 'tel');
            const country = this.findVcardValue(vcardProps, 'country-name');

            return {
                role: roles.join(', '),
                handle: entity.handle || '',
                name,
                org,
                email,
                tel,
                country
            };
        });
    }

    private findVcardValue(vcardProps: any[], propName: string) {
        const prop = vcardProps.find((p: any) => p[0] === propName);
        return prop ? prop[3] : '';
    }

    private findEventDate(events: RdapEvent[], eventType: string) {
        const event = events.find((e: RdapEvent) => e.eventAction === eventType);
        return event ? event.eventDate : '';
    }

    /**
 * Check server information
 * @returns Server information or null on failure
 */
    async checkServerInfo(): Promise<ServerData | null> {
        // Update state by reassigning the whole object to trigger reactivity
        this.toolState.server = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            const startTime = performance.now();

            // First, resolve IP address using DNS lookup
            let ipAddress = null;
            try {
                const aRecords = await this._queryDns(['A']);
                if (aRecords && aRecords.A && aRecords.A.length > 0) {
                    ipAddress = aRecords.A[0].data;
                }
            } catch (error) {
                console.warn('Failed to resolve A record:', error);
            }

            // Try HTTP request first
            let serverData: ServerData;
            try {
                const response = await fetch(`https://${this.name}`, {
                    method: 'HEAD', // Use HEAD to get headers without body
                    mode: 'cors',
                    redirect: 'follow'
                });

                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);

                // Parse headers
                const headers: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });

                // Get content length from response
                const contentLength = response.headers.get('content-length');
                const size = contentLength ? parseInt(contentLength) : null;

                serverData = {
                    info: {
                        ip: ipAddress,
                        httpVersion: "HTTP/2", // Most modern servers use HTTP/2
                        server: headers['server'] || 'Unknown',
                        location: null, // We'd need a GeoIP service for this
                        lastChecked: new Date().toISOString()
                    },
                    headers: headers,
                    ssl: {
                        valid: response.url.startsWith('https://'),
                        issuer: "Unknown", // Would need certificate inspection
                        validFrom: "Unknown",
                        validTo: "Unknown",
                        protocol: "TLS",
                        cipher: "Unknown"
                    },
                    response: {
                        time: responseTime,
                        size: size,
                        status: response.status,
                        redirects: response.redirected ? 1 : 0
                    }
                };

            } catch (fetchError) {
                console.warn('HTTPS fetch failed:', fetchError);

                // Check if it's a CORS error vs actual connection failure
                const isCorsError = fetchError instanceof TypeError &&
                    (fetchError.message.includes('CORS') ||
                        fetchError.message.includes('network') ||
                        fetchError.message.includes('Failed to fetch'));

                if (isCorsError && ipAddress) {
                    // Domain has DNS records but is CORS-blocked
                    // Create a partial response indicating CORS limitation
                    serverData = {
                        info: {
                            ip: ipAddress,
                            httpVersion: "Unknown",
                            server: "CORS-Protected",
                            location: null,
                            lastChecked: new Date().toISOString()
                        },
                        headers: {
                            "Note": "CORS policy prevents direct browser access",
                            "DNS-Resolved": "Yes",
                            "IP-Address": ipAddress
                        },
                        ssl: null,
                        response: {
                            time: null,
                            size: null,
                            status: null,
                            redirects: 0,
                            corsBlocked: true
                        }
                    };
                } else {
                    // Try HTTP if HTTPS fails and it's not just CORS
                    try {
                        const response = await fetch(`http://${this.name}`, {
                            method: 'HEAD',
                            mode: 'cors',
                            redirect: 'follow'
                        });

                        const endTime = performance.now();
                        const responseTime = Math.round(endTime - startTime);

                        const headers: Record<string, string> = {};
                        response.headers.forEach((value, key) => {
                            headers[key] = value;
                        });

                        const contentLength = response.headers.get('content-length');
                        const size = contentLength ? parseInt(contentLength) : null;

                        serverData = {
                            info: {
                                ip: ipAddress,
                                httpVersion: "HTTP/1.1",
                                server: headers['server'] || 'Unknown',
                                location: null,
                                lastChecked: new Date().toISOString()
                            },
                            headers: headers,
                            ssl: null, // No SSL for HTTP
                            response: {
                                time: responseTime,
                                size: size,
                                status: response.status,
                                redirects: response.redirected ? 1 : 0
                            }
                        };

                    } catch (httpError) {
                        console.warn('Both HTTPS and HTTP failed:', httpError);

                        // Check if we at least have IP resolution
                        if (ipAddress) {
                            // Domain resolves but web server is not accessible
                            const limitedData = {
                                info: {
                                    ip: ipAddress,
                                    httpVersion: null,
                                    server: "No HTTP Response",
                                    location: null,
                                    lastChecked: new Date().toISOString()
                                },
                                headers: {
                                    "Note": "Domain resolves to IP but no HTTP server responding",
                                    "DNS-Status": "Resolved",
                                    "IP-Address": ipAddress
                                },
                                ssl: null,
                                response: null // This indicates no HTTP response but domain exists
                            };

                            this.toolState.server = {
                                loading: false,
                                error: '',
                                data: limitedData,
                                hasData: true
                            };

                            return limitedData;
                        } else {
                            // Domain doesn't resolve at all - truly offline
                            const offlineData = {
                                info: {
                                    ip: null,
                                    httpVersion: null,
                                    server: null,
                                    location: null,
                                    lastChecked: new Date().toISOString()
                                },
                                headers: null,
                                ssl: null,
                                response: null
                            };

                            this.toolState.server = {
                                loading: false,
                                error: '',
                                data: offlineData,
                                hasData: true
                            };

                            return offlineData;
                        }
                    }
                }
            }

            this.toolState.server = {
                loading: false,
                error: '',
                data: serverData,
                hasData: true
            };

            return serverData;
        } catch (error) {
            console.error("Server info error:", error);
            this.toolState.server = {
                loading: false,
                error: `Failed to check server info: ${error}`,
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
     * Look up email-related DNS records for the domain
     * Returns email configuration data including MX, SPF, DMARC, DKIM records
     */
    async lookupEmailRecords(): Promise<EmailData | null> {
        if (!this.isValid) {
            this.toolState.email.error = "Invalid domain";
            return null;
        }

        // Use full toolState replacement for Svelte 5 reactivity
        this.toolState.email = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            // Lookup email-related DNS records
            const emailQueries = [
                this._queryDns(['MX'], undefined),
                this._queryDns(['TXT'], undefined), // For SPF
                this._queryDns(['TXT'], '_dmarc'), // DMARC
                this._queryDns(['TXT'], '_mta-sts'), // MTA-STS
                this._queryDns(['TXT'], 'default._bimi'), // BIMI
            ];

            const [mxResults, txtResults, dmarcResults, mtaStsResults, bimiResults] = await Promise.all(emailQueries);

            // Process MX records
            const mxRecords = mxResults.MX || [];

            // Process SPF records (TXT records starting with "v=spf1")
            const spfRecords = (txtResults.TXT || []).filter(record => {
                // Remove quotes and normalize the data
                const normalizedData = record.data.toLowerCase().replace(/^"(.+)"$/, '$1');
                return normalizedData.startsWith('v=spf1');
            });

            // Process DMARC records (TXT records from _dmarc subdomain starting with "v=DMARC1")
            const dmarcRecords = (dmarcResults.TXT || []).filter(record => {
                const normalizedData = record.data.toLowerCase().replace(/^"(.+)"$/, '$1');
                return normalizedData.startsWith('v=dmarc1');
            });
            
            // Process MTA-STS records (TXT records from _mta-sts subdomain starting with "v=STSv1")
            const mtaStsRecords = (mtaStsResults.TXT || []).filter(record => {
                const normalizedData = record.data.toLowerCase().replace(/^"(.+)"$/, '$1');
                return normalizedData.startsWith('v=stsv1');
            });
            
            // Process BIMI records (TXT records from default._bimi subdomain starting with "v=BIMI1")
            const bimiRecords = (bimiResults.TXT || []).filter(record => {
                // BIMI spec requires v=BIMI1 (case-sensitive per RFC)
                // Remove quotes if present
                const cleanData = record.data.trim().replace(/^["'](.+)["']$/, '$1');
                return cleanData.startsWith('v=BIMI1');
            });

            // Determine if email is enabled
            const isEmailEnabled = mxRecords.length > 0;

            // Try to identify email provider with enhanced detection
            let provider = '';
            const providers: string[] = [];
            
            if (mxRecords.length > 0) {
                // Check all MX records for multiple providers
                for (const mxRecord of mxRecords) {
                    const mxData = mxRecord.data.toLowerCase();
                    if (mxData.includes('google') || mxData.includes('gmail') || mxData.includes('aspmx')) {
                        if (!providers.includes('Google Workspace')) providers.push('Google Workspace');
                    } else if (mxData.includes('outlook') || mxData.includes('microsoft') || mxData.includes('hotmail')) {
                        if (!providers.includes('Microsoft 365')) providers.push('Microsoft 365');
                    } else if (mxData.includes('protonmail') || mxData.includes('proton')) {
                        if (!providers.includes('ProtonMail')) providers.push('ProtonMail');
                    } else if (mxData.includes('mailgun')) {
                        if (!providers.includes('Mailgun')) providers.push('Mailgun');
                    } else if (mxData.includes('sendgrid')) {
                        if (!providers.includes('SendGrid')) providers.push('SendGrid');
                    } else if (mxData.includes('fastmail')) {
                        if (!providers.includes('FastMail')) providers.push('FastMail');
                    } else if (mxData.includes('zoho')) {
                        if (!providers.includes('Zoho Mail')) providers.push('Zoho Mail');
                    } else if (mxData.includes('yandex')) {
                        if (!providers.includes('Yandex Mail')) providers.push('Yandex Mail');
                    } else if (mxData.includes('mimecast')) {
                        if (!providers.includes('Mimecast')) providers.push('Mimecast');
                    } else if (mxData.includes('barracuda')) {
                        if (!providers.includes('Barracuda')) providers.push('Barracuda');
                    } else if (mxData.includes('messagelabs') || mxData.includes('symantec')) {
                        if (!providers.includes('Symantec')) providers.push('Symantec');
                    }
                }
                
                provider = providers.length > 0 ? providers.join(' + ') : 'Custom / Other';
            }

            // Parse SPF details
            const spfAnalysis = spfRecords.length > 0 ? this.parseSPFRecord(spfRecords[0].data) : null;
            
            // Parse DMARC details
            const dmarcAnalysis = dmarcRecords.length > 0 ? this.parseDMARCRecord(dmarcRecords[0].data) : null;
            
            // Create email data
            const emailData: EmailData = {
                mx: mxRecords,
                spf: spfRecords,
                txt: txtResults.TXT || [], // Include all TXT records for SPF analyzer
                dmarc: dmarcRecords,
                mtaSts: mtaStsRecords,
                bimi: bimiRecords,
                isEmailEnabled,
                provider,
                spfAnalysis,
                dmarcAnalysis
            };

            // Use full toolState replacement for Svelte 5 reactivity
            this.toolState.email = {
                loading: false,
                error: '',
                data: emailData,
                hasData: true
            };
            return emailData;
        } catch (error) {
            console.error("Email lookup error:", error);
            // Use full toolState replacement for Svelte 5 reactivity
            this.toolState.email = {
                loading: false,
                error: error instanceof Error ? error.message : "Unknown error",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
     * Check if the domain is listed for sale on marketplaces
     * @returns For-sale data or null on failure
     */
    async lookupForSale(): Promise<ForSaleResult | null> {
        if (!this.isValid) {
            this.toolState.forSale = {
                loading: false,
                error: "Invalid domain",
                data: null,
                hasData: false
            };
            return null;
        }

        this.toolState.forSale = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            // Use the root domain for for-sale checks (not subdomains)
            const domainToCheck = this.rootDomain || this.name;

            // Call our API endpoint which proxies to marketplaces server-side
            const response = await fetch(`/api/forsale?domain=${encodeURIComponent(domainToCheck)}`);

            if (!response.ok) {
                throw new Error(`For-sale check failed: ${response.status}`);
            }

            const data: ForSaleResult = await response.json();

            this.toolState.forSale = {
                loading: false,
                error: '',
                data,
                hasData: true
            };

            return data;
        } catch (error) {
            console.error("For-sale lookup error:", error);
            this.toolState.forSale = {
                loading: false,
                error: error instanceof Error ? error.message : "For-sale check failed",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
     * Look up DNS propagation — query all 3 DoH providers in parallel
     */
    async lookupPropagation(): Promise<PropagationResult | null> {
        if (!this.isValid) {
            this.toolState.propagation = { loading: false, error: "Invalid domain", data: null, hasData: false };
            return null;
        }

        this.toolState.propagation = { loading: true, error: '', data: null, hasData: false };

        try {
            const endpoints = ['cloudflare', 'google', 'dns-sb'];
            const recordTypes = ['A', 'AAAA', 'NS', 'MX', 'TXT', 'SOA', 'CAA'];
            const results = await Promise.all(
                endpoints.map(async (ep) => {
                    try {
                        const data = await this._queryDns(recordTypes, undefined, ep);
                        return { endpoint: ep, data };
                    } catch {
                        return { endpoint: ep, data: {} as DnsData };
                    }
                })
            );

            const propagationData = results.reduce<PropagationResult>((acc, { endpoint, data }) => {
                acc[endpoint] = data;
                return acc;
            }, {});

            this.toolState.propagation = { loading: false, error: '', data: propagationData, hasData: true };
            return propagationData;
        } catch (error) {
            this.toolState.propagation = {
                loading: false,
                error: error instanceof Error ? error.message : "Propagation check failed",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
     * Look up reverse DNS (PTR) for A records of the domain.
     * Returns a map of IP -> PTR hostname.
     */
    async lookupReverseDns(): Promise<Record<string, string> | null> {
        if (!this.isValid) return null;

        // Ensure we have A records
        if (!this.toolState.dns.hasData) {
            await this.lookupDnsRecordsWithToolState('A');
        }

        const aRecords = this.toolState.dns.data?.A || [];
        if (aRecords.length === 0) return null;

        const results: Record<string, string> = {};

        await Promise.all(
            aRecords.map(async (record) => {
                const ip = record.data;
                if (!ip.match(/^\d+\.\d+\.\d+\.\d+$/)) return;
                const reversed = ip.split('.').reverse().join('.') + '.in-addr.arpa';
                try {
                    const data = await this._queryDns(['PTR'], undefined);
                    // Need to query the reversed domain directly
                    const queryDomain = reversed;
                    const endpoint = queryConfig.endpoint;
                    let dnsEndpointUrl: string;
                    switch (endpoint) {
                        case 'google': dnsEndpointUrl = 'https://dns.google/resolve'; break;
                        case 'dns-sb': dnsEndpointUrl = 'https://doh.dns.sb/dns-query'; break;
                        default: dnsEndpointUrl = 'https://cloudflare-dns.com/dns-query'; break;
                    }
                    const url = new URL(dnsEndpointUrl);
                    url.searchParams.append('name', queryDomain);
                    url.searchParams.append('type', 'PTR');
                    const headers: Record<string, string> = endpoint === 'google' ? {} : { 'Accept': 'application/dns-json' };
                    const response = await fetch(url.toString(), { headers });
                    if (response.ok) {
                        const json = await response.json() as DnsResponse;
                        if (json.Status === 0 && json.Answer) {
                            const ptr = json.Answer.find((a: DnsRecord) => a.type === 12);
                            if (ptr) results[ip] = ptr.data.replace(/\.$/, '');
                        }
                    }
                } catch {
                    // Ignore PTR lookup failures
                }
            })
        );

        return Object.keys(results).length > 0 ? results : null;
    }

    /**
     * Discover subdomains using Certificate Transparency logs
     */
    async lookupSubdomains(): Promise<SubdomainToolResult | null> {
        if (!this.isValid) {
            this.toolState.subdomains = { loading: false, error: "Invalid domain", data: null, hasData: false };
            return null;
        }

        this.toolState.subdomains = { loading: true, error: '', data: null, hasData: false };

        try {
            const apiUrl = `https://crt.sh/?q=%25.${encodeURIComponent(this.name)}&output=json`;
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) throw new Error('CT log query failed');

            const data: Array<{id: string; issuer_name: string; not_before: string; not_after: string; name_value?: string; common_name?: string}> = await response.json();
            const subdomainSet = new Set<string>();
            const certificates: CertificateInfo[] = [];

            for (const cert of data) {
                const names = cert.name_value?.split('\n') || [];
                for (const name of names) {
                    const clean = name.trim().toLowerCase().replace(/^\*\./, '');
                    if (clean && clean !== this.name.toLowerCase() && clean.endsWith(`.${this.name.toLowerCase()}`)) {
                        subdomainSet.add(clean);
                    }
                }
                if (certificates.length < 20) {
                    certificates.push({
                        id: cert.id,
                        issuer: cert.issuer_name,
                        notBefore: cert.not_before,
                        notAfter: cert.not_after,
                        commonName: cert.common_name || '',
                        nameValue: cert.name_value || ''
                    });
                }
            }

            const subdomains = Array.from(subdomainSet).sort();
            const result: SubdomainToolResult = { subdomains, total: subdomains.length, certificates };

            this.toolState.subdomains = { loading: false, error: '', data: result, hasData: true };
            return result;
        } catch (error) {
            const msg = error instanceof Error
                ? (error.name === 'AbortError' ? 'CT log check timed out' :
                   error.message.includes('Failed to fetch') ? 'CT log check blocked (CORS)' :
                   error.message)
                : 'Subdomain discovery failed';
            this.toolState.subdomains = { loading: false, error: msg, data: null, hasData: false };
            return null;
        }
    }

    /**
     * Reset tool state for a specific tool
     */
    resetToolState(tool: 'server' | 'email' | 'rdap' | 'dns' | 'security' | 'forSale' | 'propagation' | 'subdomains') {
        // Use full toolState replacement for Svelte 5 reactivity
        this.toolState[tool] = {
            loading: false,
            error: '',
            data: null,
            hasData: false
        };
    }

    /**
     * Refresh tool data - reset state and fetch fresh data
     */
    async refreshTool(tool: 'server' | 'email' | 'rdap' | 'dns' | 'security' | 'forSale' | 'propagation' | 'subdomains') {
        this.resetToolState(tool);

        switch (tool) {
            case 'server':
                return await this.checkServerInfo();
            case 'email':
                return await this.lookupEmailRecords();
            case 'rdap':
                return await this.lookupRdap();
            case 'dns':
                return await this.lookupDnsRecordsWithToolState();
            case 'security':
                return await this.analyzeSecurityStatus();
            case 'forSale':
                return await this.lookupForSale();
            case 'propagation':
                return await this.lookupPropagation();
            case 'subdomains':
                return await this.lookupSubdomains();
        }
    }

    /**
     * Analyze security status for the domain
     * @returns Security analysis data or null on failure
     */
    async analyzeSecurityStatus(): Promise<SecurityData | null> {
        if (!this.isValid) {
            this.toolState.security = {
                loading: false,
                error: "Invalid domain",
                data: null,
                hasData: false
            };
            return null;
        }

        // Use full toolState replacement for Svelte 5 reactivity
        this.toolState.security = {
            loading: true,
            error: '',
            data: null,
            hasData: false
        };

        try {
            // Add a small delay to ensure the loading state is visible
            await new Promise(resolve => setTimeout(resolve, 100));
            // Ensure we have basic data for analysis (but don't fail if we can't get it)
            try {
                await this.ensureSecurityAnalysisData();
            } catch (error) {
                console.log("Could not gather all data for security analysis, proceeding with available data:", error);
            }

            // Skip HTTP-based SSL and Headers analysis - CORS makes these unreliable for most domains
            // Focus on what we can actually check: SSL (from CAA), Email, and Reputation

            // Check SSL based on CAA records (DNS-based, reliable)
            const sslAnalysis = await this.analyzeSSLFromCAA();

            // Analyze email security (use existing email data)
            const emailSecurityAnalysis = await this.analyzeEmailSecurity();

            // Check domain reputation
            const reputationAnalysis = await this.checkDomainReputation();
            
            // Initialize subdomain discovery as pending - will load async
            const subdomainDiscovery: SubdomainDiscovery = {
                loading: true,
                subdomains: [],
                certificates: [],
                checked: false,
                error: null
            };

            // Calculate overall security score (SSL from CAA, Email, Reputation)
            const overallScore = this.calculateSecurityScoreRevised(
                sslAnalysis,
                emailSecurityAnalysis,
                reputationAnalysis
            );

            const securityData: SecurityData = {
                overall: {
                    score: overallScore.score,
                    grade: overallScore.grade,
                    summary: overallScore.summary
                },
                ssl: sslAnalysis,
                email: emailSecurityAnalysis,
                reputation: reputationAnalysis,
                subdomainDiscovery: subdomainDiscovery,
                recommendations: this.generateSecurityRecommendationsRevised(
                    sslAnalysis,
                    emailSecurityAnalysis,
                    reputationAnalysis
                )
            };

            // Use full toolState replacement for Svelte 5 reactivity
            this.toolState.security = {
                loading: false,
                error: '',
                data: securityData,
                hasData: true
            };

            // Start async subdomain discovery (non-blocking)
            this.loadSubdomainDiscoveryAsync();

            return securityData;
        } catch (error) {
            console.error("Security analysis error:", error);
            // Use full toolState replacement for Svelte 5 reactivity
            this.toolState.security = {
                loading: false,
                error: error instanceof Error ? error.message : "Security analysis failed",
                data: null,
                hasData: false
            };
            return null;
        }
    }

    /**
     * Load subdomain discovery asynchronously without blocking security page
     */
    private async loadSubdomainDiscoveryAsync() {
        try {
            console.log('Starting async subdomain discovery for:', this.name);
            const subdomainData = await this.discoverSubdomainsFromCT();
            console.log('Subdomain discovery complete:', subdomainData);
            
            // Update security data with subdomain discovery results
            if (this.toolState.security.data) {
                // Replace the entire security data object for Svelte 5 reactivity
                this.toolState.security = {
                    ...this.toolState.security,
                    data: {
                        ...this.toolState.security.data,
                        subdomainDiscovery: {
                            ...subdomainData,
                            loading: false
                        }
                    }
                };
            }
        } catch (error) {
            console.error("Subdomain discovery error:", error);
            // Update with error state if security data exists
            if (this.toolState.security.data) {
                this.toolState.security = {
                    ...this.toolState.security,
                    data: {
                        ...this.toolState.security.data,
                        subdomainDiscovery: {
                            loading: false,
                            subdomains: [],
                            certificates: [],
                            checked: false,
                            error: 'Failed to load subdomain discovery'
                        }
                    }
                };
            }
        }
    }

    /**
     * Analyze SSL/TLS based on CAA records (DNS-based, CORS-free)
     */
    private async analyzeSSLFromCAA(): Promise<SSLAnalysis> {
        const dnsData = this.toolState.dns.data;

        if (!dnsData) {
            return {
                enabled: false,
                grade: "C",
                hasCAA: false,
                caaRecords: [],
                issues: ["No DNS data available - cannot check SSL indicators"],
                score: 60, // Neutral score when we can't check
                details: "DNS lookup required to check CAA records"
            };
        }

        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 60; // Base score - neutral
        let hasSSL = false;

        // Check CAA records - strong indicator of SSL/TLS implementation
        const caaRecords = dnsData.CAA || [];
        if (caaRecords.length > 0) {
            hasSSL = true;
            score = 90; // High score - CAA indicates serious SSL implementation
            
            // Analyze CAA records for quality
            const caaValues = caaRecords.map((record: DnsRecordResult) => record.data).join(', ');
            if (caaValues.includes('letsencrypt') || caaValues.includes('digicert') || caaValues.includes('globalsign')) {
                score = 95; // Bonus for reputable CAs
            }
        } else {
            // No CAA doesn't mean no SSL, but we can't verify
            issues.push("No CAA records found");
            recommendations.push("Add CAA records to control which CAs can issue certificates");
            score = 70; // Neutral - many domains have SSL without CAA
        }

        let grade = "F";
        if (score >= 90) grade = "A+";
        else if (score >= 80) grade = "A";
        else if (score >= 70) grade = "B";
        else if (score >= 60) grade = "C";
        else if (score >= 50) grade = "D";

        return {
            enabled: hasSSL,
            grade,
            hasCAA: caaRecords.length > 0,
            caaRecords,
            issues,
            recommendations,
            score,
            details: hasSSL ? "CAA records indicate SSL/TLS certificate management" : "No SSL indicators found in DNS"
        };
    }

    /**
     * Discover subdomains using Certificate Transparency logs
     */
    private async discoverSubdomainsFromCT(): Promise<Omit<SubdomainDiscovery, 'loading'>> {
        const results: Omit<SubdomainDiscovery, 'loading'> = {
            subdomains: [],
            certificates: [],
            checked: false,
            error: null
        };

        try {
            // Use crt.sh API - free Certificate Transparency log search
            const apiUrl = `https://crt.sh/?q=${encodeURIComponent(this.name)}&output=json`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (response.ok) {
                const data: Array<{id: string; issuer_name: string; not_before: string; not_after: string; name_value?: string; common_name?: string}> = await response.json();
                
                // Extract unique subdomains from certificates
                const subdomainSet = new Set<string>();
                const certificates: CertificateInfo[] = [];

                for (const cert of data) {
                    // Parse the name_value field which contains all SANs
                    const names = cert.name_value?.split('\n') || [];

                    for (const name of names) {
                        const cleanName = name.trim().toLowerCase();

                        // Skip wildcards and the root domain
                        if (cleanName && !cleanName.startsWith('*.') && cleanName !== this.name.toLowerCase()) {
                            // Check if it's a subdomain of our domain
                            if (cleanName.endsWith(`.${this.name.toLowerCase()}`)) {
                                subdomainSet.add(cleanName);
                            }
                        }
                    }

                    // Store certificate info
                    certificates.push({
                        id: cert.id,
                        issuer: cert.issuer_name,
                        notBefore: cert.not_before,
                        notAfter: cert.not_after,
                        commonName: cert.common_name || '',
                        nameValue: cert.name_value || ''
                    });
                }
                
                results.subdomains = Array.from(subdomainSet).sort();
                results.certificates = certificates.slice(0, 10); // Limit to 10 most recent
                results.checked = true;
            } else {
                results.error = 'Certificate Transparency API unavailable';
                results.checked = false;
            }
        } catch (error) {
            console.log('CT subdomain discovery failed:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                results.error = 'Certificate Transparency check timed out';
            } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                results.error = 'Certificate Transparency check blocked by browser (CORS policy)';
            } else {
                results.error = 'Certificate Transparency check failed';
            }
            results.checked = false;
        }

        return results;
    }

    /**
     * Check domain reputation using free APIs
     */
    private async checkDomainReputation(): Promise<ReputationAnalysis> {
        const results: ReputationAnalysis = {
            phishtank: { status: 'unknown', checked: false },
            safeBrowsing: { status: 'unknown', checked: false },
            overall: { score: 100, status: 'clean', grade: 'A' }
        };

        try {
            // PhishTank reputation lookup intentionally removed: it POSTed the
            // looked-up URL to a third party (checkurl.phishtank.com), and this
            // whole reputation path is dead code — no route calls it (the live
            // /security page uses the server-side /api/* proxy instead). Leave a
            // neutral result so the surrounding (unused) scoring still builds.
            results.phishtank = { status: 'unknown', checked: false };

            // Simple Google Safe Browsing (fallback check)
            // Note: This is just a basic check - full API requires key
            try {
                // This is a simplified check - we can't actually use the full API without a key
                results.safeBrowsing = { 
                    status: 'clean', 
                    checked: false, 
                    note: 'Requires API key for full check' 
                };
            } catch (error) {
                results.safeBrowsing = { status: 'error', checked: false };
            }

            // Calculate overall reputation score
            let score = 100;
            let status = 'clean';
            let grade = 'A';

            if (results.phishtank.status === 'phishing') {
                score = 0;
                status = 'malicious';
                grade = 'F';
            } else if (results.phishtank.status === 'clean') {
                score = 100;
                status = 'clean';
                grade = 'A';
            } else {
                // Unknown status - neutral score
                score = 70;
                status = 'unknown';
                grade = 'C';
            }

            results.overall = { score, status, grade };

        } catch (error) {
            console.log('Domain reputation check failed:', error);
            results.overall = { score: 70, status: 'unknown', grade: 'C' };
        }

        return results;
    }

    /**
     * Analyze email security
     */
    private async analyzeEmailSecurity(): Promise<EmailSecurityAnalysis> {
        const emailData = this.toolState.email.data;

        if (!emailData) {
            return {
                score: 0,
                grade: "F",
                spf: false,
                dmarc: false,
                mx: false,
                issues: ["No email data available"],
                recommendations: ["Perform email security analysis first"]
            };
        }

        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 0;

        // Check MX records
        const mxRecords = emailData.mx || [];
        if (mxRecords.length > 0) {
            score += 30;
        } else {
            issues.push("No MX records found");
            recommendations.push("Configure MX records if email is needed");
        }

        // Check SPF
        const spfRecords = emailData.spf || [];
        if (spfRecords.length > 0) {
            score += 35;
        } else {
            issues.push("No SPF record found");
            recommendations.push("Add SPF record to prevent email spoofing");
        }

        // Check DMARC
        const dmarcRecords = emailData.dmarc || [];
        if (dmarcRecords.length > 0) {
            score += 35;
            // Check DMARC policy strictness
            if (emailData.dmarcAnalysis?.policy === 'reject') {
                score += 10; // Bonus for strict policy
            }
        } else {
            issues.push("No DMARC record found");
            recommendations.push("Add DMARC record for email authentication");
        }
        
        // Check MTA-STS (secondary security)
        const mtaStsRecords = emailData.mtaSts || [];
        if (mtaStsRecords.length > 0) {
            score += 10;
        } else {
            recommendations.push("Consider adding MTA-STS for enhanced email security");
        }
        
        // Check BIMI (secondary security)
        const bimiRecords = emailData.bimi || [];
        if (bimiRecords.length > 0) {
            score += 5;
        }

        let grade = "F";
        if (score >= 90) grade = "A+";
        else if (score >= 80) grade = "A";
        else if (score >= 70) grade = "B";
        else if (score >= 60) grade = "C";
        else if (score >= 50) grade = "D";

        return {
            score,
            grade,
            spf: spfRecords.length > 0,
            dmarc: dmarcRecords.length > 0,
            mx: mxRecords.length > 0,
            issues,
            recommendations
        };
    }

    /**
     * Calculate revised security score (SSL from CAA + Email + Reputation)
     */
    private calculateSecurityScoreRevised(ssl: SSLAnalysis, email: EmailSecurityAnalysis, reputation: ReputationAnalysis) {
        const weights = {
            reputation: 0.5, // Most important - moved to top priority
            ssl: 0.25,       // SSL indicators from CAA
            email: 0.25      // Email security policies
        };

        const totalScore =
            reputation.overall.score * weights.reputation +
            ssl.score * weights.ssl +
            email.score * weights.email;

        let grade = "F";
        if (totalScore >= 90) grade = "A+";
        else if (totalScore >= 80) grade = "A";
        else if (totalScore >= 70) grade = "B";
        else if (totalScore >= 60) grade = "C";
        else if (totalScore >= 50) grade = "D";

        const summary = this.getSecuritySummary(grade);

        return {
            score: Math.round(totalScore),
            grade,
            summary
        };
    }

    /**
     * Generate revised security recommendations
     */
    private generateSecurityRecommendationsRevised(ssl: SSLAnalysis, email: EmailSecurityAnalysis, reputation: ReputationAnalysis): SecurityRecommendation[] {
        const recommendations: SecurityRecommendation[] = [];

        // Reputation recommendations (highest priority)
        if (reputation.overall.status === 'malicious') {
            recommendations.push({
                category: "Domain Reputation",
                priority: "high",
                title: "Address Security Threats",
                description: "Domain flagged as malicious - immediate action required"
            });
        }

        // SSL recommendations
        if (ssl.score < 80) {
            recommendations.push({
                category: "SSL/TLS",
                priority: "medium",
                title: "Enhance SSL Configuration",
                description: "Add CAA records to control certificate issuance and indicate SSL implementation"
            });
        }

        // Email recommendations
        if (email.score < 70) {
            recommendations.push({
                category: "Email Security",
                priority: "medium",
                title: "Implement Email Security",
                description: "Add SPF, DMARC, and proper MX records"
            });
        }

        return recommendations;
    }

    private getSecuritySummary(grade: string) {
        if (grade === "A+" || grade === "A") {
            return "Excellent security posture with strong protections in place";
        } else if (grade === "B") {
            return "Good security with some room for improvement";
        } else if (grade === "C") {
            return "Moderate security with several areas needing attention";
        } else if (grade === "D") {
            return "Poor security with significant vulnerabilities";
        } else {
            return "Critical security issues requiring immediate attention";
        }
    }

    /**
     * Ensure we have the necessary data for security analysis
     */
    private async ensureSecurityAnalysisData() {
        const timeout = 5000; // 5 second timeout for each operation

        // Try to get server data if we don't have it
        if (!this.toolState.server.hasData && !this.toolState.server.loading) {
            try {
                await Promise.race([
                    this.checkServerInfo(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Server check timeout')), timeout))
                ]);
            } catch (error) {
                console.log("Could not fetch server data for security analysis:", error);
            }
        }

        // Try to get DNS data if we don't have it
        if (!this.toolState.dns.hasData && !this.toolState.dns.loading) {
            try {
                await Promise.race([
                    this.lookupDnsRecordsWithToolState(['A', 'AAAA', 'NS', 'MX', 'TXT', 'CAA', 'HTTPS']),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DNS lookup timeout')), timeout))
                ]);
            } catch (error) {
                console.log("Could not fetch DNS data for security analysis:", error);
            }
        }

        // Try to get email data if we don't have it
        if (!this.toolState.email.hasData && !this.toolState.email.loading) {
            try {
                await Promise.race([
                    this.lookupEmailRecords(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email lookup timeout')), timeout))
                ]);
            } catch (error) {
                console.log("Could not fetch email data for security analysis:", error);
            }
        }
    }
    
    /**
     * Parse SPF record for detailed analysis
     */
    private parseSPFRecord(spfRecord: string): SPFAnalysis {
        // Remove quotes and normalize
        const normalizedSPF = spfRecord.replace(/^"(.+)"$/, '$1');
        
        const mechanisms: string[] = [];
        const modifiers: Record<string, string> = {};
        let policy = 'neutral';
        
        const parts = normalizedSPF.split(/\s+/);
        
        for (const part of parts) {
            if (part === 'v=spf1') continue;
            
            // Check for modifiers (redirect=, exp=)
            if (part.includes('=')) {
                const [key, value] = part.split('=');
                modifiers[key] = value;
            } 
            // Check for qualifier prefixes
            else if (part.match(/^[+\-~?]/)) {
                const qualifier = part[0];
                const mechanism = part.substring(1);
                mechanisms.push(`${qualifier}${mechanism}`);
                
                // Determine policy from all mechanism
                if (mechanism === 'all') {
                    switch (qualifier) {
                        case '-': policy = 'fail'; break;
                        case '~': policy = 'softfail'; break;
                        case '?': policy = 'neutral'; break;
                        case '+': policy = 'pass'; break;
                    }
                }
            }
            // Default qualifier is +
            else {
                mechanisms.push(`+${part}`);
                if (part === 'all') {
                    policy = 'pass';
                }
            }
        }
        
        // Analyze includes for common providers
        const includes = mechanisms.filter(m => m.includes('include:'));
        const providers: string[] = [];
        
        // Extract provider information from includes using exact domain mapping
        const providerMap: Record<string, string> = {
            // Google Workspace
            '_spf.google.com': 'Google Workspace',
            '_netblocks.google.com': 'Google Workspace',
            '_netblocks2.google.com': 'Google Workspace',
            '_netblocks3.google.com': 'Google Workspace',
            
            // Microsoft 365
            'spf.protection.outlook.com': 'Microsoft 365',
            '_spf-ssg-a.microsoft.com': 'Microsoft',
            '_spf-ssg-b.microsoft.com': 'Microsoft',
            
            // Transactional Email Services
            'sendgrid.net': 'SendGrid',
            'u16230978.wl199.sendgrid.net': 'SendGrid',
            'u21441283.wl013.sendgrid.net': 'SendGrid',
            'mailgun.org': 'Mailgun',
            'amazonses.com': 'Amazon SES',
            'spf.mtasv.net': 'Postmark',
            '_spf.sparkpost.com': 'SparkPost',
            'sparkpost.com': 'SparkPost',
            'spf.mandrillapp.com': 'Mandrill',
            'servers.mcsv.net': 'Mailchimp',
            'spf.mailjet.com': 'Mailjet',
            'mailjet.com': 'Mailjet',
            'spf.smtp2go.com': 'SMTP2GO',
            'spf.brevo.com': 'Brevo',
            'spf.sendinblue.com': 'Brevo', // Former name
            'spf.elasticemail.com': 'Elastic Email',
            'spf.socketlabs.com': 'SocketLabs',
            '_spf.mailersend.net': 'MailerSend',
            
            // Email Marketing Platforms
            'ctct1.net': 'Constant Contact',
            'ctct2.net': 'Constant Contact',
            'mktomail.com': 'Marketo',
            'cmail1.com': 'Campaign Monitor',
            'cmail2.com': 'Campaign Monitor',
            'spf.klaviyo.com': 'Klaviyo',
            'mail.klaviyo.com': 'Klaviyo',
            'spf.getresponse.com': 'GetResponse',
            'bluehornet.com': 'Oracle Eloqua',
            'spf.salesforce.com': 'Salesforce',
            'spf.exacttarget.com': 'Salesforce Marketing Cloud',
            
            // CRM/Support Platforms
            'mail.zendesk.com': 'Zendesk',
            'helpscoutemail.com': 'Help Scout',
            'mail.intercom.io': 'Intercom',
            '_spf.freshdesk.com': 'Freshdesk',
            'mail.hubspot.com': 'HubSpot',
            '_spf.hubspot.com': 'HubSpot',
            
            // E-commerce Platforms
            'spf.shopify.com': 'Shopify',
            'shops.shopify.com': 'Shopify',
            'spf.bigcommerce.com': 'BigCommerce',
            'spf.wix.com': 'Wix',
            'mail.squarespace.com': 'Squarespace',
            
            // Other Services
            'zohomail.com': 'Zoho Mail',
            'spf.zoho.com': 'Zoho Mail',
            'spf.protection.office365.us': 'Microsoft 365 GCC',
            'spf.godaddy.com': 'GoDaddy',
            'secureserver.net': 'GoDaddy',
            'ghs.google.com': 'Google Workspace Legacy',
            'aspmx.googlemail.com': 'Google Workspace',
            'bluehost.com': 'Bluehost',
            'spf.dreamhost.com': 'DreamHost',
            'mail.ovh.net': 'OVH',
            'spf.infomaniak.ch': 'Infomaniak'
        };

        includes.forEach(inc => {
            const domain = inc.split(':')[1];
            
            // Check for exact match
            if (providerMap[domain]) {
                const provider = providerMap[domain];
                // Avoid duplicates
                if (!providers.includes(provider)) {
                    providers.push(provider);
                }
            } else {
                // Check for partial matches with common patterns
                // Handle wildcards like u12345.wl123.sendgrid.net
                if (domain.match(/u\d+\.wl\d+\.sendgrid\.net/)) {
                    if (!providers.includes('SendGrid')) {
                        providers.push('SendGrid');
                    }
                }
                // Handle numbered subdomains like spf1.example.com
                else if (domain.match(/spf\d*\./) || domain.match(/_spf\d*\./)) {
                    const baseDomain = domain.replace(/spf\d*\./, 'spf.').replace(/_spf\d*\./, '_spf.');
                    if (providerMap[baseDomain]) {
                        const provider = providerMap[baseDomain];
                        if (!providers.includes(provider)) {
                            providers.push(provider);
                        }
                    }
                }
            }
        });
        
        return {
            mechanisms,
            modifiers,
            policy,
            includes: includes.length,
            providers,
            raw: normalizedSPF
        };
    }
    
    /**
     * Parse DMARC record for detailed analysis
     */
    private parseDMARCRecord(dmarcRecord: string): DMARCAnalysis {
        // Remove quotes and normalize
        const normalizedDMARC = dmarcRecord.replace(/^"(.+)"$/, '$1');
        
        const tags: Record<string, string> = {};
        const parts = normalizedDMARC.split(/;\s*/);
        
        for (const part of parts) {
            if (!part) continue;
            const [key, value] = part.split('=');
            if (key && value) {
                tags[key.trim()] = value.trim();
            }
        }
        
        // Extract key information
        const policy = tags['p'] || 'none';
        const subdomainPolicy = tags['sp'] || policy;
        const percentage = parseInt(tags['pct'] || '100');
        const alignment = {
            dkim: tags['adkim'] || 'r', // r=relaxed, s=strict
            spf: tags['aspf'] || 'r'
        };
        
        // Extract reporting addresses
        const reportingAddresses = {
            aggregate: tags['rua'] ? tags['rua'].split(',').map(a => a.replace('mailto:', '')) : [],
            forensic: tags['ruf'] ? tags['ruf'].split(',').map(a => a.replace('mailto:', '')) : []
        };
        
        // Determine strictness level
        let strictness = 'low';
        if (policy === 'reject') strictness = 'high';
        else if (policy === 'quarantine') strictness = 'medium';
        
        return {
            policy,
            subdomainPolicy,
            percentage,
            alignment,
            reportingAddresses,
            strictness,
            tags,
            raw: normalizedDMARC
        };
    }
}

// Navigation state class
class NavigationState {
    sidebarOpen = $state(false);

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar() {
        this.sidebarOpen = false;
    }
}

export const queryConfig = new QueryConfig();
export const domain = new DomainName();
export const navigationState = new NavigationState();