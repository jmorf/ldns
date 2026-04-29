import { describe, it, expect } from 'vitest';
import {
  parseSPFRecord,
  parseDMARCRecord,
  getSPFPolicyDescription,
  getDMARCPolicyDescription,
  getPolicyColor
} from './parsers';

describe('parseSPFRecord', () => {
  it('should parse basic SPF record with fail policy', () => {
    const result = parseSPFRecord('v=spf1 include:_spf.google.com -all');
    expect(result.policy).toBe('fail');
    expect(result.includes).toBe(1);
    expect(result.providers).toContain('Google Workspace');
    expect(result.mechanisms).toContain('+include:_spf.google.com');
    expect(result.mechanisms).toContain('-all');
  });

  it('should parse SPF record with softfail policy', () => {
    const result = parseSPFRecord('v=spf1 include:spf.protection.outlook.com ~all');
    expect(result.policy).toBe('softfail');
    expect(result.providers).toContain('Microsoft 365');
  });

  it('should parse SPF record with neutral policy', () => {
    const result = parseSPFRecord('v=spf1 ?all');
    expect(result.policy).toBe('neutral');
  });

  it('should parse SPF record with multiple includes', () => {
    const result = parseSPFRecord('v=spf1 include:_spf.google.com include:sendgrid.net -all');
    expect(result.includes).toBe(2);
    expect(result.providers).toContain('Google Workspace');
    expect(result.providers).toContain('SendGrid');
  });

  it('should parse SPF modifiers', () => {
    const result = parseSPFRecord('v=spf1 redirect=_spf.example.com');
    expect(result.modifiers['redirect']).toBe('_spf.example.com');
  });

  it('should handle quoted SPF records', () => {
    const result = parseSPFRecord('"v=spf1 include:_spf.google.com -all"');
    expect(result.policy).toBe('fail');
    expect(result.providers).toContain('Google Workspace');
  });

  it('should detect SendGrid wildcard patterns', () => {
    const result = parseSPFRecord('v=spf1 include:u12345.wl123.sendgrid.net -all');
    expect(result.providers).toContain('SendGrid');
  });

  it('should return raw SPF record', () => {
    const spf = 'v=spf1 -all';
    const result = parseSPFRecord(spf);
    expect(result.raw).toBe(spf);
  });
});

describe('parseDMARCRecord', () => {
  it('should parse basic DMARC record with reject policy', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; rua=mailto:dmarc@example.com');
    expect(result.policy).toBe('reject');
    expect(result.strictness).toBe('high');
    expect(result.reportingAddresses.aggregate).toContain('dmarc@example.com');
  });

  it('should parse DMARC record with quarantine policy', () => {
    const result = parseDMARCRecord('v=DMARC1; p=quarantine');
    expect(result.policy).toBe('quarantine');
    expect(result.strictness).toBe('medium');
  });

  it('should parse DMARC record with none policy', () => {
    const result = parseDMARCRecord('v=DMARC1; p=none');
    expect(result.policy).toBe('none');
    expect(result.strictness).toBe('low');
  });

  it('should parse subdomain policy', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; sp=quarantine');
    expect(result.policy).toBe('reject');
    expect(result.subdomainPolicy).toBe('quarantine');
  });

  it('should default subdomain policy to main policy', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject');
    expect(result.subdomainPolicy).toBe('reject');
  });

  it('should parse percentage', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; pct=50');
    expect(result.percentage).toBe(50);
  });

  it('should default percentage to 100', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject');
    expect(result.percentage).toBe(100);
  });

  it('should parse alignment settings', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; adkim=s; aspf=s');
    expect(result.alignment.dkim).toBe('s');
    expect(result.alignment.spf).toBe('s');
  });

  it('should default alignment to relaxed', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject');
    expect(result.alignment.dkim).toBe('r');
    expect(result.alignment.spf).toBe('r');
  });

  it('should parse multiple reporting addresses', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; rua=mailto:a@example.com,mailto:b@example.com; ruf=mailto:forensic@example.com');
    expect(result.reportingAddresses.aggregate).toHaveLength(2);
    expect(result.reportingAddresses.aggregate).toContain('a@example.com');
    expect(result.reportingAddresses.aggregate).toContain('b@example.com');
    expect(result.reportingAddresses.forensic).toContain('forensic@example.com');
  });

  it('should handle quoted DMARC records', () => {
    const result = parseDMARCRecord('"v=DMARC1; p=reject"');
    expect(result.policy).toBe('reject');
  });

  it('should store all tags', () => {
    const result = parseDMARCRecord('v=DMARC1; p=reject; fo=1');
    expect(result.tags['p']).toBe('reject');
    expect(result.tags['fo']).toBe('1');
  });

  it('should return raw DMARC record', () => {
    const dmarc = 'v=DMARC1; p=reject';
    const result = parseDMARCRecord(dmarc);
    expect(result.raw).toBe(dmarc);
  });
});

describe('getSPFPolicyDescription', () => {
  it('should return correct descriptions', () => {
    expect(getSPFPolicyDescription('fail')).toContain('Reject');
    expect(getSPFPolicyDescription('softfail')).toContain('suspicious');
    expect(getSPFPolicyDescription('neutral')).toContain('No assertion');
    expect(getSPFPolicyDescription('pass')).toContain('Allow all');
    expect(getSPFPolicyDescription('unknown')).toContain('Unknown');
  });
});

describe('getDMARCPolicyDescription', () => {
  it('should return correct descriptions', () => {
    expect(getDMARCPolicyDescription('reject')).toContain('Reject');
    expect(getDMARCPolicyDescription('quarantine')).toContain('Quarantine');
    expect(getDMARCPolicyDescription('none')).toContain('Monitor');
    expect(getDMARCPolicyDescription('unknown')).toContain('Unknown');
  });
});

describe('getPolicyColor', () => {
  it('should return green for strict policies', () => {
    expect(getPolicyColor('reject')).toBe('green');
    expect(getPolicyColor('fail')).toBe('green');
  });

  it('should return yellow for moderate policies', () => {
    expect(getPolicyColor('quarantine')).toBe('yellow');
    expect(getPolicyColor('softfail')).toBe('yellow');
  });

  it('should return red for weak policies', () => {
    expect(getPolicyColor('none')).toBe('red');
    expect(getPolicyColor('neutral')).toBe('red');
    expect(getPolicyColor('pass')).toBe('red');
  });

  it('should return gray for unknown policies', () => {
    expect(getPolicyColor('unknown')).toBe('gray');
  });
});
