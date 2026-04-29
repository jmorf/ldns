<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { proxy, type ServerResult, type AsnResponse } from '$lib/proxy-client';
  import ToolPage from '$lib/components/ToolPage.svelte';
  import RefreshButton from '$lib/components/RefreshButton.svelte';
  import ShareButton from '$lib/components/ShareButton.svelte';
  import SkeletonRows from '$lib/components/SkeletonRows.svelte';
  import AsnInline from '$lib/components/AsnInline.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import FaqJsonLd from '$lib/components/FaqJsonLd.svelte';
  import { generateServerFaqJsonLd } from '$lib/utils/faqJsonLd';
  import { getResponseTimeColor, getStatusColor, formatResponseTime } from '@ldns/core/server-info';

  let result = $state<ServerResult | null>(null);
  let loading = $state(false);
  let error = $state('');
  let useHttp = $state(false);
  let asnByIp = $state<Record<string, AsnResponse>>({});

  async function load() {
    if (!domain.name || !domain.isValid) return;
    loading = true;
    error = '';
    try {
      result = await proxy.server(domain.name, useHttp);
      // Kick off ASN lookups for any A/AAAA from the existing DNS state
      const ips = [
        ...(domain.toolState.dns?.data?.A?.map((r: { data: string }) => r.data) ?? []),
        ...(domain.toolState.dns?.data?.AAAA?.map((r: { data: string }) => r.data) ?? [])
      ];
      Promise.all(
        ips.map(async (ip) => {
          try {
            const asn = await proxy.asn(ip);
            asnByIp = { ...asnByIp, [ip]: asn };
          } catch {
            /* swallow per-IP failures */
          }
        })
      );
    } catch (e) {
      error = e instanceof Error ? e.message : 'Server lookup failed';
    } finally {
      loading = false;
    }
  }

  function handleRefresh() {
    return load();
  }

  function toggleHttp() {
    useHttp = !useHttp;
    load();
  }

  onMount(() => {
    if (!result) load();
  });

  const colorMap = { green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400', gray: 'text-gray-400' } as const;
  const bgMap = {
    green: 'bg-green-500/15 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/15 border-red-500/30 text-red-400',
    gray: 'bg-gray-700 border-gray-600 text-gray-400'
  } as const;
  const techCategoryClass = {
    cdn: 'bg-primary-500/10 text-primary-300 border-primary-500/30',
    server: 'bg-gray-700 text-gray-200 border-gray-600',
    framework: 'bg-green-500/10 text-green-400 border-green-500/30',
    platform: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    hosting: 'bg-gray-700 text-gray-300 border-gray-600'
  } as const;
  const auditClass = {
    ok: 'bg-green-500/15 text-green-400 border-green-500/30',
    warn: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    bad: 'bg-red-500/15 text-red-400 border-red-500/30'
  } as const;

  const success = $derived(result && result.ok ? result : null);
  const failure = $derived(result && !result.ok ? result : null);
  const dnsData = $derived(domain.toolState.dns?.data);
  const ipv4: string[] = $derived(dnsData?.A?.map((r: { data: string }) => r.data) ?? []);
  const ipv6: string[] = $derived(dnsData?.AAAA?.map((r: { data: string }) => r.data) ?? []);

  // Loose-cast the partial server-shaped object — the FAQ generator only reads
  // .response.status, but the type signature wants the full record.
  const faqJsonLd = $derived(success && success.info
    ? generateServerFaqJsonLd(
        domain.name,
        {
          info: { ip: ipv4[0] ?? null, httpVersion: null, server: success.info.server, location: null, lastChecked: new Date().toISOString() },
          headers: success.info.headers,
          ssl: null,
          response: { status: success.info.status, time: success.info.responseTime, size: null, redirects: success.redirects?.redirectCount ?? 0 }
        } as Parameters<typeof generateServerFaqJsonLd>[1]
      )
    : null);
</script>

<SEO
  title="{$page.params.domain} Server Information"
  description="Server, headers, redirects, technology stack, and security headers for {$page.params.domain}."
/>

<FaqJsonLd faqData={faqJsonLd} />

<ToolPage
  title="{domain.name} Server Information"
  description="Headers, redirects, technology stack, and security signals for {domain.name}"
  domainName={domain.name}
  isLoading={loading}
  error={error || (failure ? failure.error : '')}
  badge={success
    ? { text: `${success.info?.status ?? 'online'}`, color: success.info && success.info.status >= 200 && success.info.status < 300 ? 'green' : success.info && success.info.status >= 300 && success.info.status < 400 ? 'yellow' : 'red' }
    : { text: loading ? 'Checking…' : 'Ready', color: 'gray' }}
>
  {#snippet actions()}
    <div class="flex gap-2">
      <label class="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
        <input type="checkbox" checked={useHttp} onchange={toggleHttp} class="w-3.5 h-3.5" />
        Start from HTTP
      </label>
      <ShareButton />
      <RefreshButton onClick={handleRefresh} loading={loading} variant="secondary" />
    </div>
  {/snippet}

  {#if loading && !result}
    <SkeletonRows rows={5} />
  {:else if success && success.info}
    {@const info = success.info}
    <div class="space-y-6">
      <!-- Hero stat block -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <div class="flex items-end justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-gray-500">Response time</p>
            <p class="text-4xl font-semibold tabular-nums mt-1 {colorMap[getResponseTimeColor(info.responseTime)]}">
              {formatResponseTime(info.responseTime)}
            </p>
          </div>
          <span class="px-2.5 py-1 text-xs rounded-md border tabular-nums font-mono {bgMap[getStatusColor(info.status)]}">
            {info.status} {info.statusText}
          </span>
        </div>
        <p class="text-[11px] text-gray-500 mt-3 truncate font-mono" title={info.url}>{info.url}</p>
      </div>

      <!-- Tech stack -->
      {#if success.tech.length > 0 || success.altSvc.http3}
        <div class="flex flex-wrap gap-1.5">
          {#each success.tech as t}
            <span class="px-2 py-0.5 text-[11px] font-medium rounded-full border {techCategoryClass[t.category]}">{t.name}</span>
          {/each}
          {#if success.altSvc.http3}
            <span class="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-green-500/10 text-green-400 border-green-500/30" title={success.altSvc.raw ?? ''}>HTTP/3</span>
          {/if}
        </div>
      {/if}

      <!-- Security headers -->
      <div>
        <SectionHeader id="security-headers" title="Security Headers" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div class="flex flex-wrap gap-1.5">
            {#each success.securityHeaders as check}
              <span class="px-2 py-0.5 text-[11px] rounded-md border {auditClass[check.level]}" title="{check.key}: {check.hint}">{check.label}</span>
            {/each}
          </div>
        </div>
      </div>

      <!-- IP addresses with ASN -->
      {#if ipv4.length > 0 || ipv6.length > 0}
        <div>
          <SectionHeader id="ip-addresses" title="IP Addresses" />
          <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800">
            {#each ipv4 as ip}
              <div class="flex items-center justify-between gap-3 p-3">
                <div>
                  <span class="text-[10px] uppercase tracking-wider text-gray-500 mr-2">IPv4</span>
                  <span class="font-mono text-sm text-white">{ip}</span>
                </div>
                <AsnInline info={asnByIp[ip] ?? null} />
              </div>
            {/each}
            {#each ipv6 as ip}
              <div class="flex items-center justify-between gap-3 p-3">
                <div class="min-w-0">
                  <span class="text-[10px] uppercase tracking-wider text-gray-500 mr-2">IPv6</span>
                  <span class="font-mono text-sm text-white truncate inline-block max-w-[260px] align-middle" title={ip}>{ip}</span>
                </div>
                <AsnInline info={asnByIp[ip] ?? null} />
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Redirect chain -->
      <div>
        <SectionHeader id="redirect-chain" title="Redirect Chain" />
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-4">
          {#if success.redirects && success.redirects.redirectCount > 0}
            <div class="space-y-2">
              {#each success.redirects.hops as hop, i}
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium border {bgMap[getStatusColor(hop.status)]}">{i + 1}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono tabular-nums {colorMap[getStatusColor(hop.status)]}">{hop.status}</span>
                      <span class="text-[10px] text-gray-500 tabular-nums">{formatResponseTime(hop.responseTime)}</span>
                    </div>
                    <p class="text-xs text-gray-400 truncate" title={hop.url}>{hop.url}</p>
                    <p class="text-[11px] text-gray-500 truncate" title={hop.location}>→ {hop.location}</p>
                  </div>
                </div>
              {/each}
              <div class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-full flex items-center justify-center border {bgMap[getStatusColor(success.redirects.finalStatus)]}">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-mono tabular-nums {colorMap[getStatusColor(success.redirects.finalStatus)]}">
                    {success.redirects.finalStatus} {success.redirects.finalStatusText}
                  </span>
                  <p class="text-xs text-gray-400 truncate" title={success.redirects.finalUrl}>{success.redirects.finalUrl}</p>
                </div>
              </div>
            </div>
          {:else}
            <p class="text-xs text-gray-500">No redirects detected — direct connection to {info.url}.</p>
          {/if}
        </div>
      </div>

      <!-- Cache info -->
      {#if info.cacheControl || info.etag || info.age !== null || info.lastModified}
        <div>
          <SectionHeader id="cache" title="Cache" />
          <div class="bg-gray-900 border border-gray-700 rounded-xl divide-y divide-gray-800">
            {#if info.cacheControl}
              <div class="flex justify-between items-start gap-3 p-3 text-xs"><span class="text-[10px] text-gray-500 uppercase tracking-wider">Cache-Control</span><span class="font-mono text-gray-200 text-right">{info.cacheControl}</span></div>
            {/if}
            {#if info.age !== null}
              <div class="flex justify-between items-center gap-3 p-3 text-xs"><span class="text-[10px] text-gray-500 uppercase tracking-wider">Age</span><span class="font-mono text-gray-200 tabular-nums">{info.age}s</span></div>
            {/if}
            {#if info.etag}
              <div class="flex justify-between items-center gap-3 p-3 text-xs"><span class="text-[10px] text-gray-500 uppercase tracking-wider">ETag</span><span class="font-mono text-gray-200 truncate max-w-[260px]" title={info.etag}>{info.etag}</span></div>
            {/if}
            {#if info.lastModified}
              <div class="flex justify-between items-center gap-3 p-3 text-xs"><span class="text-[10px] text-gray-500 uppercase tracking-wider">Last-Modified</span><span class="font-mono text-gray-200">{info.lastModified}</span></div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Full headers -->
      <details class="bg-gray-900 border border-gray-700 rounded-xl">
        <summary class="p-4 cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-primary-400 hover:text-white list-none">All Headers ({Object.keys(info.headers).length})</summary>
        <div class="px-4 pb-4 space-y-1 max-h-72 overflow-y-auto">
          {#each Object.entries(info.headers).sort((a, b) => a[0].localeCompare(b[0])) as [k, v]}
            <div class="flex justify-between items-start gap-2 text-[11px]">
              <span class="text-gray-500 font-mono shrink-0">{k}</span>
              <span class="font-mono text-gray-300 text-right break-all">{v}</span>
            </div>
          {/each}
        </div>
      </details>

      <!-- Powered-by footer -->
      <p class="text-[10px] text-gray-600 text-center pt-2">
        Headers fetched server-side via ldns.com. <a class="text-primary-500 hover:underline" href="/{domain.name}/headers">View raw headers →</a>
      </p>
    </div>
  {/if}
</ToolPage>
