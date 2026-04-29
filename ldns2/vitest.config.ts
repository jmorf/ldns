import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
    plugins: [svelte({ hot: false })],
    resolve: {
        alias: {
            '$lib': path.resolve('./src/lib'),
            '$app': path.resolve('./node_modules/@sveltejs/kit/src/runtime/app'),
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
