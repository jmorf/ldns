# Contributing to LDNS

Thanks for taking the time. Bug reports and small, focused pull requests are both genuinely welcome.

## Before you start

- **Bugs and feature requests** → [open an issue](https://github.com/jmorf/ldns/issues/new/choose). For anything non-trivial, please open an issue *before* writing code so we can agree on the approach — it's no fun to have a PR turned down after the work is done.
- **Security vulnerabilities** → do **not** open a public issue. See [SECURITY.md](./SECURITY.md).

## Repository layout

This is an npm workspace with three packages:

| Path | What it is |
|---|---|
| `packages/core/` | `@ldns/core` — pure TypeScript lookup logic (DNS, RDAP, email, server, security, TLS, ASN, PTR, subdomains, DKIM). No DOM, no `chrome.*`, no SvelteKit. Shared by both apps. |
| `ldns-ext/` | The browser extension (Svelte 5, Manifest V3, Chrome + Firefox). |
| `ldns2/` | The ldns.com website (SvelteKit 5 on Cloudflare Workers). |

**Always run `npm install` from the repository root** — the apps depend on the local `@ldns/core` package via the workspace, so installing inside a subdirectory will not resolve it.

## Development

```bash
npm install                      # from the repo root

npm test --workspaces            # all tests
npm run check --workspaces       # type-check everything

# Extension
npm run dev -w ldns-ext          # Vite dev build
npm run build -w ldns-ext        # Chrome build → ldns-ext/dist/
npm run build:firefox -w ldns-ext

# Website
npm run dev -w ldns-site         # SvelteKit dev server
npm run build -w ldns-site
```

Load the extension for testing via `chrome://extensions` → Developer mode → **Load unpacked** → `ldns-ext/dist`.

## Pull requests

1. **Branch** from `main`.
2. **Keep it focused** — one concern per PR. A 40-line PR that does one thing gets reviewed the same day; a 2,000-line PR that does six things may sit for a while.
3. **Tests**: logic changes in `packages/core/` need test coverage — that package is where the parsing and network behavior lives, and it's the easiest place to test. Run `npm test --workspaces` before pushing.
4. **Type-check**: `npm run check --workspaces` must be clean (zero errors).
5. **Describe the change**: what it does, why, and how you verified it. Screenshots for UI changes.
6. **Sign off your commits** (see below).

CI runs type-checking, tests, and both extension builds on every PR. Green CI is required to merge.

### Developer Certificate of Origin

All commits must be signed off, certifying you wrote the code (or have the right to submit it) under this project's MIT license:

```bash
git commit -s -m "your message"
```

This appends a `Signed-off-by:` line. The full DCO text is at [developercertificate.org](https://developercertificate.org/).

## Code style

Match the surrounding code — it's consistent, and consistency beats personal preference. A few conventions worth knowing:

- **Comments explain *why*, not *what*.** The codebase leans on comments that capture non-obvious reasoning (protocol quirks, why a timeout is the value it is, why a guard exists). Please keep that up.
- **New network calls in `packages/core/` go through `fetchWithTimeout`** and accept an optional `AbortSignal` — no bare `fetch`. Every request must have a timeout and be cancellable.
- **Any remote-derived value used as a link must go through `safeHttpUrl`.** DNS/RDAP/CT data is attacker-controlled.
- **Server endpoints that fetch a user-supplied host must apply the SSRF guard** (`ensurePublicHost` + `assertRedirectTarget`). Read [SECURITY.md](./SECURITY.md) first.

## What we're unlikely to merge

- New third-party analytics, telemetry, or tracking of any kind. The privacy claims on the site are load-bearing.
- Features that route user lookups through a server when the browser could make the request itself.
- Large dependency additions where a small amount of code would do.
- Reformatting or "cleanup" PRs that touch many files without a behavioral reason.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE). Note the [brand exception](./ldns-ext/LICENSE-BRAND): the LDNS name, wordmark, and icons are not covered — forks must use their own branding.
