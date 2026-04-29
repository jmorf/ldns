<script lang="ts">
  import DomainForm from '$lib/components/DomainForm.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import TerminalDemo from '$lib/components/TerminalDemo.svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';
  import { ArrowRight, Database, AtSign, Cpu, ShieldCheck, Network } from 'lucide-svelte';
  import { SiGooglechrome, SiFirefoxbrowser } from '@icons-pack/svelte-simple-icons';

  interface Feature {
    n: string;
    name: string;
    blurb: string;
    bullets: string[];
    href: string;
    icon: typeof Database;
  }

  const features: Feature[] = [
    {
      n: '01',
      name: 'Records',
      blurb: 'A, AAAA, MX, TXT, NS, SOA, CAA, CNAME — over encrypted DoH.',
      bullets: ['Cloudflare / Google / DNS.SB', 'Per-provider latency', 'Inline reverse DNS'],
      href: '/google.com',
      icon: Database
    },
    {
      n: '02',
      name: 'Email',
      blurb: 'SPF, DMARC, DKIM, BIMI, MTA-STS — with provider detection.',
      bullets: ['DKIM probes 22 selectors', '40+ provider patterns', 'Policy explanations'],
      href: '/google.com/email',
      icon: AtSign
    },
    {
      n: '03',
      name: 'Server',
      blurb: 'Headers, redirect chain, response time, tech stack.',
      bullets: ['HTTP/3 detection', 'Tech-stack badges', 'Per-IP ASN + country'],
      href: '/google.com/server',
      icon: Cpu
    },
    {
      n: '04',
      name: 'Security',
      blurb: 'TLS cert, security headers, HSTS preload, well-known files.',
      bullets: ['Cert from CT logs', 'Headers audit', 'security.txt + robots.txt'],
      href: '/google.com/security',
      icon: ShieldCheck
    },
    {
      n: '05',
      name: 'Subdomains',
      blurb: 'Discover subdomains via Certificate Transparency logs.',
      bullets: ['Edge-cached crt.sh', 'Live filter + CSV export', 'Deduplicated, sorted'],
      href: '/google.com/subdomains',
      icon: Network
    }
  ];

  const apiEndpoints = [
    '/api/server?domain=…',
    '/api/tls?domain=…',
    '/api/asn?ip=…',
    '/api/security/headers?domain=…',
    '/api/subdomains?domain=…',
    '/api/dkim?domain=…'
  ];
</script>

<SEO
  title="Free DNS, RDAP, Email Security & Server Tools"
  description="Look up DNS records, RDAP/WHOIS, email authentication (SPF, DMARC, DKIM, BIMI), TLS certificates, security headers, ASN, and subdomains for any domain — instant, free, no install."
/>

<!-- ─── Hero ─────────────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 grid gap-10 lg:gap-12 lg:grid-cols-2 items-center">
    <div class="min-w-0">
      <Eyebrow text="dns · rdap · email · server · security" />
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
        Look up any domain<br />
        <span class="text-primary-500">in one place.</span>
      </h1>
      <p class="mt-5 text-lg text-fg-muted leading-relaxed">
        DNS records, registration data, email authentication, TLS certificates, security headers, IP geolocation, and subdomains —
        for any domain on the internet. No accounts. No tracking.
      </p>
      <div class="mt-8">
        <DomainForm />
        <p class="mt-3 font-mono text-[11px] text-fg-subtle">
          // try <a href="/google.com" class="text-primary-500 hover:underline">ldns.com/google.com</a>, <a href="/cloudflare.com" class="text-primary-500 hover:underline">/cloudflare.com</a>, or <a href="/github.com" class="text-primary-500 hover:underline">/github.com</a>
        </p>
      </div>
    </div>
    <div class="min-w-0 lg:pl-6">
      <TerminalDemo />
    </div>
  </div>
</section>

