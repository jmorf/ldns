<script lang="ts">
  /**
   * Animated terminal-style hero panel. Cycles through a few real-looking DNS
   * lookups against well-known domains. Pure CSS/JS animation, no network.
   */
  import { onMount } from 'svelte';

  interface Frame {
    cmd: string;
    output: string[];
  }

  const frames: Frame[] = [
    {
      cmd: '$ ldns google.com',
      output: [
        'A      142.250.190.78    TTL 234',
        'AAAA   2607:f8b0:4005:80a::200e',
        'NS     ns1.google.com',
        'MX     1 smtp.google.com',
        'AS15169  GOOGLE  US'
      ]
    },
    {
      cmd: '$ ldns cloudflare.com --tls',
      output: [
        'Issuer    Cloudflare Inc ECC CA-3',
        'Subject   sni.cloudflaressl.com',
        'Valid     2026-04-12 → 2027-04-13',
        'SAN       cloudflare.com, *.cloudflare.com',
        'HSTS      preloaded'
      ]
    },
    {
      cmd: '$ ldns github.com --headers',
      output: [
        'server                  github.com',
        'strict-transport-…      max-age=31536000; includeSubDomains; preload',
        'x-frame-options         deny',
        'content-security-pol…   default-src \'none\'; …',
        'alt-svc                 h3=":443"; ma=86400'
      ]
    },
    {
      cmd: '$ ldns vercel.com --email',
      output: [
        'MX      10 mx1.vercel-dns.com',
        'SPF     v=spf1 include:_spf.google.com -all',
        'DMARC   v=DMARC1; p=reject; pct=100',
        'DKIM    google._domainkey  rsa  2048-bit',
        'BIMI    detected at default._bimi'
      ]
    }
  ];

  let active = $state(0);
  let typedLines = $state<string[]>([]);
  let typingDone = $state(false);

  onMount(() => {
    let cancelled = false;

    async function play() {
      while (!cancelled) {
        const frame = frames[active];
        typedLines = [];
        typingDone = false;
        // Reveal each line with a small delay
        for (let i = 0; i < frame.output.length; i++) {
          await new Promise((r) => setTimeout(r, 320));
          if (cancelled) return;
          typedLines = frame.output.slice(0, i + 1);
        }
        typingDone = true;
        await new Promise((r) => setTimeout(r, 2400));
        if (cancelled) return;
        active = (active + 1) % frames.length;
      }
    }
    play();
    return () => {
      cancelled = true;
    };
  });

  const current = $derived(frames[active]);
</script>

<div
  class="bg-surface-2 border border-line rounded-2xl shadow-2xl shadow-primary-500/5 overflow-hidden"
>
  <!-- terminal chrome -->
  <div class="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface-3/40">
    <div class="flex items-center gap-1.5">
      <span class="w-2.5 h-2.5 rounded-full bg-bad-400/70"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-warn-400/70"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-ok-400/70"></span>
    </div>
    <span class="font-mono text-[10px] text-fg-subtle">ldns.com — domain inspector</span>
  </div>

  <!-- body -->
  <div class="p-4 sm:p-5 font-mono text-[12px] sm:text-[13px] leading-relaxed min-h-[200px]">
    <p class="text-fg-muted">{current.cmd}</p>
    <div class="mt-2 space-y-0.5">
      {#each typedLines as line}
        <p class="text-fg whitespace-pre">{line}</p>
      {/each}
      {#if !typingDone}
        <span class="inline-block w-2 h-4 bg-primary-500 align-middle animate-pulse ml-0.5"></span>
      {/if}
    </div>
  </div>

  <!-- frame indicator -->
  <div class="flex items-center gap-1.5 px-4 py-2 border-t border-line">
    {#each frames as _, i}
      <span
        class="h-1 rounded-full transition-all {i === active ? 'w-6 bg-primary-500' : 'w-1.5 bg-line-strong'}"
      ></span>
    {/each}
  </div>
</div>
