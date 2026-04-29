import { describe, it, expect } from 'vitest';
import { auditSecurityHeaders, detectAltSvc } from './security-checks';

describe('auditSecurityHeaders', () => {
  it('flags missing headers as bad', () => {
    const audit = auditSecurityHeaders({});
    expect(audit.every((c) => c.level === 'bad')).toBe(true);
    expect(audit).toHaveLength(6);
  });

  it('marks short HSTS max-age as warn', () => {
    const audit = auditSecurityHeaders({ 'strict-transport-security': 'max-age=600' });
    const hsts = audit.find((c) => c.key === 'strict-transport-security')!;
    expect(hsts.level).toBe('warn');
  });

  it('accepts HSTS with long max-age', () => {
    const audit = auditSecurityHeaders({
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload'
    });
    const hsts = audit.find((c) => c.key === 'strict-transport-security')!;
    expect(hsts.level).toBe('ok');
  });

  it('treats x-content-type-options without nosniff as warn', () => {
    const audit = auditSecurityHeaders({ 'x-content-type-options': 'something-else' });
    const xcto = audit.find((c) => c.key === 'x-content-type-options')!;
    expect(xcto.level).toBe('warn');
  });
});

describe('detectAltSvc', () => {
  it('detects HTTP/3 from h3 advertisement', () => {
    expect(detectAltSvc({ 'alt-svc': 'h3=":443"; ma=86400' }).http3).toBe(true);
    expect(detectAltSvc({ 'alt-svc': 'h2=":443"' }).http3).toBe(false);
    expect(detectAltSvc({}).http3).toBe(false);
  });
});
