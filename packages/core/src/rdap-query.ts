import type { ParsedRdapData, RdapResponse, RdapEvent, RdapEntity, VCardProperty } from './types';
import { RDAP_BOOTSTRAP_URL } from './constants';
import { getRootDomain } from './domain-parser';

/**
 * Look up RDAP information for a domain
 * @param domain The domain to query
 * @returns Parsed RDAP data or null on failure
 */
export async function queryRdap(domain: string): Promise<ParsedRdapData> {
  // Get the registrable domain (root domain without subdomain)
  const rootDomain = getRootDomain(domain) || domain;

  const bootstrapUrl = `${RDAP_BOOTSTRAP_URL}${rootDomain}`;

  const response = await fetch(bootstrapUrl, {
    headers: {
      'Accept': 'application/rdap+json'
    },
    redirect: 'follow'
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
 * Query domain registration data via RDAP. RDAP is the modern replacement
 * for WHOIS and is supported by every gTLD plus most ccTLDs. The legacy
 * WHOIS protocol runs on port 43 which browsers cannot access, so there is
 * no in-browser fallback that doesn't involve a third-party HTTP proxy.
 */
export async function queryDomainRegistration(domain: string): Promise<ParsedRdapData> {
  return queryRdap(domain);
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

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
