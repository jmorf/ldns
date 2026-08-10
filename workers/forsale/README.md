# ldns-forsale

Private Cloudflare Worker holding the domain-marketplace integration for ldns.com.

It declares no routes and `workers_dev: false`, so it has **no public URL**. The only way in is the `FORSALE` service binding from the site Worker (`ldns2/wrangler.jsonc`).

## Why this is separate

The marketplace check is the one lookup that costs money (a keyed Dynadot API call) and the one that fetches an arbitrary user-supplied host (parking-page fingerprinting). Isolating it means:

1. **Least privilege** — `DYNADOT_API_KEY` lives only here, not in the site Worker that serves ~12 endpoints.
2. **One chokepoint for spend** — the paid call happens in exactly one place, behind the daily budget counter in `src/budget.ts`.
3. **Isolation of the arbitrary-host fetch** — the parking-page fetch runs outside the site's request path.

## The budget counter

`DynadotBudget` is a Durable Object: a single addressable instance with strongly-consistent storage, so its count is a genuine global number. This matters because the site's rate limiter is per-isolate — Cloudflare spreads requests across many isolates, so that limiter's real ceiling is an unknown multiple of its configured value. A budget has to be exact.

- Resets at 00:00 UTC.
- Limit set by the `DYNADOT_DAILY_LIMIT` var in `wrangler.jsonc` (default 500).
- **Fails closed**: if the counter can't be read, the paid call is skipped.
- Exceeding the budget is not an error — the response just carries the free signals (Afternic + parking fingerprint).

## Deploy

```bash
# From the repository root (workspace install)
npm install

cd workers/forsale
npx wrangler secret put DYNADOT_API_KEY     # paste the key when prompted
npx wrangler deploy
```

Then deploy the site so its `FORSALE` binding resolves:

```bash
npm run deploy -w ldns-site
```

Order matters on first deploy — a service binding to a Worker that doesn't exist yet will fail.

## Running without it

The binding is optional. `ldns2/src/routes/api/forsale/+server.ts` returns an empty listing set when `platform.env.FORSALE` is absent, so the site builds and runs fine without this Worker — the for-sale badge just never appears. Forks that want the feature deploy their own copy with their own Dynadot key.

## Check

```bash
npm run check       # tsc --noEmit
```