<!-- ─── Numbered features ────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
    {#each features as f, i}
      {@const Icon = f.icon}
      <!-- Text dominates (~70%) and the icon tile is capped at ~25% so it
           reads as an accent, not a hero visual. Alternates left/right. -->
      <div class="grid gap-6 lg:gap-10 lg:grid-cols-[1fr_auto] items-center {i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}">
        <div class="min-w-0 max-w-2xl">
          <div class="flex items-baseline gap-3 mb-2">
            <span class="font-mono text-primary-500 tnum text-sm">{f.n}</span>
            <span class="font-mono text-fg-subtle">—</span>
            <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">{f.name}</h2>
          </div>
          <p class="text-base text-fg-muted leading-relaxed">{f.blurb}</p>
          <ul class="mt-4 space-y-1.5">
            {#each f.bullets as b}
              <li class="flex items-start gap-2 text-sm text-fg-muted">
                <span class="text-primary-500/60 font-mono">·</span>
                <span>{b}</span>
              </li>
            {/each}
          </ul>
          <a
            href={f.href}
            class="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 text-sm bg-surface-2 border border-line rounded-lg text-fg hover:border-primary-500/30 hover:text-primary-400 transition-colors"
          >
            See it on a domain
            <ArrowRight class="w-3.5 h-3.5" />
          </a>
        </div>
        <div class="lg:w-[200px] xl:w-[240px]">
          <div class="aspect-square bg-surface-2 border border-line rounded-xl flex items-center justify-center text-fg-subtle">
            <Icon class="w-12 h-12 opacity-40" />
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<!-- ─── API strip ───────────────────────────────────────────────── -->
<section class="border-b border-line bg-surface-2/30">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="developer api" />
    <div class="grid gap-8 lg:grid-cols-2 items-start">
      <div>
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
          Every tool is also an API.
        </h2>
        <p class="mt-3 text-fg-muted leading-relaxed">
          Free, public, rate-limited JSON endpoints powering the same lookups you see in the UI. No API key. No accounts.
          Heavy edge caching at Cloudflare so your lookups are fast.
        </p>
      </div>
      <div class="bg-surface border border-line rounded-xl p-4 sm:p-5 font-mono text-[12px] text-fg-muted space-y-1">
        {#each apiEndpoints as line}
          <p><span class="text-primary-500">GET</span> {line}</p>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- ─── Extension strip ─────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid gap-6 lg:grid-cols-2 items-center">
      <div>
        <Eyebrow text="browser extension" />
        <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
          One click on any tab.
        </h2>
        <p class="mt-3 text-fg-muted leading-relaxed max-w-md">
          The LDNS extension for Chrome and Firefox runs the same lookups as this site, on whatever tab you're viewing — popup or pinned in the side panel.
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href="https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-line rounded-lg text-fg hover:border-primary-500/40 transition-colors"
          >
            <SiGooglechrome size={16} />
            <span class="text-sm">Add to Chrome</span>
          </a>
          <a
            href="https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-line rounded-lg text-fg hover:border-primary-500/40 transition-colors"
          >
            <SiFirefoxbrowser size={16} />
            <span class="text-sm">Add to Firefox</span>
          </a>
        </div>
      </div>
      <div class="bg-surface-2 border border-line rounded-xl p-8 flex items-center justify-center">
        <img src="/favicon.ico" class="w-24 h-24 opacity-90" alt="LDNS extension" />
      </div>
    </div>
  </div>
</section>

<!-- ─── Trust strip ─────────────────────────────────────────────── -->
<section class="py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-mono uppercase tracking-wider text-fg-subtle">
      <span>// no accounts</span>
      <span class="text-line-strong">·</span>
      <span>// no tracking</span>
      <span class="text-line-strong">·</span>
      <span>// free forever</span>
      <span class="text-line-strong">·</span>
      <span>// open public api</span>
      <span class="text-line-strong">·</span>
      <span>// edge-cached on cloudflare</span>
    </div>
  </div>
</section>
