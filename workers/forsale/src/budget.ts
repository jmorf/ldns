/**
 * Daily spend ceiling for the Dynadot marketplace API, as a Durable Object.
 *
 * Why a Durable Object and not the site's in-memory limiter: that limiter is
 * per-isolate, so Cloudflare's request spreading makes its real ceiling a large
 * unknown multiple of the configured value. A DO is a single addressable
 * instance with strongly-consistent storage, so `spend()` is a genuine global
 * counter — which is what a *budget* has to be. Per-IP limits don't help here
 * either: the cost is per-call, and a distributed caller rotates IPs freely.
 *
 * Fails CLOSED: if the counter can't be read, the caller skips the paid API.
 */

export interface BudgetState {
  day: string;
  count: number;
  limit: number;
}

/** UTC day key. Budgets reset at 00:00 UTC. */
function today(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export class DynadotBudget {
  private state: DurableObjectState;
  private limit: number;

  constructor(state: DurableObjectState, env: { DYNADOT_DAILY_LIMIT?: string }) {
    this.state = state;
    this.limit = Number(env.DYNADOT_DAILY_LIMIT ?? '500');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const stored = (await this.state.storage.get<BudgetState>('budget')) ?? {
      day: today(Date.now()),
      count: 0,
      limit: this.limit
    };

    // Roll over at the UTC day boundary.
    const day = today(Date.now());
    if (stored.day !== day) {
      stored.day = day;
      stored.count = 0;
    }
    stored.limit = this.limit;

    if (url.pathname === '/status') {
      return Response.json(stored);
    }

    // /spend — atomically claim one unit if the budget allows it.
    if (stored.count >= this.limit) {
      await this.state.storage.put('budget', stored);
      return Response.json({ allowed: false, ...stored }, { status: 429 });
    }

    stored.count++;
    await this.state.storage.put('budget', stored);
    return Response.json({ allowed: true, ...stored });
  }
}
