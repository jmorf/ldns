/**
 * Maps a thrown upstream error (typically from crt.sh, but applicable to any
 * external service) into a structured failure shape that endpoints can return
 * as `ok: false` instead of letting the throw turn into a generic 500.
 *
 * Reasons are stable code strings the frontend uses to render the right
 * icon + heading; messages are user-readable explanations.
 */

export type UpstreamFailureReason =
  | 'timeout'
  | 'overloaded'
  | 'rate-limited'
  | 'bad-gateway'
  | 'no-results'
  | 'unknown';

export interface UpstreamFailure {
  reason: UpstreamFailureReason;
  message: string;
}

interface ClassifyOptions {
  /** Human label for the upstream service used in default messages. */
  service: string;
  /**
   * Optional treatment for HTTP 404. Some services use 404 for "domain has
   * no records logged" (legitimate empty result, not really an error), which
   * is best surfaced with a no-results explanation instead of a scary error.
   */
  notFoundIsEmpty?: boolean;
}

export function classifyUpstreamError(
  err: unknown,
  { service, notFoundIsEmpty = false }: ClassifyOptions
): UpstreamFailure {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return {
      reason: 'timeout',
      message: `${service} did not respond in time. This is usually a transient overload — try again in a few minutes. Successful responses are edge-cached for 24 hours so subsequent visits will be instant.`
    };
  }

  if (lower.includes('overloaded') || raw.includes('503')) {
    return {
      reason: 'overloaded',
      message: `${service} is temporarily overloaded by other queries. Try again in a few minutes — the result will be edge-cached for 24 hours once it succeeds.`
    };
  }

  if (raw.includes('502') || raw.includes('504')) {
    return {
      reason: 'bad-gateway',
      message: `${service} returned a gateway error. This is a transient issue with the upstream service, not your domain. Try again shortly.`
    };
  }

  if (raw.includes('429')) {
    return {
      reason: 'rate-limited',
      message: `${service} rate-limited the request. Wait a minute and try again.`
    };
  }

  if (notFoundIsEmpty && raw.includes('404')) {
    return {
      reason: 'no-results',
      message: `${service} has no records for this domain. Either it has never been logged there, or this is a very new domain. Try one of the other tools.`
    };
  }

  return {
    reason: 'unknown',
    message: `${service} request failed: ${raw}`
  };
}
