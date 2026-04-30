// ─── Raw API Response Types ────────────────────────────────────────

export interface DnsRecord {
  data: string;
  TTL: number;
  type: number;
}

export interface DnsResponse {
  Status: number;
  Answer?: DnsRecord[];
}

export interface RdapEvent {
  eventAction: string;
  eventDate: string;
  eventActor?: string;
}

export interface RdapEntity {
  roles: string[];
  handle?: string;
  vcardArray?: [string, VCardProperty[]];
}

export type VCardProperty = [string, Record<string, unknown>, string, string | string[]];

export interface RdapResponse {
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

/** Generic tool state wrapper */
export interface ToolState<T> {
  loading: boolean;
  error: string;
  data: T | null;
  hasData: boolean;
}

/** DNS endpoint options */
export type DnsEndpoint = 'cloudflare' | 'google' | 'dns-sb';

/** Theme options — `system` follows the user's OS / browser preference */
export type Theme = 'dark' | 'light' | 'system';

/** Message types for background script communication */
export type MessageType =
  | 'DNS_QUERY'
  | 'RDAP_QUERY'
  | 'EMAIL_QUERY'
  | 'GET_CURRENT_TAB_DOMAIN';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface DnsQueryPayload {
  domain: string;
  recordTypes: string[];
  subdomain?: string;
  endpoint?: DnsEndpoint;
}

export interface RdapQueryPayload {
  domain: string;
}

export interface EmailQueryPayload {
  domain: string;
  endpoint?: DnsEndpoint;
}

export interface ExtensionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Recent search entry */
export interface RecentSearch {
  domain: string;
  timestamp: number;
}

/** Server information */
export interface ServerInfo {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  headers: Record<string, string>;
  server: string | null;
  poweredBy: string | null;
  contentType: string | null;
  contentLength: number | null;
  lastModified: string | null;
  cacheControl: string | null;
  age: number | null;
  etag: string | null;
  via: string | null;
  xCache: string | null;
}

/** Redirect hop information */
export interface RedirectHop {
  url: string;
  status: number;
  statusText: string;
  location: string;
  responseTime: number;
  server: string | null;
}

/** Redirect trace result */
export interface RedirectTrace {
  originalUrl: string;
  finalUrl: string;
  hops: RedirectHop[];
  totalTime: number;
  redirectCount: number;
  finalStatus: number;
  finalStatusText: string;
}

/** Server analysis result */
export interface ServerAnalysis {
  info: ServerInfo | null;
  redirects: RedirectTrace | null;
  error: string | null;
}

/** For-sale marketplace listing */
export interface ForSaleListing {
  marketplace: 'afternic' | 'dynadot' | 'parking';
  /**
   * Specific platform name when marketplace='parking' — e.g. "GoDaddy
   * CashParking", "HugeDomains", "Sedo", "Dan", "ParkingCrew". Optional
   * because Afternic / Dynadot listings don't use it.
   */
  platform?: string;
  domain: string;
  forSale: boolean;
  price?: number;
  currency?: string;
  buyNowAvailable?: boolean;
  listingUrl: string;
}

/** Technology detection from headers */
export interface TechDetection {
  name: string;
  category: 'cdn' | 'server' | 'framework' | 'platform' | 'hosting';
}

/** DNS propagation result — per-provider DNS results */
export type PropagationResult = Record<DnsEndpoint, DnsData>;

/** Subdomain discovery result from CT logs */
export interface SubdomainResult {
  subdomains: string[];
  total: number;
  certificates: CertInfo[];
}

/** Certificate info from CT logs */
export interface CertInfo {
  id: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  commonName: string;
}

/** For-sale check result */
export interface ForSaleResult {
  domain: string;
  listings: ForSaleListing[];
  checkedAt: string;
}

/** User-configurable settings */
export interface Settings {
  forSaleEnabled: boolean;
  funMessages: boolean;
  grain: boolean;
  sidePanelMode: boolean;
}

/** A discovered DKIM selector */
export interface DkimSelector {
  selector: string;
  found: boolean;
  raw: string;
  algorithm: string;
  keyLength: number;
  policy: string;
}

/** DKIM probe results */
export interface DkimResult {
  selectors: DkimSelector[];
  found: number;
  probed: number;
}

/** ASN / origin info for a single IP */
export interface AsnInfo {
  ip: string;
  asn: number | null;
  asName: string | null;
  country: string | null;
  prefix: string | null;
}

/** Per-provider DNS latency sample */
export interface ProviderLatency {
  endpoint: DnsEndpoint;
  ms: number | null;
}
