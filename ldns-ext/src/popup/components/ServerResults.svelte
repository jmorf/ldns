<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import QuickActions from './QuickActions.svelte';
  import { getResponseTimeColor, getStatusColor, formatResponseTime } from '@ldns/core/server-info';
  import { detectTechnologies } from '@ldns/core/tech-detect';
  import {
    auditSecurityHeaders,
    detectAltSvc,
    probeExists,
    checkHstsPreload
  } from '@ldns/core/security-checks';
  import { cn } from '$lib/utils/cn';

  const colorClasses = {
    green: 'text-ok-400',
    yellow: 'text-warn-400',
    red: 'text-bad-400',
    gray: 'text-fg-muted'
  };

  const bgColorClasses = {
    green: 'bg-ok-500/15 border-ok-500/30 text-ok-400',
    yellow: 'bg-warn-500/15 border-warn-500/30 text-warn-400',
    red: 'bg-bad-500/15 border-bad-500/30 text-bad-400',
    gray: 'bg-surface-3 border-line text-fg-muted'
  };

  // Side-channel probes (don't block the rest of the tab)
  let securityTxt = $state<boolean | null>(null);
  let robotsTxt = $state<boolean | null>(null);
  let hstsStatus = $state<string | null>(null);

  $effect(() => {
    const url = extensionState.serverState.data?.info?.url;
    if (!url) return;
    const origin = (() => {
      try {
        return new URL(url).origin;
      } catch {
        return null;
      }
    })();
    if (!origin) return;
    const domain = extensionState.rootDomain || extensionState.domain;
    securityTxt = null;
    robotsTxt = null;
    hstsStatus = null;
    probeExists(`${origin}/.well-known/security.txt`).then((v) => (securityTxt = v));
    probeExists(`${origin}/robots.txt`).then((v) => (robotsTxt = v));
    if (domain) checkHstsPreload(domain).then((v) => (hstsStatus = v));
  });

  function levelClass(level: 'ok' | 'warn' | 'bad') {
    if (level === 'ok') return 'bg-ok-500/15 text-ok-400 border-ok-500/30';
    if (level === 'warn') return 'bg-warn-500/15 text-warn-400 border-warn-500/30';
    return 'bg-bad-500/15 text-bad-400 border-bad-500/30';
  }
</script>

