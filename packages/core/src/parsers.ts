import type { SPFAnalysis, DMARCAnalysis } from './types';
import { SPF_PROVIDER_MAP } from './constants';

/**
 * Parse SPF record for detailed analysis
 */
export function parseSPFRecord(spfRecord: string): SPFAnalysis {
  // Remove quotes and normalize
  const normalizedSPF = spfRecord.replace(/^"(.+)"$/, '$1');

  const mechanisms: string[] = [];
  const modifiers: Record<string, string> = {};
  let policy = 'neutral';

  const parts = normalizedSPF.split(/\s+/);

  for (const part of parts) {
    if (part === 'v=spf1') continue;

    // Check for modifiers (redirect=, exp=)
    if (part.includes('=')) {
      // Split on the first '=' only — values may themselves contain '='.
      const eq = part.indexOf('=');
      modifiers[part.slice(0, eq)] = part.slice(eq + 1);
    }
    // Check for qualifier prefixes
    else if (part.match(/^[+\-~?]/)) {
      const qualifier = part[0];
      const mechanism = part.substring(1);
      mechanisms.push(`${qualifier}${mechanism}`);

      // Determine policy from all mechanism
      if (mechanism === 'all') {
        switch (qualifier) {
          case '-': policy = 'fail'; break;
          case '~': policy = 'softfail'; break;
          case '?': policy = 'neutral'; break;
          case '+': policy = 'pass'; break;
        }
      }
    }
    // Default qualifier is +
    else {
      mechanisms.push(`+${part}`);
      if (part === 'all') {
        policy = 'pass';
      }
    }
  }

  // Analyze includes for common providers
  const includes = mechanisms.filter(m => m.includes('include:'));
  const providers: string[] = [];

  includes.forEach(inc => {
    const domain = inc.split(':')[1];

    // Check for exact match
    if (SPF_PROVIDER_MAP[domain]) {
      const provider = SPF_PROVIDER_MAP[domain];
      if (!providers.includes(provider)) {
        providers.push(provider);
      }
    } else {
      // Handle wildcards like u12345.wl123.sendgrid.net
      if (domain && domain.match(/u\d+\.wl\d+\.sendgrid\.net/)) {
        if (!providers.includes('SendGrid')) {
          providers.push('SendGrid');
        }
      }
      // Handle numbered subdomains like spf1.example.com
      else if (domain && (domain.match(/spf\d*\./) || domain.match(/_spf\d*\./))) {
        const baseDomain = domain.replace(/spf\d*\./, 'spf.').replace(/_spf\d*\./, '_spf.');
        if (SPF_PROVIDER_MAP[baseDomain]) {
          const provider = SPF_PROVIDER_MAP[baseDomain];
          if (!providers.includes(provider)) {
            providers.push(provider);
          }
        }
      }
    }
  });

  return {
    mechanisms,
    modifiers,
    policy,
    includes: includes.length,
    providers,
    raw: normalizedSPF
  };
}

/**
 * Parse DMARC record for detailed analysis
 */
export function parseDMARCRecord(dmarcRecord: string): DMARCAnalysis {
  // Remove quotes and normalize
  const normalizedDMARC = dmarcRecord.replace(/^"(.+)"$/, '$1');

  const tags: Record<string, string> = {};
  const parts = normalizedDMARC.split(/;\s*/);

  for (const part of parts) {
    if (!part) continue;
    // Split on the first '=' only (rua/ruf URIs contain '='), and lowercase
    // the tag name — RFC 7489 tag names are case-insensitive.
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();
    if (key && value) {
      tags[key] = value;
    }
  }

  // Extract key information
  const policy = (tags['p'] || 'none').toLowerCase();
  const subdomainPolicy = (tags['sp'] || policy).toLowerCase();
  const parsedPct = parseInt(tags['pct'] ?? '100', 10);
  const percentage = Number.isFinite(parsedPct) ? parsedPct : 100;
  const alignment = {
    dkim: tags['adkim'] || 'r', // r=relaxed, s=strict
    spf: tags['aspf'] || 'r'
  };

  // Extract reporting addresses
  const reportingAddresses = {
    aggregate: tags['rua'] ? tags['rua'].split(',').map(a => a.replace('mailto:', '')) : [],
    forensic: tags['ruf'] ? tags['ruf'].split(',').map(a => a.replace('mailto:', '')) : []
  };

  // Determine strictness level
  let strictness = 'low';
  if (policy === 'reject') strictness = 'high';
  else if (policy === 'quarantine') strictness = 'medium';

  return {
    policy,
    subdomainPolicy,
    percentage,
    alignment,
    reportingAddresses,
    strictness,
    tags,
    raw: normalizedDMARC
  };
}

/**
 * Get a human-readable description of an SPF policy
 */
export function getSPFPolicyDescription(policy: string): string {
  switch (policy) {
    case 'fail':
      return 'Reject emails from unauthorized senders';
    case 'softfail':
      return 'Mark emails from unauthorized senders as suspicious';
    case 'neutral':
      return 'No assertion about unauthorized senders';
    case 'pass':
      return 'Allow all senders (not recommended)';
    default:
      return 'Unknown policy';
  }
}

/**
 * Get a human-readable description of a DMARC policy
 */
export function getDMARCPolicyDescription(policy: string): string {
  switch (policy) {
    case 'reject':
      return 'Reject emails that fail authentication';
    case 'quarantine':
      return 'Quarantine emails that fail authentication';
    case 'none':
      return 'Monitor only - no action on failures';
    default:
      return 'Unknown policy';
  }
}

/**
 * Get the policy strictness color for UI display
 */
export function getPolicyColor(policy: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (policy) {
    case 'reject':
    case 'fail':
      return 'green';
    case 'quarantine':
    case 'softfail':
      return 'yellow';
    case 'none':
    case 'neutral':
    case 'pass':
      return 'red';
    default:
      return 'gray';
  }
}
