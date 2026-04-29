import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './public/manifest.json';
import pkg from './package.json';

// Sync manifest version from package.json (single source of truth)
manifest.version = pkg.version;

export default defineConfig({
  plugins: [
    svelte(),
    crx({ manifest })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  resolve: {
    alias: {
      '$lib': resolve(__dirname, './src/lib')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html')
      }
    }
  }
});
