# LDNS Extension — Source Build Instructions

This document explains how to reproduce the submitted Firefox add-on (`ldns-firefox.zip`) from source.

---

## 1. Operating system & build environment

The build is platform-independent. We have verified it produces an identical output zip on:

- **macOS** 14+ (primary build platform)
- **Linux** — any distribution with Node.js available (Ubuntu 22.04+ tested)
- **Windows** 10/11 with WSL2 (the packaging step shells out to the `zip` command, which is not available in native PowerShell/CMD — use WSL, Git Bash, or install a zip utility on PATH)

No native compilation is performed; everything runs in pure Node.js.

---

## 2. Required programs and versions

| Program | Required version | Purpose |
|---------|-------------------|---------|
| Node.js | **v18.0.0 or higher** (v20 LTS or v22 LTS recommended; built and tested on v22) | Runs the build script and Vite |
| npm | **v9 or higher** (ships with Node.js 18+) | Installs dependencies |
| `unzip` | any | Extracts the source archive |
| `zip` | any | Used internally by the build script to produce the final extension zip |

### Installing Node.js

Download an LTS installer from <https://nodejs.org/> or use a version manager:

- **macOS / Linux**: `brew install node@22`, or `nvm install 22 && nvm use 22`
- **Windows**: download the MSI from nodejs.org, or `winget install OpenJS.NodeJS.LTS`

Verify the install:

```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
```

No other tooling needs to be installed globally — every other dependency is locked in `package-lock.json` and installed locally into `node_modules/`.

---

## 3. Step-by-step build instructions

These steps reproduce the exact `ldns-firefox.zip` that was submitted.

The source archive is a self-contained **npm workspace**: the extension
(`ldns-ext/`) depends on the shared `@ldns/core` package (`packages/core/`),
and the root `package.json` wires them together. Always install from the
archive root — installing inside `ldns-ext/` alone will not resolve
`@ldns/core`.

```bash
# 1. Extract the source archive into a fresh directory
unzip ldns-source.zip -d ldns
cd ldns

# 2. Install dependencies deterministically from the workspace lockfile
npm ci

# 3. Run the Firefox build pipeline
npm run build:firefox
```

After the build:

- The unpacked extension is in `ldns-ext/dist-firefox/`
- The packaged add-on is at `ldns-ext/ldns-firefox.zip`

The version field in `dist-firefox/manifest.json` is read from `package.json` at build time, so the rebuilt manifest will match the submitted version exactly.

---

## 4. What the build script does

`npm run build:firefox` runs [`scripts/build-firefox.js`](scripts/build-firefox.js). It performs every step needed to go from source to packaged extension; there are no manual steps.

1. **Vite build** (`npx vite build --config vite.config.firefox.ts`) — bundles `.ts` and `.svelte` source using:
   - Svelte 5 compiler (`@sveltejs/vite-plugin-svelte`) for `.svelte` components
   - TypeScript compiler for `.ts` files
   - Tailwind CSS v4 (`@tailwindcss/vite`) for the stylesheet
   - PostCSS + autoprefixer for vendor prefixes
   - Rollup + esbuild (used internally by Vite) for module bundling and minification
2. **Manifest copy** — reads `public/manifest.firefox.json`, injects the version from `package.json`, writes to `dist-firefox/manifest.json`
3. **Icon copy** — copies `public/icons/*` into `dist-firefox/icons/`
4. **HTML path fix** — rewrites absolute asset paths (`/assets/...`) to relative paths (`../../assets/...`) so the popup HTML loads correctly inside the extension context
5. **Zip** — runs `zip -r ../ldns-firefox.zip .` from inside `dist-firefox/` to produce the final packaged add-on

---

## 5. Source files are not transpiled, minified, or machine-generated

Every file in `ldns-source.zip` (outside of `node_modules/`, which is not included) is hand-written, human-readable source:

- `.svelte` files — Svelte 5 single-file components (script + template + style)
- `.ts` files — TypeScript with original variable names and comments
- `.css` files — hand-written Tailwind v4 sources
- `.json` files — manifests and config
- `.js` files — the three build scripts in `scripts/`, also hand-written

No file in the source archive is the output of another build step. Bundling, transpilation and minification only happen when `npm run build:firefox` runs and only into `dist-firefox/` (which is excluded from the source archive).

