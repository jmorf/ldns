<script lang="ts">
  import { Globe, Shield, Mail, Server, Moon, History, Search, Zap } from 'lucide-svelte';
  import { SiGooglechrome, SiFirefoxbrowser } from '@icons-pack/svelte-simple-icons';
  import SEO from '$lib/components/SEO.svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';

  const CHROME_STORE_URL =
    'https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn';
  const FIREFOX_AMO_URL = 'https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/';

  interface Feature {
    n: string;
    name: string;
    blurb: string;
    icon: typeof Globe;
  }

  const features: Feature[] = [
    { n: '01', name: 'DNS Records', blurb: 'A, AAAA, MX, TXT, NS, SOA, CAA, DNSKEY — looked up over DoH on the tab you\'re viewing.', icon: Globe },
    { n: '02', name: 'WHOIS / RDAP', blurb: 'Registration, registrar, expiry, DNSSEC. WHOIS fallback for ccTLDs that don\'t speak RDAP.', icon: Search },
    { n: '03', name: 'Email security', blurb: 'SPF, DMARC, DKIM, BIMI, MTA-STS — with provider detection and policy explanations.', icon: Mail },
    { n: '04', name: 'Server response', blurb: 'HTTP headers, redirect chain, response time. Same data as the website.', icon: Server },
    { n: '05', name: 'Multi-provider DoH', blurb: 'Cloudflare, Google, or DNS.SB. Switch resolvers per-query, see per-provider latency.', icon: Zap },
    { n: '06', name: 'Light & dark', blurb: 'Follows your system theme by default, or pin one explicitly.', icon: Moon },
    { n: '07', name: 'Recent searches', blurb: 'Quick access to your last 10 lookups. Stored locally, never synced.', icon: History },
    { n: '08', name: 'Privacy first', blurb: 'No accounts, no analytics, no telemetry. Lookups go directly to public DNS services.', icon: Shield }
  ];
</script>

<SEO
  title="Browser Extension"
  description="The LDNS extension for Chrome and Firefox: DNS records, WHOIS, email security, and server info on the tab you're viewing — popup or pinned in the side panel."
/>

<!-- ─── Hero ─────────────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
    <div class="grid gap-10 lg:gap-12 lg:grid-cols-2 items-center">
      <div class="min-w-0">
        <Eyebrow text="browser extension" />
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
          One click on<br />
          <span class="text-primary-500">any tab.</span>
        </h1>
        <p class="mt-5 text-lg text-fg-muted leading-relaxed">
          Run the same lookups as ldns.com on whatever tab you're viewing — popup
          or pinned in the side panel. Free, no accounts, no tracking.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <SiGooglechrome size={18} />
            Add to Chrome
          </a>
          <a
            href={FIREFOX_AMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-2 border border-line text-fg hover:border-primary-500/40 text-sm font-medium rounded-lg transition-colors"
          >
            <SiFirefoxbrowser size={18} />
            Add to Firefox
          </a>
        </div>
      </div>
      <div class="min-w-0 lg:pl-6">
        <div class="bg-surface-2 border border-line rounded-2xl shadow-2xl shadow-primary-500/5 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface-3/40">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-bad-400/70"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-warn-400/70"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-ok-400/70"></span>
            </div>
            <span class="font-mono text-[10px] text-fg-subtle">ldns extension — popup</span>
          </div>
          <div class="p-8 sm:p-12 flex items-center justify-center bg-surface">
            <img src="/favicon.ico" class="w-32 h-32 opacity-90" alt="LDNS extension" />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ─── Features ────────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="what it does" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg mb-10">
      Every LDNS lookup, on the tab you're already on.
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each features as f}
        {@const Icon = f.icon}
        <div class="bg-surface-2 border border-line rounded-xl p-5 hover:border-primary-500/30 transition-colors">
          <div class="flex items-baseline gap-2 mb-3">
            <span class="font-mono text-primary-500 tnum text-xs">{f.n}</span>
            <span class="font-mono text-fg-subtle text-xs">—</span>
            <Icon class="w-4 h-4 text-fg-subtle ml-auto" />
          </div>
          <h3 class="text-sm font-semibold text-fg mb-1.5">{f.name}</h3>
          <p class="text-xs text-fg-muted leading-relaxed">{f.blurb}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ─── How it works ────────────────────────────────────────────── -->
<section class="border-b border-line bg-surface-2/30">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="how it works" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg mb-10">
      Three clicks from install to inspection.
    </h2>
    <div class="grid gap-6 sm:grid-cols-3">
      <div>
        <span class="font-mono text-primary-500 text-sm tnum">01</span>
        <h3 class="text-base font-semibold text-fg mt-2">Click the extension icon</h3>
        <p class="text-sm text-fg-muted mt-1.5 leading-relaxed">The current tab's domain is auto-detected and loaded.</p>
      </div>
      <div>
        <span class="font-mono text-primary-500 text-sm tnum">02</span>
        <h3 class="text-base font-semibold text-fg mt-2">Browse the tabs</h3>
        <p class="text-sm text-fg-muted mt-1.5 leading-relaxed">DNS, WHOIS, email and server data laid out in organized sections.</p>
      </div>
      <div>
        <span class="font-mono text-primary-500 text-sm tnum">03</span>
        <h3 class="text-base font-semibold text-fg mt-2">Look up anything</h3>
        <p class="text-sm text-fg-muted mt-1.5 leading-relaxed">Type any domain to inspect it — or pick from your recent searches.</p>
      </div>
    </div>
  </div>
</section>

<!-- ─── Privacy ─────────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid gap-8 lg:grid-cols-[1fr_auto] items-start">
      <div>
        <Eyebrow text="privacy" />
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">No accounts. No telemetry. No tracking.</h2>
        <p class="mt-3 text-fg-muted leading-relaxed max-w-2xl">
          DNS lookups go directly to public DoH resolvers. Recent searches are
          stored on your device. The extension code is open and reviewed by both
          stores' security teams.
        </p>
        <a href="/extension/privacy" class="inline-block mt-5 text-sm text-primary-400 hover:underline">
          Read the full privacy policy →
        </a>
      </div>
      <div class="bg-surface-2 border border-line rounded-xl p-5 lg:w-[280px]">
        <ul class="space-y-2 text-sm text-fg-muted">
          <li class="flex items-center gap-2"><span class="text-ok-400">✓</span> No data collection</li>
          <li class="flex items-center gap-2"><span class="text-ok-400">✓</span> No analytics or telemetry</li>
          <li class="flex items-center gap-2"><span class="text-ok-400">✓</span> Lookups straight to public DNS</li>
          <li class="flex items-center gap-2"><span class="text-ok-400">✓</span> Recent searches stay local</li>
          <li class="flex items-center gap-2"><span class="text-ok-400">✓</span> Open and transparent</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ─── Install CTA ─────────────────────────────────────────────── -->
<section class="py-16">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <Eyebrow text="get started" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">Install in seconds.</h2>
    <p class="mt-3 text-fg-muted leading-relaxed">
      Pick your browser. Free forever, no sign-up.
    </p>
    <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
      <a
        href={CHROME_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <SiGooglechrome size={18} />
        Chrome Web Store
      </a>
      <a
        href={FIREFOX_AMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-2 border border-line text-fg hover:border-primary-500/40 text-sm font-medium rounded-lg transition-colors"
      >
        <SiFirefoxbrowser size={18} />
        Firefox Add-ons
      </a>
    </div>
  </div>
</section>
