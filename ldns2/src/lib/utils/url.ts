// Single implementation lives in @ldns/core so the site and the extension
// can't drift on a security-critical function.
export { safeHttpUrl } from '@ldns/core/url';
