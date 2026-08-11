// Single implementation lives in @ldns/core so the site and the extension
// give the same explanation for the same upstream failure.
export {
  classifyUpstreamError,
  UpstreamError,
  type UpstreamFailure,
  type UpstreamFailureReason
} from '@ldns/core/upstream-errors';
