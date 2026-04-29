# AGENTS.md

> DNS lookup and domain analysis web app at **ldns.com**. SvelteKit on Cloudflare Pages with `/api/*` SvelteKit endpoints proxying server-side lookups, sharing core logic with the browser extension via `@ldns/core`.

## Quick Reference

```bash
npm run dev              # dev server (use hot reload)
npm run build            # production build
npm run check            # svelte-check + tsc
npm run test             # vitest (365 tests)
npm run deploy           # build + wrangler deploy → ldns.com

# from repo root:
npm test --workspaces    # all 502 tests across @ldns/core + ldns2
```

## Stack

- **SvelteKit 5** + TypeScript (strict)
- **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`)
- **Tailwind CSS v4** with surface-token CSS variables (see `src/styles/tokens.css`)
- **shadcn-style components** (`src/lib/components/ui/*`) + custom components
- **Cloudflare Pages** (adapter-cloudflare)
- **`@ldns/core`** — workspace package with all DNS / RDAP / email / server / security / TLS / ASN / PTR / subdomain / DKIM logic. Shared with the extension.

## Critical Rules

1. **Server-side via SvelteKit `/api/*`** for anything that needs to bypass CORS or hit a slow upstream — `/api/server`, `/api/headers`, `/api/tls`, `/api/asn`, `/api/geo`, `/api/security/*`, `/api/subdomains`, `/api/dkim`, plus the legacy `/api/whois` and `/api/forsale`.
2. **Pure DNS-over-HTTPS** for record lookups still happens client-side (no proxy needed; CORS works for DoH).
3. **Svelte 5 syntax only** — no `$:` reactive statements, use runes.
4. **Surface tokens** (`bg-surface`, `text-fg-muted`, etc.) instead of `bg-gray-*` / `text-gray-*`. Theme-aware via the `theme.ts` store.
5. **Object reactivity** — replace whole objects, don't mutate.

## Project Structure

```
ldns2/
├── src/
│   ├── lib/
│   │   ├── proxy-client.ts            # typed wrapper around /api/*
│   │   ├── theme.ts                   # system / light / dark store
│   │   ├── state.svelte.ts            # legacy DomainName store (still 2.2k lines, slated for split)
│   │   ├── server/                    # server-only helpers
│   │   │   ├── handler.ts             # createHandler — origin + rate-limit + CORS
│   │   │   ├── ssrf.ts                # post-resolution SSRF guard
│   │   │   ├── ratelimit.ts           # per-IP per-endpoint windowed limit
│   │   │   └── cors.ts                # origin allow-list
│   │   ├── components/                # Svelte components
│   │   └── utils/                     # cn, navigation, seoContent, faqJsonLd, useToolPage
│   └── routes/
│       ├── (content)/                 # marketing pages: /, /about, /extension/*, /tools/[tool]
│       ├── (tools)/[domain=validdomain]/   # tool pages — 28 of them
│       ├── api/                       # 11 endpoints, all on createHandler
│       └── og/[...path]/              # dynamic OG-image SVG endpoint
└── ../packages/core/                  # @ldns/core — shared with the extension
```

## Common Patterns

### API endpoint
```ts
// src/routes/api/<endpoint>/+server.ts
import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf'; // when fetching an arbitrary domain

const handler = createHandler({
  endpoint: 'my-endpoint',
  cache: 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain');
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);
    // ... import logic from '@ldns/core/...'
    return { ok: true, domain, /* … */ };
  }
});
export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
```

### Tool page using the proxy
```svelte
<script lang="ts">
  import { proxy } from '$lib/proxy-client';
  import { domain } from '$lib/state.svelte';
  // call proxy.server(), proxy.tls(), proxy.asn(ip), etc.
</script>
```

### Editorial section
```svelte
<Section n="01" title="TLS Certificate">…</Section>
<Eyebrow text="developer api" />
```

## Adding a new tool page

1. Create `src/routes/(tools)/[domain=validdomain]/<slug>/+page.svelte`
2. (Optional) add an `/api/<slug>` endpoint if the lookup needs to be server-side
3. Register SEO entry in `src/lib/utils/seoContent.ts` (`SEO_PAGES`, `PAGE_LABELS`)
4. Add to `src/lib/sitemap-data.ts` (`static_pages`, `tool_pages`)
5. Add to `src/lib/utils/navigation.ts` `ROUTE_GROUPS` for active-state highlighting
6. Add to the Sidebar's "More tools" group in `src/lib/components/Sidebar.svelte`

## Colors & tokens

Define semantic surfaces in `src/styles/tokens.css`. Use:
- `bg-surface` / `bg-surface-2` / `bg-surface-3` (page → card → nested row)
- `text-fg` / `text-fg-muted` / `text-fg-subtle`
- `border-line` / `border-line-strong`
- `text-ok-400` / `text-warn-400` / `text-bad-400` for status (emerald / amber / rose triad)
- `text-primary-500` (vermilion brand `#fc4e09`)
- `tnum` utility for tabular numerals on numeric data

Never hardcode `bg-gray-*` or `text-gray-*` — use the tokens.

## Docs

- [Svelte 5](https://svelte.dev/docs/svelte/overview)
- [SvelteKit](https://kit.svelte.dev/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Cloudflare Pages adapter](https://kit.svelte.dev/docs/adapter-cloudflare)
