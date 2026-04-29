<script lang="ts">
  import { Globe, GitBranch, Rocket, Mail, ShieldCheck, Server, Network } from 'lucide-svelte';
  import SEO from '$lib/components/SEO.svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';

  interface Capability {
    n: string;
    name: string;
    blurb: string;
    href: string;
    icon: typeof Globe;
  }

  const capabilities: Capability[] = [
    { n: '01', name: 'DNS Records', blurb: 'A, AAAA, MX, TXT, NS, SOA, CAA, CNAME — over encrypted DoH with per-provider latency.', href: '/google.com', icon: Globe },
    { n: '02', name: 'RDAP & WHOIS', blurb: 'Registration data, registrar, expiry, DNSSEC. WHOIS fallback for ccTLDs that don\'t support RDAP.', href: '/google.com/rdap', icon: GitBranch },
    { n: '03', name: 'Email security', blurb: 'SPF, DMARC, DKIM, BIMI, MTA-STS — provider detection, policy explanation.', href: '/google.com/email', icon: Mail },
    { n: '04', name: 'Server response', blurb: 'Headers, redirect chain, TTFB, tech-stack badges, IP/ASN/country per upstream.', href: '/google.com/server', icon: Server },
    { n: '05', name: 'TLS & security', blurb: 'Cert from CT logs, response security headers, HSTS preload, well-known files.', href: '/google.com/security', icon: ShieldCheck },
    { n: '06', name: 'Subdomains', blurb: 'Discovery via Certificate Transparency logs, deduplicated and exportable as CSV.', href: '/google.com/subdomains', icon: Network }
  ];
</script>

<SEO
  title="About"
  description="LDNS is a free, no-account toolkit for inspecting any domain on the internet — DNS, RDAP, email, server, security and subdomains."
/>

<!-- ─── Hero ─────────────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
    <Eyebrow text="about ldns" />
    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
      One URL,<br />
      <span class="text-primary-500">every domain tool.</span>
    </h1>
    <p class="mt-6 text-lg text-fg-muted leading-relaxed max-w-2xl">
      LDNS is a free toolkit for inspecting any domain on the internet — DNS records,
      registration data, email authentication, TLS certificates, security headers,
      IP geolocation, and subdomains. No accounts. No tracking. Edge-cached on Cloudflare
      so lookups are fast.
    </p>
  </div>
</section>

<!-- ─── Capabilities ────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="what's in the box" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg mb-10">
      Six tools, one workflow.
    </h2>
    <div class="grid sm:grid-cols-2 gap-4">
      {#each capabilities as c}
        {@const Icon = c.icon}
        <a
          href={c.href}
          class="group bg-surface-2 border border-line rounded-xl p-5 hover:border-primary-500/30 transition-colors"
        >
          <div class="flex items-baseline gap-2 mb-3">
            <span class="font-mono text-primary-500 tnum text-xs">{c.n}</span>
            <span class="font-mono text-fg-subtle text-xs">—</span>
            <Icon class="w-4 h-4 text-fg-subtle ml-auto group-hover:text-primary-400 transition-colors" />
          </div>
          <h3 class="text-base font-semibold text-fg group-hover:text-primary-400 transition-colors">{c.name}</h3>
          <p class="text-sm text-fg-muted leading-relaxed mt-1.5">{c.blurb}</p>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- ─── How to use ──────────────────────────────────────────────── -->
<section class="border-b border-line bg-surface-2/30">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="how to use it" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg mb-8">
      Just put the domain in the URL.
    </h2>
    <div class="space-y-5">
      <div>
        <p class="text-sm text-fg-muted mb-2">All DNS records:</p>
        <div class="flex items-center justify-between gap-3 bg-surface border border-line rounded-lg px-4 py-2.5 font-mono text-sm">
          <span class="text-fg truncate">ldns.com<span class="text-primary-500">/google.com</span></span>
          <a href="/google.com" class="text-[11px] px-2 py-1 bg-surface-2 border border-line text-fg-muted rounded hover:text-primary-400 hover:border-primary-500/40 transition-colors">try it →</a>
        </div>
      </div>
      <div>
        <p class="text-sm text-fg-muted mb-2">Add a tool slug for a focused view:</p>
        <div class="flex items-center justify-between gap-3 bg-surface border border-line rounded-lg px-4 py-2.5 font-mono text-sm">
          <span class="text-fg truncate">ldns.com/google.com<span class="text-primary-500">/email</span></span>
          <a href="/google.com/email" class="text-[11px] px-2 py-1 bg-surface-2 border border-line text-fg-muted rounded hover:text-primary-400 hover:border-primary-500/40 transition-colors">try it →</a>
        </div>
      </div>
      <div>
        <p class="text-sm text-fg-muted mb-2">Hash fragments deep-link to specific sections:</p>
        <div class="flex items-center justify-between gap-3 bg-surface border border-line rounded-lg px-4 py-2.5 font-mono text-sm">
          <span class="text-fg truncate">ldns.com/google.com/email<span class="text-primary-500">#dmarc</span></span>
          <a href="/google.com/email#dmarc" class="text-[11px] px-2 py-1 bg-surface-2 border border-line text-fg-muted rounded hover:text-primary-400 hover:border-primary-500/40 transition-colors">try it →</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ─── Architecture ────────────────────────────────────────────── -->
<section class="border-b border-line">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <Eyebrow text="how it's built" />
    <h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-fg mb-6">
      Edge-rendered, cache-first, no database.
    </h2>
    <div class="space-y-4 text-fg-muted leading-relaxed max-w-prose">
      <p>
        DNS queries go straight to public DoH resolvers (Cloudflare, Google, DNS.SB).
        Server probes, TLS, ASN, subdomain and email lookups run through SvelteKit endpoints
        that proxy to public services and cache aggressively at the Cloudflare edge.
      </p>
      <p>
        We don't run a database. We don't track users. Every lookup is a stateless GET
        against a cached endpoint — that's why the same lookup is essentially free at scale,
        and why every page is also a public API.
      </p>
    </div>
  </div>
</section>

<!-- ─── CTA ─────────────────────────────────────────────────────── -->
<section class="py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <a
      href="/"
      class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
    >
      <Rocket class="w-4 h-4" />
      Look up a domain
    </a>
  </div>
</section>
