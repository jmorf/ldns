/**
 * ldns-forsale — private Worker holding the domain-marketplace integration.
 *
 * Reachable ONLY through a service binding from the ldns.com site Worker; it
 * declares no routes, so it has no public URL. This buys three things the
 * site Worker can't give us:
 *
 *   1. Least privilege for DYNADOT_API_KEY. The site Worker serves ~12
 *      endpoints and fetches user-supplied hosts; the key lives here instead,
 *      so a problem over there doesn't reach it.
 *   2. A single chokepoint for the daily spend ceiling (see budget.ts). The
 *      paid call happens in exactly one place, behind one counter.
 *   3. The parking-page fetch — which fetches an arbitrary user-supplied host
 *      — is isolated from the site's request path.
 *
 * The public site degrades gracefully when this binding is absent: /api/forsale
 * returns an empty listing set rather than failing, so a fork without this
 * Worker still builds and runs.
 */

import { checkForSale } from './forsale';
export { DynadotBudget } from './budget';

export interface Env {
  DYNADOT_API_KEY?: string;
  DYNADOT_BUDGET: DurableObjectNamespace;
  DYNADOT_DAILY_LIMIT?: string;
}

/**
 * Claim one unit of the daily Dynadot budget.
 * Fails closed — any error means "no budget", so the paid call is skipped and
 * the free signals still run.
 */
async function claimBudget(env: Env): Promise<boolean> {
  try {
    const id = env.DYNADOT_BUDGET.idFromName('dynadot-global');
    const res = await env.DYNADOT_BUDGET.get(id).fetch('https://budget/spend');
    if (!res.ok) return false;
    const body = (await res.json()) as { allowed?: boolean };
    return body.allowed === true;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return Response.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    // The calling site Worker has already validated the domain and run the
    // SSRF guard. We re-check nothing here because this Worker is not
    // publicly reachable — the binding is the trust boundary.
    const useDynadot = Boolean(env.DYNADOT_API_KEY) && (await claimBudget(env));

    const result = await checkForSale(domain.toLowerCase().trim(), {
      dynadotApiKey: useDynadot ? env.DYNADOT_API_KEY : undefined
    });

    return Response.json(result);
  }
};
