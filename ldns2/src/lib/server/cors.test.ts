import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, corsHeaders } from './cors';

describe('isAllowedOrigin', () => {
  it.each([
    ['https://ldns.com', true],
    ['https://www.ldns.com', true],
    ['http://localhost:5173', true],
    ['http://localhost:4173', true],
    ['https://attacker.com', false],
    ['http://ldns.com', false], // http (not https) for the production host
    ['', false],
    [null, false],
    ['chrome-extension://ehgkpjkmaichihneengcigkaoejmcofn', true], // published Chrome ID
    ['chrome-extension://caoebmdbbigeealihbnpofijebnoajpm', true], // dev Chrome ID
    ['chrome-extension://abcd', false],
    ['moz-extension://abcd-1234', true] // any Firefox UUID until we lock down
  ])('isAllowedOrigin(%j) = %s', (origin, expected) => {
    expect(isAllowedOrigin(origin)).toBe(expected);
  });
});

describe('corsHeaders', () => {
  it('echoes back an allowed origin', () => {
    const h = corsHeaders('https://ldns.com');
    expect(h['Access-Control-Allow-Origin']).toBe('https://ldns.com');
    expect(h['Vary']).toBe('Origin');
  });

  it('falls back to ldns.com for disallowed origin', () => {
    const h = corsHeaders('https://evil.com');
    expect(h['Access-Control-Allow-Origin']).toBe('https://ldns.com');
  });

  it('includes correct method/header allow-list', () => {
    const h = corsHeaders('https://ldns.com');
    expect(h['Access-Control-Allow-Methods']).toContain('GET');
    expect(h['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(h['Access-Control-Allow-Headers']).toContain('Content-Type');
  });
});
