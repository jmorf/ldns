#!/usr/bin/env node

import { execSync } from 'child_process';
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist-firefox');

console.log('Building LDNS for Firefox...\n');

// Step 1: Run vite build with Firefox config
console.log('1. Running Vite build...');
execSync('npx vite build --config vite.config.firefox.ts', {
  cwd: rootDir,
  stdio: 'inherit'
});

// Step 2: Copy Firefox manifest with version from package.json (single source of truth)
console.log('\n2. Copying Firefox manifest...');
const manifestSrc = join(rootDir, 'public', 'manifest.firefox.json');
const manifestDest = join(distDir, 'manifest.json');
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const manifest = JSON.parse(readFileSync(manifestSrc, 'utf-8'));
manifest.version = pkg.version;
writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

// Step 3: Copy icons
console.log('3. Copying icons...');
const iconsDir = join(distDir, 'icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}
cpSync(join(rootDir, 'public', 'icons'), iconsDir, { recursive: true });

// Step 3b: Copy background script. Firefox loads it via manifest.background.scripts;
// the action-click listener inside it bridges to sidebarAction.toggle().
console.log('3b. Copying background.js...');
cpSync(join(rootDir, 'public', 'background.js'), join(distDir, 'background.js'));

// Step 4: Fix popup HTML paths (extensions need relative paths, not absolute)
console.log('4. Fixing popup HTML paths...');
const builtPopupHtml = join(distDir, 'src', 'popup', 'popup.html');
let popupHtml = readFileSync(builtPopupHtml, 'utf-8');
// Replace absolute paths with relative paths (from src/popup/ to root)
popupHtml = popupHtml.replace(/href="\/assets\//g, 'href="../../assets/');
popupHtml = popupHtml.replace(/src="\/assets\//g, 'src="../../assets/');
writeFileSync(builtPopupHtml, popupHtml);

// Step 5: Create zip for AMO submission. Delete any prior zip first so
// `zip -r` rebuilds from scratch instead of accumulating stale entries.
console.log('5. Creating Firefox extension zip...');
const zipName = 'ldns-firefox.zip';
const zipPath = join(rootDir, zipName);
if (existsSync(zipPath)) unlinkSync(zipPath);
execSync(`cd "${distDir}" && zip -r ../${zipName} .`, {
  cwd: rootDir,
  stdio: 'inherit'
});

console.log(`\n✓ Firefox build complete!`);
console.log(`  Output: ${distDir}`);
console.log(`  Zip: ${join(rootDir, zipName)}`);
console.log('\nTo test in Firefox:');
console.log('  1. Open about:debugging#/runtime/this-firefox');
console.log('  2. Click "Load Temporary Add-on"');
console.log(`  3. Select ${join(distDir, 'manifest.json')}`);
