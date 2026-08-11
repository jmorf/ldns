// Single implementation lives in @ldns/core. The extension popup is a
// privileged context (host permissions + storage), so every remote-derived
// href must go through safeHttpUrl.
export { safeHttpUrl } from '@ldns/core/url';
