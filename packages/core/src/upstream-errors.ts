/**
 * Turns a thrown upstream error into something a person can act on.
 *
 * The default failure text for these lookups used to be the raw status, e.g.
 * "CT log query failed (502)". That tells a user nothing: they cannot tell
 * whether their domain is broken, their network is broken, or a third-party
 * service they have never heard of is having a bad afternoon. Almost always
 * it is the third, so every classification here answers three questions:
 *
 *   1. What happened, in plain words.
 *   2. Whose fault it is, and specifically whether their domain is fine.
 *   3. What to do next.
 *
 * Shared by the site (as `ok: false` API payloads) and the extension (rendered
 * directly), so the wording stays consistent between them.
 */

export type UpstreamFailureReason =
  | 'timeout'
  | 'overloaded'
  | 'rate-limited'
  | 'bad-gateway'
  | 'server-error'
  | 'blocked'
  | 'offline'
  | 'no-results'
  | 'unknown';

export interface UpstreamFailure {
  reason: UpstreamFailureReason;
  /** Short heading, e.g. "crt.sh is overloaded". */
  title: string;
  /** Full explanation, including what the status code means. */
  message: string;
  /** Optional extra line: what this does NOT affect, or what to try instead. */
  hint?: string;
  /** Whether retrying soon is likely to help. */
  retryable: boolean;
}

interface ClassifyOptions {
  /** Human label for the upstream service, e.g. "crt.sh". */
  service: string;
  /**
   * Some services use 404 for "nothing logged for this domain", which is a
   * legitimate empty result rather than an error.
   */
  notFoundIsEmpty?: boolean;
  /**
   * Appended to explanations where useful, e.g. to mention edge caching on
   * the site. The extension has no cache to mention, so it omits this.
   */
  cacheNote?: string;
}

/** An error that carries the HTTP status, so classification isn't string-matching. */
export class UpstreamError extends Error {
  status?: number;
  service?: string;

  constructor(message: string, options: { status?: number; service?: string } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = options.status;
    this.service = options.service;
  }
}

function statusOf(err: unknown, raw: string): number | undefined {
  if (err instanceof UpstreamError && err.status) return err.status;
  // Fall back to a status embedded in the message, e.g. "failed (502)".
  const m = raw.match(/\b(4\d\d|5\d\d)\b/);
  return m ? Number(m[1]) : undefined;
}

export function classifyUpstreamError(
  err: unknown,
  { service, notFoundIsEmpty = false, cacheNote = '' }: ClassifyOptions
): UpstreamFailure {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  const status = statusOf(err, raw);
  const tail = cacheNote ? ` ${cacheNote}` : '';

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return {
      reason: 'offline',
      title: 'Could not reach the network',
      message: `The request to ${service} never left your machine. That usually means you are offline, or a firewall, VPN or content blocker is blocking it.`,
      hint: 'Check your connection and try again.',
      retryable: true
    };
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return {
      reason: 'timeout',
      title: `${service} did not respond in time`,
      message: `${service} accepted the request but never finished answering it. It is a free public service and gets slow under load, so this is almost always a busy-server problem rather than anything wrong with your domain.`,
      hint: `Waiting a minute and retrying usually works.${tail}`,
      retryable: true
    };
  }

  if (status === 502 || status === 504) {
    return {
      reason: 'bad-gateway',
      title: `${service} returned a gateway error`,
      message: `HTTP ${status} means ${service}'s front-end server could not get an answer from its own back-end. The failure is entirely inside ${service}: your domain, your DNS and your connection are all fine.`,
      hint: `These clear on their own, usually within a few minutes.${tail}`,
      retryable: true
    };
  }

  if (status === 503 || lower.includes('overloaded')) {
    return {
      reason: 'overloaded',
      title: `${service} is overloaded`,
      message: `HTTP 503 means ${service} is refusing new work because it is already saturated with queries from other people. Nothing is wrong with your domain.`,
      hint: `Try again in a few minutes.${tail}`,
      retryable: true
    };
  }

  if (status === 429) {
    return {
      reason: 'rate-limited',
      title: `${service} rate-limited the request`,
      message: `HTTP 429 means too many requests have come from your IP address recently. ${service} caps how often a single client can query it.`,
      hint: 'Wait a minute before trying again.',
      retryable: true
    };
  }

  if (status === 403 || status === 401) {
    return {
      reason: 'blocked',
      title: `${service} refused the request`,
      message: `HTTP ${status} means ${service} rejected the request outright. This can happen behind some VPNs and corporate proxies, or if the service has started requiring authentication.`,
      hint: 'Retrying on a different network may help.',
      retryable: false
    };
  }

  if (notFoundIsEmpty && status === 404) {
    return {
      reason: 'no-results',
      title: `Nothing logged at ${service}`,
      message: `${service} has no records for this domain. Either nothing has ever been logged for it, or the domain is very new.`,
      hint: 'This is not an error; there is simply nothing to show.',
      retryable: false
    };
  }

  if (status && status >= 500) {
    return {
      reason: 'server-error',
      title: `${service} hit an internal error`,
      message: `HTTP ${status} is a fault inside ${service} itself, not a problem with your domain or your request.`,
      hint: `Try again shortly.${tail}`,
      retryable: true
    };
  }

  return {
    reason: 'unknown',
    title: `${service} request failed`,
    message: raw,
    hint: 'Retrying may help. If it keeps happening, the service is probably down.',
    retryable: true
  };
}
