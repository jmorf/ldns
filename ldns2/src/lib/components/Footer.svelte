<script lang="ts">
  import { SiGooglechrome, SiFirefoxbrowser, SiGithub } from '@icons-pack/svelte-simple-icons';

  const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn';
  const FIREFOX_AMO_URL = 'https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/';
  const GITHUB_URL = 'https://github.com/jmorf/ldns';

  const tools = [
    { href: '/google.com', label: 'DNS' },
    { href: '/google.com/email', label: 'Email' },
    { href: '/google.com/server', label: 'Server' },
    { href: '/google.com/security', label: 'Security' },
    { href: '/google.com/subdomains', label: 'Subdomains' },
    { href: '/google.com/tls', label: 'TLS' }
  ];
  const resources = [
    { href: '/extension', label: 'Browser extension' },
    { href: '/api/server?domain=google.com', label: 'API', external: true },
    { href: '/about', label: 'About' }
  ];
  const legal = [
    { href: '/extension/privacy', label: 'Privacy' }
  ];
</script>

<footer class="border-t border-line bg-surface-2/30">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <a href="/" class="flex items-center gap-2 mb-3">
          <img src="/favicon.ico" class="w-6 h-6 rounded" alt="LDNS" />
          <span class="text-base font-semibold tracking-tight text-fg">LDNS</span>
        </a>
        <p class="text-xs text-fg-muted leading-relaxed max-w-[18rem]">
          Free, open-source DNS, RDAP, email, server &amp; security lookups for any domain.
        </p>
      </div>

      <div>
        <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-2">// tools</p>
        <ul class="space-y-1.5">
          {#each tools as t}
            <li><a href={t.href} class="text-xs text-fg-muted hover:text-fg transition-colors">{t.label}</a></li>
          {/each}
        </ul>
      </div>

      <div>
        <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-2">// resources</p>
        <ul class="space-y-1.5">
          {#each resources as r}
            <li><a href={r.href} class="text-xs text-fg-muted hover:text-fg transition-colors">{r.label}</a></li>
          {/each}
          <li>
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" class="text-xs text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5">
              <SiGooglechrome size={12} /> Chrome Web Store
            </a>
          </li>
          <li>
            <a href={FIREFOX_AMO_URL} target="_blank" rel="noopener noreferrer" class="text-xs text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5">
              <SiFirefoxbrowser size={12} /> Firefox AMO
            </a>
          </li>
          <li>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" class="text-xs text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5">
              <SiGithub size={12} /> Source on GitHub
            </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-2">// legal</p>
        <ul class="space-y-1.5">
          {#each legal as l}
            <li><a href={l.href} class="text-xs text-fg-muted hover:text-fg transition-colors">{l.label}</a></li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3">
      <p class="text-[11px] text-fg-subtle">
        © {new Date().getFullYear()} LDNS · No tracking, no accounts ·
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" class="hover:text-fg-muted transition-colors underline decoration-line underline-offset-2">Open source (MIT)</a>
      </p>
      <p class="font-mono text-[10px] text-fg-subtle">edge.cloudflare · sveltekit · svelte 5</p>
    </div>
  </div>
</footer>
