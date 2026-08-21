/**
 * @ldns/core: pure TypeScript runtime-agnostic modules shared by:
 *   - the LDNS browser extension (Chrome + Firefox)
 *   - the LDNS website (SvelteKit on Cloudflare)
 *   - the /api proxy endpoints
 *
 * Every module here uses only `fetch`, `URL`, and standard JS APIs available
 * in browsers, Workers, and Node 18+. No DOM, no chrome.* APIs, no
 * SvelteKit-specifics.
 */

export * from './types';
export * from './constants';
export * from './fetch-utils';
export * from './url';
export * from './upstream-errors';
export * from './ssrf';

export * from './dns-query';
export * from './dns-propagation';
export * from './rdap-query';
export * from './rdap-bootstrap';
export * from './email-query';
export * from './parsers';
export * from './domain-parser';

export * from './server-info';
export * from './security-checks';
export * from './tech-detect';
export * from './tls-query';

export * from './ptr';
export * from './asn-query';
export * from './geo-query';
export * from './zone-file';

export * from './subdomain-query';
export * from './spf-eval';
export * from './dnssec-check';
export * from './caa-check';
export * from './dkim-query';
