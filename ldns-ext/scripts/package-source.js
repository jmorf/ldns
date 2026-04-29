#!/usr/bin/env node

/**
 * Build a standalone source archive for AMO / Web Store reviewers.
 *
 * As of v1.7.5 the project is an npm workspace: the extension depends on
 * `@ldns/core` which lives outside ldns-ext/. The archive bundles both the
 * extension source and the core package, plus a root `package.json` that
 * declares the workspace so `npm install` resolves @ldns/core via the local
 * symlink and pulls all transitive deps correctly.
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync, writeFileSync, mkdtempSync, rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extDir = join(__dirname, '..');
const repoRoot = join(extDir, '..');
const coreDir = join(repoRoot, 'packages', 'core');

const zipName = 'ldns-source.zip';
const zipPath = join(extDir, zipName);

console.log('Packaging source code for AMO review...\n');

if (existsSync(zipPath)) {
  unlinkSync(zipPath);
  console.log(`Removed stale ${zipName}`);
}

const stage = mkdtempSync(join(tmpdir(), 'ldns-source-'));
console.log(`Staging in ${stage}`);

const skip = new Set(['node_modules', 'dist', 'dist-firefox', '.git', '.svelte-kit', '.wrangler', '.DS_Store']);

function copy(src, dst) {
  cpSync(src, dst, {
    recursive: true,
    filter: (p) => {
      const segments = p.split('/');
      return !segments.some((s) => skip.has(s));
    }
  });
}

copy(extDir, join(stage, 'ldns-ext'));
copy(coreDir, join(stage, 'packages', 'core'));

// Drop the per-package lockfiles — the workspace lockfile at the root is what
// `npm install` will use, and keeping the per-package ones around just confuses
// reviewers.
const stragglerLocks = [join(stage, 'ldns-ext', 'package-lock.json')];
for (const f of stragglerLocks) if (existsSync(f)) unlinkSync(f);

// Copy the workspace's package-lock.json (if it exists) so reviewers get a
// deterministic install matching the build we did.
const workspaceLock = join(repoRoot, 'package-lock.json');
if (existsSync(workspaceLock)) {
  cpSync(workspaceLock, join(stage, 'package-lock.json'));
}

// Workspace root — what makes `npm install` resolve @ldns/core correctly.
const rootPkg = {
  name: 'ldns-source-bundle',
  version: '1.0.0',
  private: true,
  workspaces: ['packages/*', 'ldns-ext'],
  scripts: {
    'build:firefox': 'npm run build:firefox -w ldns-ext',
    'build:chrome': 'npm run build -w ldns-ext',
    test: 'npm test --workspaces --if-present'
  }
};
writeFileSync(join(stage, 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n');

writeFileSync(
  join(stage, 'README-REVIEWER.md'),
  `# LDNS — source archive for store review

This archive contains everything needed to reproduce the submitted extension
build (\`ldns-firefox.zip\` / Chrome zip). It is a self-contained npm workspace.

## Build instructions

\`\`\`bash
unzip ldns-source.zip -d ldns
cd ldns
npm install
npm run build:firefox    # produces ldns-ext/ldns-firefox.zip
# or
npm run build:chrome     # produces ldns-ext/dist/
\`\`\`

\`npm install\` from the root sets up the workspace so \`@ldns/core\` resolves
to \`packages/core\` via a symlink. No registry-published version of
\`@ldns/core\` is required.

## Layout

- \`ldns-ext/\` — the extension source (TS, Svelte, CSS — unminified)
- \`packages/core/\` — shared @ldns/core modules (used by the extension and the
  ldns.com website; pure TypeScript, no DOM, no \`chrome.*\` API)
- \`ldns-ext/SOURCE_BUILD_INSTRUCTIONS.md\` — detailed build doc

## Environment

- Node.js v18 LTS or newer (built and tested on v22)
- macOS / Linux / Windows; pure-JS pipeline, no native compilation

See \`ldns-ext/SOURCE_BUILD_INSTRUCTIONS.md\` for the full reproducibility
checklist.
`
);

execSync(`cd "${stage}" && zip -rq "${zipPath}" . -x "*.zip"`, { stdio: 'inherit' });
rmSync(stage, { recursive: true, force: true });

console.log(`\n✓ Source package created: ${zipName}`);
console.log('\nReviewer instructions (also in README-REVIEWER.md inside the zip):');
console.log('  unzip ldns-source.zip -d ldns');
console.log('  cd ldns');
console.log('  npm install');
console.log('  npm run build:firefox');