The only third-party code in the build output comes from the dependencies declared in `package.json`, all of which are open-source and installable from the public npm registry.

---

## 6. Project structure

```
(archive root — npm workspace)
├── package.json                   # workspace root: ["packages/*", "ldns-ext"]
├── package-lock.json              # locked dependency tree — used by `npm ci`
├── packages/
│   └── core/                      # @ldns/core — pure TS shared modules:
│       └── src/                   #   dns-query, rdap-query, email-query, server-info,
│                                  #   dkim-query, asn-query, ptr, security-checks,
│                                  #   subdomain-query, forsale-query, parsers, fetch-utils,
│                                  #   url, domain-parser, types, constants (+ tests)
└── ldns-ext/
    ├── src/
    │   ├── popup/                 # Popup UI (Svelte 5)
    │   │   ├── popup.html
    │   │   ├── popup.ts
    │   │   ├── Popup.svelte
    │   │   ├── global.css         # Tailwind v4 entry + theme variables
    │   │   └── components/        # Svelte components (DnsResults, EmailResults, etc.)
    │   ├── lib/
    │   │   ├── state/             # extension-state.svelte.ts (Svelte 5 runes)
    │   │   └── utils/             # cn, storage, export, sidepanel, url, feedback
    │   └── app.d.ts
    ├── public/
    │   ├── manifest.json          # Chrome MV3 manifest
    │   ├── manifest.firefox.json  # Firefox MV3 manifest (used by the build)
    │   ├── background.js          # Firefox-only action-click → sidebar bridge
    │   └── icons/                 # 16 / 48 / 128 px PNGs
    ├── scripts/
    │   ├── build-firefox.js       # Firefox build pipeline (`npm run build:firefox`)
    │   ├── generate-store-description.js   # Regenerates STORE_DESCRIPTION.txt
    │   └── package-source.js      # Builds this source-review zip
    ├── package.json
    ├── vite.config.ts             # Chrome build (crxjs)
    ├── vite.config.firefox.ts     # Firefox-specific Vite config
    ├── svelte.config.js
    ├── tsconfig.json
    ├── postcss.config.js
    ├── PRIVACY.md
    ├── README.md
    ├── CHANGELOG.md
    └── SOURCE_BUILD_INSTRUCTIONS.md   # this file
```

---

## 7. Dependencies

All listed in `package.json`. Every one is open-source and on npm.

**Build / runtime**
- Svelte 5 (MIT)
- Vite 6 (MIT)
- @sveltejs/vite-plugin-svelte (MIT)
- TypeScript (Apache-2.0)
- Tailwind CSS v4 + @tailwindcss/vite + @tailwindcss/postcss (MIT)
- PostCSS + autoprefixer (MIT)
- clsx + tailwind-merge (MIT)

**App-level**
- @ldns/core (MIT) — the shared workspace package in `packages/core/`; resolved locally via the workspace, never from the registry
- psl (MIT) — Public Suffix List parser (dependency of @ldns/core), used to identify the registrable domain client-side. Bundled into the popup; no network calls.
- lucide-svelte (ISC) — icon set

**Test (not required for the build)**
- vitest (MIT) — used by the @ldns/core test suite

`npm ci` installs exactly the versions pinned in `package-lock.json`; no other resolver behavior is involved.

---

## 8. Optional: running tests

```bash
npm test -w @ldns/core       # runs the shared-core Vitest suite (137 tests, a few seconds)
npm run check -w ldns-ext    # svelte-check + tsc — type-check the extension
```

Tests are not required to produce the extension build but are included for completeness.

---

## 9. Reproducibility checklist

If your built `ldns-firefox.zip` differs from the submitted one, please verify:

- `node --version` is ≥ 18 (we built on v22)
- `npm ci` was used (not `npm install`) — `npm install` may resolve newer transitive versions
- The `package-lock.json` is the one shipped in the source archive, unchanged
- The build was run from a clean working directory (no leftover `dist-firefox/` from a previous run; the build script removes it, but a stale `node_modules/` from a different lockfile can still interfere — `rm -rf node_modules dist-firefox && npm ci && npm run build:firefox` is the cleanest path)
