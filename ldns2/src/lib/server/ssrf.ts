// Single implementation lives in @ldns/core, shared with the extension.
export {
  isPlausibleDomain,
  isPrivateIPv4,
  isPrivateIPv6,
  ensurePublicHost,
  assertRedirectTarget
} from '@ldns/core/ssrf';
