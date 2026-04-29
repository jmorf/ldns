import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, gcRateLimits } from './ratelimit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    gcRateLimits();
  });
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit then rejects', () => {
    const key = 'test:1.2.3.4';
    for (let i = 0; i < 30; i++) {
      expect(rateLimit(key)).toBe(true);
    }
    expect(rateLimit(key)).toBe(false);
    expect(rateLimit(key)).toBe(false);
  });

  it('resets after the 60s window', () => {
    const key = 'test:1.2.3.4';
    for (let i = 0; i < 30; i++) rateLimit(key);
    expect(rateLimit(key)).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key)).toBe(true);
  });

  it('enforces per-key isolation', () => {
    for (let i = 0; i < 30; i++) rateLimit('a');
    expect(rateLimit('a')).toBe(false);
    expect(rateLimit('b')).toBe(true);
  });

  it('honors a custom limit', () => {
    const limit = { requestsPerMinute: 3 };
    expect(rateLimit('low', limit)).toBe(true);
    expect(rateLimit('low', limit)).toBe(true);
    expect(rateLimit('low', limit)).toBe(true);
    expect(rateLimit('low', limit)).toBe(false);
  });

  it('gcRateLimits drops expired entries', () => {
    rateLimit('expiring');
    vi.advanceTimersByTime(61_000);
    gcRateLimits();
    // After GC + advance, the new request starts a fresh window
    expect(rateLimit('expiring')).toBe(true);
  });
});
