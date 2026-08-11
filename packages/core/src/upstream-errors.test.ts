import { describe, it, expect } from 'vitest';
import { classifyUpstreamError, UpstreamError } from './upstream-errors';

const opts = { service: 'crt.sh' };

describe('classifyUpstreamError', () => {
  it('explains a 502 as the upstream failing, not the user domain', () => {
    // The case that prompted this: "CT log query failed (502)" told the user nothing.
    const r = classifyUpstreamError(new UpstreamError('crt.sh returned HTTP 502', { status: 502 }), opts);
    expect(r.reason).toBe('bad-gateway');
    expect(r.title).toMatch(/gateway error/i);
    expect(r.message).toContain('502');
    expect(r.message).toMatch(/your domain, your DNS and your connection are all fine/i);
    expect(r.retryable).toBe(true);
  });

  it('treats 504 the same as 502', () => {
    const r = classifyUpstreamError(new UpstreamError('x', { status: 504 }), opts);
    expect(r.reason).toBe('bad-gateway');
    expect(r.message).toContain('504');
  });

  it('reads the status out of a plain Error message when there is no status field', () => {
    const r = classifyUpstreamError(new Error('CT log query failed (503)'), opts);
    expect(r.reason).toBe('overloaded');
  });

  it('classifies rate limiting and says it is per-IP', () => {
    const r = classifyUpstreamError(new UpstreamError('x', { status: 429 }), opts);
    expect(r.reason).toBe('rate-limited');
    expect(r.message).toMatch(/IP address/i);
  });

  it('classifies timeouts', () => {
    const r = classifyUpstreamError(new Error('crt.sh request timed out'), opts);
    expect(r.reason).toBe('timeout');
    expect(r.retryable).toBe(true);
  });

  it('detects an offline/blocked-by-client failure', () => {
    const r = classifyUpstreamError(new TypeError('Failed to fetch'), opts);
    expect(r.reason).toBe('offline');
    expect(r.message).toMatch(/never left your machine/i);
  });

  it('treats 403 as not worth retrying', () => {
    const r = classifyUpstreamError(new UpstreamError('x', { status: 403 }), opts);
    expect(r.reason).toBe('blocked');
    expect(r.retryable).toBe(false);
  });

  it('only treats 404 as empty when the caller opts in', () => {
    const asEmpty = classifyUpstreamError(new UpstreamError('x', { status: 404 }), {
      ...opts,
      notFoundIsEmpty: true
    });
    expect(asEmpty.reason).toBe('no-results');
    expect(asEmpty.retryable).toBe(false);

    const asError = classifyUpstreamError(new UpstreamError('x', { status: 404 }), opts);
    expect(asError.reason).not.toBe('no-results');
  });

  it('falls back to a generic 5xx explanation', () => {
    const r = classifyUpstreamError(new UpstreamError('x', { status: 500 }), opts);
    expect(r.reason).toBe('server-error');
    expect(r.message).toContain('500');
  });

  it('keeps the raw message when it cannot classify', () => {
    const r = classifyUpstreamError(new Error('something odd happened'), opts);
    expect(r.reason).toBe('unknown');
    expect(r.message).toBe('something odd happened');
  });

  it('names the service in every heading', () => {
    for (const status of [502, 503, 429, 500]) {
      const r = classifyUpstreamError(new UpstreamError('x', { status }), { service: 'CertSpotter' });
      expect(r.title).toContain('CertSpotter');
    }
  });
});
