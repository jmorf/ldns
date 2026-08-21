import type { ParsedRdapData, RdapResponse, RdapEvent, RdapEntity, VCardProperty } from './types';
import { getRootDomain, toAsciiDomain } from './domain-parser';
import { fetchWithTimeout } from './fetch-utils';
import { getRdapBaseUrl } from './rdap-bootstrap';
import { UpstreamError } from './upstream-errors';

/**
 * Registries answer direct RDAP queries in well under a second (measured:
 * rdap.verisign.com and rdap.registro.br both ~0.6s). The old 30s ceiling
 * existed only to outlast rdap.org's bootstrap stalls; querying registries
 * directly makes 15s comfortably generous again.
 */
const RDAP_TIMEOUT_MS = 15_000;

/**
 * Look up RDAP information for a domain
 * @param domain The domain to query
 * @param signal Optional AbortSignal so callers can cancel in-flight queries
 * @returns Parsed RDAP data or null on failure
 */
export async function queryRdap(domain: string, signal?: AbortSignal): Promise<ParsedRdapData> {
  // Get the registrable domain (root domain without subdomain), punycoded,
  // RDAP servers expect the ASCII form of IDN domains.
  const rootDomain = toAsciiDomain(getRootDomain(domain) || domain);

  // Resolve the registry's own RDAP server from IANA's bootstrap file and
  // query it directly. No rdap.org proxy hop: it added nothing but latency
  // and a second point of failure, since it consults this same file.
  const baseUrl = await getRdapBaseUrl(rootDomain, signal);
  if (!baseUrl) {
    const tld = rootDomain.split('.').pop();
    throw new Error(
      `The .${tld} registry does not provide RDAP, so registration data is not available for this domain. A few country registries (like .de) only offer their own WHOIS.`
    );
  }

  const response = await fetchWithTimeout(`${baseUrl}domain/${rootDomain}`, {
    headers: {
      'Accept': 'application/rdap+json'
    },
    redirect: 'follow',
    signal
  }, RDAP_TIMEOUT_MS);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Domain not found. It may be unregistered, or the registry may not publish RDAP data for it.');
    }
    throw new UpstreamError(`RDAP lookup failed with HTTP ${response.status}`, {
      status: response.status,
      service: 'the domain registry'
    });
  }

  const data = await response.json() as RdapResponse;

  // Extract registrar from entities
  const registrarEntity = (data.entities || []).find((entity: RdapEntity) =>
    entity.roles?.includes('registrar') ||
    entity.roles?.includes('registration')
  );

  let registrarName = null;
  if (registrarEntity) {
    const vcardArray = registrarEntity.vcardArray || ['vcard', []];
    const vcardProps = vcardArray[1] || [];
    registrarName = findVcardValue(vcardProps, 'fn') ||
                   findVcardValue(vcardProps, 'org') ||
                   registrarEntity.handle ||
                   'Unknown Registrar';
  }

  // Parse and format RDAP data
  const parsedData: ParsedRdapData = {
    domainName: data.ldhName || data.handle || rootDomain,
    status: data.status || [],
    events: parseRdapEvents(data.events || []),
    entities: parseRdapEntities(data.entities || []),
    nameservers: (data.nameservers || []).map((ns: { ldhName: string }) => ns.ldhName || ''),
    created: findEventDate(data.events || [], 'registration'),
    updated: findEventDate(data.events || [], 'last changed'),
    expires: findEventDate(data.events || [], 'expiration'),
    registrar: registrarName,
    rdapServer: response.url,
    dnssecEnabled: data.secureDNS?.delegationSigned === true,
    dnssecData: data.secureDNS
  };

  return parsedData;
}

/**
 * Parse RDAP events into a simpler format
 */
function parseRdapEvents(events: RdapEvent[]) {
  return events.map((event: RdapEvent) => ({
    action: event.eventAction || '',
    date: event.eventDate || '',
    actor: event.eventActor || ''
  }));
}

/**
 * Parse RDAP entities into a simpler format
 */
function parseRdapEntities(entities: RdapEntity[]) {
  return entities.map((entity: RdapEntity) => {
    const roles = entity.roles || [];
    const vcardArray = entity.vcardArray || ['vcard', []];
    const vcardProps = vcardArray[1] || [];

    const name = findVcardValue(vcardProps, 'fn');
    const org = findVcardValue(vcardProps, 'org');
    const email = findVcardValue(vcardProps, 'email');
    const tel = findVcardValue(vcardProps, 'tel');
    const country = findVcardValue(vcardProps, 'country-name');

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

/**
 * Find a value in a vCard property array
 */
function findVcardValue(vcardProps: VCardProperty[], propName: string): string {
  const prop = vcardProps.find((p) => p[0] === propName);
  if (!prop) return '';

  const value = prop[3];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || '';
}

/**
 * Find a date for a specific event type
 */
function findEventDate(events: RdapEvent[], eventType: string): string {
  const event = events.find((e: RdapEvent) => e.eventAction === eventType);
  return event ? event.eventDate : '';
}

/**
 * Format a date string for display
 */
export function formatRdapDate(dateString: string): string {
  if (!dateString) return 'N/A';

  // `new Date()` never throws, it yields an Invalid Date. Fall back to the
  // registry's raw string rather than rendering the literal "Invalid Date".
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