<div class="space-y-2.5">
  <!-- HTTP toggle + refresh -->
  <div class="flex items-center justify-between pb-2 border-b border-line">
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={extensionState.useHttpForServer}
        onchange={() => {
          extensionState.useHttpForServer = !extensionState.useHttpForServer;
          if (extensionState.domain) extensionState.queryServer();
        }}
        class="w-3.5 h-3.5 rounded border-line bg-surface-2 text-primary-500 focus:ring-primary-500/30"
      />
      <span class="text-[11px] text-fg-muted">Start from HTTP</span>
    </label>
    <RefreshButton onClick={() => extensionState.queryServer()} loading={extensionState.serverState.loading} />
  </div>

  {#if extensionState.serverState.loading}
    <LoadingState message="Analyzing server…" />
  {:else if extensionState.serverState.error}
    <ErrorState message={extensionState.serverState.error} />
  {:else if extensionState.serverState.hasData && extensionState.serverState.data?.info}
    {@const info = extensionState.serverState.data.info}
    {@const redirects = extensionState.serverState.data.redirects}
    {@const dnsData = extensionState.dnsState.data}
    {@const ipv4 = dnsData?.A?.map((r) => r.data) || []}
    {@const ipv6 = dnsData?.AAAA?.map((r) => r.data) || []}
    {@const techs = detectTechnologies(info.headers)}
    {@const headerAudit = auditSecurityHeaders(info.headers)}
    {@const altSvc = detectAltSvc(info.headers)}

    <!-- Hero stat: response time + status -->
    <div class="bg-surface-2 rounded-xl p-3 border border-line fade-in-up">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-[10px] text-fg-subtle uppercase tracking-wide">Response time</p>
          <p class={cn('text-2xl font-semibold tnum mt-0.5', colorClasses[getResponseTimeColor(info.responseTime)])}>
            {formatResponseTime(info.responseTime)}
          </p>
        </div>
        <span class={cn('px-2 py-0.5 text-xs rounded-md border tnum font-mono', bgColorClasses[getStatusColor(info.status)])}>
          {info.status} {info.statusText}
        </span>
      </div>
      <p class="text-[10px] text-fg-subtle mt-2 truncate font-mono" title={info.url}>{info.url}</p>
    </div>

    <!-- Tech stack -->
    {#if techs.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each techs as tech}
          <span
            class={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full border',
              tech.category === 'cdn'
                ? 'bg-primary-500/10 text-primary-300 border-primary-500/30'
                : tech.category === 'server'
                  ? 'bg-surface-3 text-fg border-line'
                  : tech.category === 'framework'
                    ? 'bg-ok-500/10 text-ok-400 border-ok-500/30'
                    : tech.category === 'platform'
                      ? 'bg-warn-500/10 text-warn-400 border-warn-500/30'
                      : 'bg-surface-3 text-fg-muted border-line'
            )}
          >
            {tech.name}
          </span>
        {/each}
        {#if altSvc.http3}
          <span class="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-ok-500/10 text-ok-400 border-ok-500/30" title={altSvc.raw ?? undefined}>
            HTTP/3
          </span>
        {/if}
      </div>
    {/if}

    <!-- Security headers audit -->
    <div class="bg-surface-2 rounded-xl p-3 border border-line">
      <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400 mb-2">Security Headers</h3>
      <div class="flex flex-wrap gap-1.5">
        {#each headerAudit as check}
          <span
            class={cn('px-1.5 py-0.5 text-[10px] rounded-md border', levelClass(check.level))}
            title={`${check.key}: ${check.hint}${check.value ? ' — ' + check.value : ''}`}
          >
            {check.label}
          </span>
        {/each}
      </div>
      {#if hstsStatus}
        <p class="text-[10px] text-fg-muted mt-2">
          <span class="text-fg-subtle">HSTS preload:</span>
          <span class={cn('ml-1 font-medium', hstsStatus === 'preloaded' ? 'text-ok-400' : hstsStatus === 'pending' ? 'text-warn-400' : 'text-fg-muted')}>{hstsStatus}</span>
        </p>
      {/if}
    </div>

    <!-- security.txt + robots.txt indicators -->
    <div class="flex items-center gap-2 text-[10px]">
      {#if securityTxt !== null}
        <span class={cn('px-1.5 py-0.5 rounded border', securityTxt ? 'bg-ok-500/10 text-ok-400 border-ok-500/30' : 'bg-surface-2 text-fg-subtle border-line')}>
          security.txt {securityTxt ? '✓' : '×'}
        </span>
      {/if}
      {#if robotsTxt !== null}
        <span class={cn('px-1.5 py-0.5 rounded border', robotsTxt ? 'bg-ok-500/10 text-ok-400 border-ok-500/30' : 'bg-surface-2 text-fg-subtle border-line')}>
          robots.txt {robotsTxt ? '✓' : '×'}
        </span>
      {/if}
    </div>

    <!-- Redirect Chain -->
    <details class="bg-surface-2 rounded-xl border border-line">
      <summary class="p-3 cursor-pointer text-[11px] font-semibold tracking-wide uppercase text-primary-400 hover:text-fg flex items-center justify-between list-none">
        <span>Redirect Chain</span>
        {#if redirects && redirects.redirectCount > 0}
          <span class="text-[10px] text-warn-400 normal-case font-normal tracking-normal">
            {redirects.redirectCount} redirect{redirects.redirectCount > 1 ? 's' : ''} · {formatResponseTime(redirects.totalTime)}
          </span>
        {:else}
          <span class="text-[10px] text-ok-400 normal-case font-normal tracking-normal">Direct</span>
        {/if}
      </summary>
      <div class="px-3 pb-3">
        {#if redirects && redirects.redirectCount > 0}
          <div class="space-y-2">
            {#each redirects.hops as hop, i}
              <div class="flex items-start gap-2">
                <div class="flex flex-col items-center">
                  <span class={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border', bgColorClasses[getStatusColor(hop.status)])}>
                    {i + 1}
                  </span>
                  {#if i < redirects.hops.length - 1}
                    <div class="w-px h-4 bg-line"></div>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class={cn('text-xs font-mono tnum', colorClasses[getStatusColor(hop.status)])}>{hop.status}</span>
                    <span class="text-[10px] text-fg-subtle tnum">{formatResponseTime(hop.responseTime)}</span>
                  </div>
                  <p class="text-xs text-fg-muted truncate" title={hop.url}>{hop.url}</p>
                  <p class="text-[10px] text-fg-subtle truncate" title={hop.location}>→ {hop.location}</p>
                </div>
              </div>
            {/each}
            <div class="flex items-start gap-2">
              <div class="flex flex-col items-center">
                <span class={cn('w-5 h-5 rounded-full flex items-center justify-center border', bgColorClasses[getStatusColor(redirects.finalStatus)])}>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <span class={cn('text-xs font-mono tnum', colorClasses[getStatusColor(redirects.finalStatus)])}>
                  {redirects.finalStatus} {redirects.finalStatusText}
                </span>
                <p class="text-xs text-fg-muted truncate" title={redirects.finalUrl}>{redirects.finalUrl}</p>
              </div>
            </div>
          </div>
        {:else}
          <p class="text-xs text-fg-subtle py-1">No redirects detected.</p>
        {/if}
      </div>
    </details>

    <!-- IP Addresses -->
    {#if ipv4.length > 0 || ipv6.length > 0}
      <div class="bg-surface-2 rounded-xl border border-line p-3">
        <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400 mb-2">IP Addresses</h3>
        <div class="space-y-1.5">
          {#each ipv4 as ip}
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">IPv4</span>
              <span class="font-mono text-fg">{ip}</span>
            </div>
          {/each}
          {#each ipv6 as ip}
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">IPv6</span>
              <span class="font-mono text-fg truncate max-w-[280px]" title={ip}>{ip}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Server Details -->
    <div class="bg-surface-2 rounded-xl border border-line p-3">
      <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400 mb-2">Server Details</h3>
      <div class="space-y-1.5">
        {#if info.server}
          <div class="flex justify-between items-center text-xs">
            <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Server</span>
            <span class="font-mono text-fg">{info.server}</span>
          </div>
        {/if}
        {#if info.poweredBy}
          <div class="flex justify-between items-center text-xs">
            <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Powered By</span>
            <span class="font-mono text-fg">{info.poweredBy}</span>
          </div>
        {/if}
        {#if info.contentType}
          <div class="flex justify-between items-center text-xs">
            <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Content-Type</span>
            <span class="font-mono text-fg">{info.contentType}</span>
          </div>
        {/if}
        {#if info.via}
          <div class="flex justify-between items-center text-xs">
            <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Via</span>
            <span class="font-mono text-fg">{info.via}</span>
          </div>
        {/if}
        {#if info.xCache}
          <div class="flex justify-between items-center text-xs">
            <span class="text-[10px] text-fg-subtle uppercase tracking-wide">X-Cache</span>
            <span class="font-mono text-fg">{info.xCache}</span>
          </div>
        {/if}
        {#if !info.server && !info.poweredBy && !info.contentType && !info.via && !info.xCache}
          <p class="text-xs text-fg-subtle text-center py-1">No server details available.</p>
        {/if}
      </div>
    </div>

    <!-- Cache -->
    {#if info.cacheControl || info.etag || info.age !== null || info.lastModified}
      <div class="bg-surface-2 rounded-xl border border-line p-3">
        <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400 mb-2">Cache</h3>
        <div class="space-y-1.5">
          {#if info.cacheControl}
            <div class="flex justify-between items-start text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Cache-Control</span>
              <span class="font-mono text-fg text-right max-w-[200px]">{info.cacheControl}</span>
            </div>
          {/if}
          {#if info.age !== null}
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Age</span>
              <span class="font-mono text-fg tnum">{info.age}s</span>
            </div>
          {/if}
          {#if info.etag}
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">ETag</span>
              <span class="font-mono text-fg truncate max-w-[200px]" title={info.etag}>{info.etag}</span>
            </div>
          {/if}
          {#if info.lastModified}
            <div class="flex justify-between items-center text-xs">
              <span class="text-[10px] text-fg-subtle uppercase tracking-wide">Last-Modified</span>
              <span class="font-mono text-fg">{info.lastModified}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- All headers -->
    <details class="bg-surface-2 rounded-xl border border-line">
      <summary class="p-3 cursor-pointer text-[11px] font-semibold tracking-wide uppercase text-primary-400 hover:text-fg list-none">
        All Headers ({Object.keys(info.headers).length})
      </summary>
      <div class="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto">
        {#each Object.entries(info.headers).sort((a, b) => a[0].localeCompare(b[0])) as [key, value]}
          <div class="flex justify-between items-start gap-2 text-[10px]">
            <span class="text-fg-subtle font-mono shrink-0">{key}</span>
            <span class="font-mono text-fg-muted text-right break-all">{value}</span>
          </div>
        {/each}
      </div>
    </details>
  {:else}
    <EmptyState title="Server analysis" hint="Look up a domain to see headers, redirects, and security checks." />
  {/if}

  {#if extensionState.serverState.hasData}
    <QuickActions tab="server" />
  {/if}
</div>
