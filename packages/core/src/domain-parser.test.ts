import { describe, it, expect } from 'vitest';
import {
  parseDomain,
  getRootDomain,
  isValidDomain,
  toAsciiDomain,
  extractDomainFromUrl
} from './domain-parser';

describe('parseDomain', () => {
  it('should parse a simple domain', () => {
    const result = parseDomain('example.com');
    expect(result.isValid).toBe(true);
    expect(result.tld).toBe('com');
    expect(result.sld).toBe('example');
    expect(result.subdomain).toBe('');
    expect(result.rootDomain).toBe('example.com');
  });

  it('should parse a domain with subdomain', () => {
    const result = parseDomain('www.example.com');
    expect(result.isValid).toBe(true);
    expect(result.tld).toBe('com');
    expect(result.sld).toBe('example');
    expect(result.subdomain).toBe('www');
    expect(result.rootDomain).toBe('example.com');
  });

  it('should parse a domain with multiple subdomains', () => {
    const result = parseDomain('api.v2.example.com');
    expect(result.isValid).toBe(true);
    expect(result.subdomain).toBe('api.v2');
    expect(result.rootDomain).toBe('example.com');
  });

  it('should handle co.uk TLD correctly', () => {
    const result = parseDomain('example.co.uk');
    expect(result.isValid).toBe(true);
    expect(result.tld).toBe('co.uk');
    expect(result.sld).toBe('example');
    expect(result.rootDomain).toBe('example.co.uk');
  });

  it('should handle www.example.co.uk correctly', () => {
    const result = parseDomain('www.example.co.uk');
    expect(result.isValid).toBe(true);
    expect(result.subdomain).toBe('www');
    expect(result.rootDomain).toBe('example.co.uk');
  });

  it('should return invalid for empty string', () => {
    const result = parseDomain('');
    expect(result.isValid).toBe(false);
  });

  it('should return invalid for invalid domain', () => {
    const result = parseDomain('not-a-domain');
    expect(result.isValid).toBe(false);
  });

  it('should normalize uppercase domains', () => {
    const result = parseDomain('EXAMPLE.COM');
    expect(result.isValid).toBe(true);
    expect(result.rootDomain).toBe('example.com');
  });
});

describe('toAsciiDomain', () => {
  it('should punycode IDN domains', () => {
    expect(toAsciiDomain('münchen.de')).toBe('xn--mnchen-3ya.de');
    expect(toAsciiDomain('日本.jp')).toBe('xn--wgv71a.jp');
  });

  it('should leave ASCII domains unchanged', () => {
    expect(toAsciiDomain('example.com')).toBe('example.com');
  });

  it('should handle underscore labels', () => {
    expect(toAsciiDomain('_dmarc.münchen.de')).toBe('_dmarc.xn--mnchen-3ya.de');
  });
});

describe('getRootDomain', () => {
  it('should return root domain', () => {
    expect(getRootDomain('www.example.com')).toBe('example.com');
    expect(getRootDomain('api.example.co.uk')).toBe('example.co.uk');
    expect(getRootDomain('example.com')).toBe('example.com');
  });
});

describe('isValidDomain', () => {
  it('should return true for valid domains', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('www.google.com')).toBe(true);
    expect(isValidDomain('sub.domain.co.uk')).toBe(true);
  });

  it('should return false for invalid domains', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('invalid')).toBe(false);
    expect(isValidDomain('.com')).toBe(false);
  });
});

describe('extractDomainFromUrl', () => {
  it('should extract domain from HTTPS URL', () => {
    expect(extractDomainFromUrl('https://example.com/path')).toBe('example.com');
    expect(extractDomainFromUrl('https://www.google.com/search?q=test')).toBe('www.google.com');
  });

  it('should extract domain from HTTP URL', () => {
    expect(extractDomainFromUrl('http://example.com')).toBe('example.com');
  });

  it('should handle URL without protocol', () => {
    expect(extractDomainFromUrl('example.com/path')).toBe('example.com');
    expect(extractDomainFromUrl('www.example.com')).toBe('www.example.com');
  });

  it('should handle scheme-less host with port or query', () => {
    expect(extractDomainFromUrl('example.com:8080')).toBe('example.com');
    expect(extractDomainFromUrl('example.com?utm=x')).toBe('example.com');
  });

  it('should handle invalid URLs gracefully', () => {
    expect(extractDomainFromUrl('')).toBe('');
  });

  it('should extract domain from URL with query parameters', () => {
    expect(extractDomainFromUrl('http://example.com?query=1')).toBe('example.com');
    expect(extractDomainFromUrl('https://www.logo.com/some-route?some_param=true')).toBe('www.logo.com');
  });

  it('should extract domain from URL with path and query', () => {
    expect(extractDomainFromUrl('https://api.example.com/v1/users?id=123')).toBe('api.example.com');
  });

  it('should handle URL with port', () => {
    expect(extractDomainFromUrl('https://example.com:8080/path')).toBe('example.com');
  });
});
