/**
 * SPF DNS-lookup budget evaluation.
 *
 * RFC 7208 §4.6.4 caps an SPF evaluation at **10 DNS-querying terms**:
 * `include`, `a`, `mx`, `ptr`, `exists`, and the `redirect` modifier. Exceed
 * it and a conforming receiver returns `permerror` — which most treat as an
 * SPF failure. This is one of the most common real-world email breakages and
 * it is completely invisible without walking the include tree, because each
 * `include:` can pull in a whole subtree you don't control (and providers
 * change theirs without telling you).
 *
 * Separately, RFC 7208 §4.6.4 limits "void lookups" (terms resolving to
 * NXDOMAIN or no records) to 2 — usually a sign of a stale include.
 *
 * We count terms the way a receiver does, so the number shown matches what
 * would actually happen during evaluation.
 */

import type { DnsEndpoint } from './types';
import { queryDns } from './dns-query';

/** RFC 7208 §4.6.4. */
export const SPF_LOOKUP_LIMIT = 10;
export const SPF_VOID_LOOKUP_LIMIT = 2;

/**
 * Hard ceiling on DNS queries we'll actually issue while exploring. The RFC
 * limit is 10, but a record can reference far more than that — we keep
 * counting past the limit so the user learns how far over they are, while
 * refusing to spider forever on a pathological record.
 */
const MAX_QUERIES = 60;
const MAX_DEPTH = 12;

export interface SpfTreeNode {
  /** The term as written, e.g. `include:_spf.google.com` or `mx`. */
  term: string;
  /** Domain this term resolved against, when applicable. */
  target?: string;
  /** Nested includes/redirects. */
  children: SpfTreeNode[];
  /** True when the lookup returned nothing (counts toward the void limit). */
  void?: boolean;
  /** Set when this node was not explored (budget exhausted / loop). */
  note?: string;
}

export interface SpfEvaluation {
  /** DNS-querying terms counted, per RFC 7208 §4.6.4. */
  lookups: number;
  limit: number;
  /** True when the record would produce a permerror at a conforming receiver. */
  exceeded: boolean;
  voidLookups: number;
  voidLimit: number;
  voidExceeded: boolean;
  /** The include/redirect tree, for display. */
  tree: SpfTreeNode[];
  /** Domains that appeared more than once in their own subtree (SPF loop). */
  loops: string[];
  /** True if we stopped exploring early (record is pathologically large). */
  truncated: boolean;
}

function isLookupTerm(term: string): boolean {
  const t = term.toLowerCase().replace(/^[+\-~?]/, '');
  if (t.startsWith('include:') || t.startsWith('exists:')) return true;
  if (t === 'a' || t.startsWith('a:') || t.startsWith('a/')) return true;
  if (t === 'mx' || t.startsWith('mx:') || t.startsWith('mx/')) return true;
  if (t === 'ptr' || t.startsWith('ptr:')) return true;
  return false;
}

function termTarget(term: string): string | undefined {
  const t = term.replace(/^[+\-~?]/, '');
  const colon = t.indexOf(':');
  if (colon === -1) return undefined;
  return t.slice(colon + 1).split('/')[0].toLowerCase();
}

/** Pull the SPF record out of a domain's TXT records, if present. */
async function fetchSpfRecord(
  domain: string,
  endpoint: DnsEndpoint,
  signal?: AbortSignal
): Promise<string | null> {
  const res = await queryDns(domain, ['TXT'], undefined, endpoint, signal);
  const txt = res.TXT ?? [];
  const spf = txt.find((r) => r.data.trim().toLowerCase().startsWith('v=spf1'));
  return spf ? spf.data.trim() : null;
}

/**
 * Walk a domain's SPF record and count the DNS-querying terms a receiver
 * would evaluate, following `include:` and `redirect=` exactly as one would.
 */
export async function evaluateSpf(
  domain: string,
  endpoint: DnsEndpoint = 'cloudflare',
  signal?: AbortSignal
): Promise<SpfEvaluation> {
  let lookups = 0;
  let voidLookups = 0;
  let queries = 0;
  let truncated = false;
  const loops: string[] = [];

  async function walk(
    record: string,
    depth: number,
    ancestry: string[]
  ): Promise<SpfTreeNode[]> {
    const nodes: SpfTreeNode[] = [];
    // Strip the version token; everything else is a term or modifier.
    const parts = record.split(/\s+/).filter((p) => p && !/^v=spf1$/i.test(p));

    for (const part of parts) {
      const lower = part.toLowerCase();
      const isRedirect = lower.startsWith('redirect=');

      if (!isRedirect && !isLookupTerm(part)) continue;

      // Every one of these costs a lookup, even if we don't explore it.
      lookups++;
      const target = isRedirect ? lower.slice('redirect='.length) : termTarget(part);
      const node: SpfTreeNode = { term: part, target, children: [] };
      nodes.push(node);

      // Only include/redirect pull in another SPF record to recurse into.
      const recursive = isRedirect || lower.replace(/^[+\-~?]/, '').startsWith('include:');
      if (!recursive || !target) continue;

      if (ancestry.includes(target)) {
        node.note = 'loop — already in this chain';
        if (!loops.includes(target)) loops.push(target);
        continue;
      }
      if (depth >= MAX_DEPTH) {
        node.note = 'not explored (nesting too deep)';
        truncated = true;
        continue;
      }
      if (queries >= MAX_QUERIES) {
        node.note = 'not explored (query budget reached)';
        truncated = true;
        continue;
      }

      queries++;
      let child: string | null = null;
      try {
        child = await fetchSpfRecord(target, endpoint, signal);
      } catch {
        node.note = 'lookup failed';
        continue;
      }

      if (!child) {
        // No SPF record at the target: a void lookup.
        node.void = true;
        voidLookups++;
        continue;
      }
      node.children = await walk(child, depth + 1, [...ancestry, target]);
    }

    return nodes;
  }

  const root = await fetchSpfRecord(domain, endpoint, signal);
  const tree = root ? await walk(root, 0, [domain.toLowerCase()]) : [];

  return {
    lookups,
    limit: SPF_LOOKUP_LIMIT,
    exceeded: lookups > SPF_LOOKUP_LIMIT,
    voidLookups,
    voidLimit: SPF_VOID_LOOKUP_LIMIT,
    voidExceeded: voidLookups > SPF_VOID_LOOKUP_LIMIT,
    tree,
    loops,
    truncated
  };
}
