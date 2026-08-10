// Single implementation lives in @ldns/core so the site and the private
// forsale Worker can't drift on security-critical guard logic.
export {
  isPlausibleDomain,
  isPrivateIPv4,
  isPrivateIPv6,
  ensurePublicHost,
  assertRedirectTarget
} from '@ldns/core/ssrf';
