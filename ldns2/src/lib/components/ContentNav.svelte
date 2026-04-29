<script lang="ts">
  import { Menu } from 'lucide-svelte';
  import { SiGooglechrome, SiFirefoxbrowser } from '@icons-pack/svelte-simple-icons';
  import ThemeToggle from './ThemeToggle.svelte';

  let menuOpen = $state(false);
</script>

<nav class="bg-surface/80 backdrop-blur-sm border-b border-line sticky top-0 z-40">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-14">
      <a href="/" class="flex items-center gap-2">
        <img src="/favicon.ico" class="w-6 h-6 rounded" alt="LDNS" />
        <span class="text-base font-semibold tracking-tight text-fg">LDNS</span>
      </a>

      <div class="hidden md:flex items-center gap-2">
        <a href="/extension" class="text-fg-muted hover:text-fg px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors">
          <SiGooglechrome size={14} />
          <SiFirefoxbrowser size={14} />
          <span>extension</span>
        </a>
        <a href="/about" class="text-fg-muted hover:text-fg px-3 py-1.5 text-sm transition-colors">about</a>
        <ThemeToggle />
      </div>

      <button
        class="md:hidden p-2 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label="Toggle menu"
      >
        <Menu class="w-5 h-5" />
      </button>
    </div>

    {#if menuOpen}
      <div class="md:hidden pb-4 space-y-1">
        <a href="/extension" class="flex items-center gap-1.5 text-fg-muted hover:text-fg px-3 py-2 text-sm">
          <SiGooglechrome size={14} />
          <SiFirefoxbrowser size={14} />
          <span>extension</span>
        </a>
        <a href="/about" class="block text-fg-muted hover:text-fg px-3 py-2 text-sm">about</a>
        <div class="px-3 py-2"><ThemeToggle /></div>
      </div>
    {/if}
  </div>
</nav>
