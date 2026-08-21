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
  import { toneText, toneBadge, levelTone } from '$lib/utils/status';

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
    // Guard against stale probes: a slow response for the previous domain
    // (up to 6s) must not overwrite the verdicts for the current one.
    const forDomain = extensionState.domain;
    const current = () => extensionState.domain === forDomain;
    probeExists(`${origin}/.well-known/security.txt`).then((v) => { if (current()) securityTxt = v; });
    probeExists(`${origin}/robots.txt`).then((v) => { if (current()) robotsTxt = v; });
    if (domain) checkHstsPreload(domain).then((v) => { if (current()) hstsStatus = v; });
  });

</script>

{#snippet kv(label: string, value: string, valueClass = '')}
  <div class="flex justify-between items-center text-xs">
    <span class="text-[10px] text-fg-subtle uppercase tracking-wide">{label}</span>
    <span class={cn('font-mono text-fg', valueClass)} title={value}>{value}</span>
  </div>
{/snippet}

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
    <ErrorState
      message={extensionState.serverState.error}
      service="the target server"
      onRetry={() => extensionState.queryServer()}
    />
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
    <div class="card fade-in-up">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-[10px] text-fg-subtle uppercase tracking-wide">Response time</p>
          <p class={cn('text-2xl font-semibold tnum mt-0.5', toneText[getResponseTimeColor(info.responseTime)])}>
            {formatResponseTime(info.responseTime)}
          </p>
        </div>
        <span class={cn('px-2 py-0.5 text-xs rounded-md border tnum font-mono', toneBadge[getStatusColor(info.status)])}>
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
    <div class="card">
      <h3 class="section-title mb-2">Security Headers</h3>
      <div class="flex flex-wrap gap-1.5">
        {#each headerAudit as check}
          <span
            class={cn('px-1.5 py-0.5 text-[10px] rounded-md border', toneBadge[levelTone[check.level]])}
            title={`${check.key}: ${check.hint}${check.value ? ': ' + check.value : ''}`}
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
    <details class="card-bare">
      <summary class="p-3 cursor-pointer section-title hover:text-fg flex items-center justify-between list-none">
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
                  <span class={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border', toneBadge[getStatusColor(hop.status)])}>
                    {i + 1}
                  </span>
                  {#if i < redirects.hops.length - 1}
                    <div class="w-px h-4 bg-line"></div>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class={cn('text-xs font-mono tnum', toneText[getStatusColor(hop.status)])}>{hop.status}</span>
                    <span class="text-[10px] text-fg-subtle tnum">{formatResponseTime(hop.responseTime)}</span>
                  </div>
                  <p class="text-xs text-fg-muted truncate" title={hop.url}>{hop.url}</p>
                  <p class="text-[10px] text-fg-subtle truncate" title={hop.location}>→ {hop.location}</p>
                </div>
              </div>
            {/each}
            <div class="flex items-start gap-2">
              <div class="flex flex-col items-center">
                <span class={cn('w-5 h-5 rounded-full flex items-center justify-center border', toneBadge[getStatusColor(redirects.finalStatus)])}>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <span class={cn('text-xs font-mono tnum', toneText[getStatusColor(redirects.finalStatus)])}>
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
      {@const geo = extensionState.geoState.data}
      <div class="card">
        <h3 class="section-title mb-2">IP Addresses</h3>
        <div class="space-y-1.5">
          {#each ipv4 as ip}
            {@render kv('IPv4', ip)}
          {/each}
          {#each ipv6 as ip}
            {@render kv('IPv6', ip, 'truncate max-w-[280px]')}
          {/each}
          <!-- Location of the primary address (best-effort; CDN/anycast IPs
               report the nearest edge, not the origin) -->
          {#if geo}
            {#if geo.city || geo.country}
              {@render kv(
                'Location',
                [geo.city, geo.region, geo.countryCode ?? geo.country]
                  .filter(Boolean)
                  .join(', '),
                'truncate max-w-[280px]'
              )}
            {/if}
            {#if geo.isp || geo.org}
              {@render kv('ISP', geo.isp ?? geo.org ?? '', 'truncate max-w-[280px]')}
            {/if}
          {/if}
        </div>
      </div>
    {/if}

    <!-- Server Details -->
    <div class="card">
      <h3 class="section-title mb-2">Server Details</h3>
      <div class="space-y-1.5">
        {#if info.server}
          {@render kv('Server', info.server)}
        {/if}
        {#if info.poweredBy}
          {@render kv('Powered By', info.poweredBy)}
        {/if}
        {#if info.contentType}
          {@render kv('Content-Type', info.contentType)}
        {/if}
        {#if info.via}
          {@render kv('Via', info.via)}
        {/if}
        {#if info.xCache}
          {@render kv('X-Cache', info.xCache)}
        {/if}
        {#if !info.server && !info.poweredBy && !info.contentType && !info.via && !info.xCache}
          <p class="text-xs text-fg-subtle text-center py-1">No server details available.</p>
        {/if}
      </div>
    </div>

    <!-- Cache -->
    {#if info.cacheControl || info.etag || info.age !== null || info.lastModified}
      <div class="card">
        <h3 class="section-title mb-2">Cache</h3>
        <div class="space-y-1.5">
          {#if info.cacheControl}
            {@render kv('Cache-Control', info.cacheControl, 'text-right max-w-[200px]')}
          {/if}
          {#if info.age !== null}
            {@render kv('Age', `${info.age}s`, 'tnum')}
          {/if}
          {#if info.etag}
            {@render kv('ETag', info.etag, 'truncate max-w-[200px]')}
          {/if}
          {#if info.lastModified}
            {@render kv('Last-Modified', info.lastModified)}
          {/if}
        </div>
      </div>
    {/if}

    <!-- All headers -->
    <details class="card-bare">
      <summary class="p-3 cursor-pointer section-title hover:text-fg list-none">
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
