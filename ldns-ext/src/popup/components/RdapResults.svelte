<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import QuickActions from './QuickActions.svelte';
  import { formatRdapDate } from '@ldns/core/rdap-query';
  import { Copy, Check, Shield, ShieldOff, Calendar, Server, Building2, Tag, ExternalLink } from 'lucide-svelte';
  import type { ForSaleListing } from '@ldns/core/types';
  import { cn } from '$lib/utils/cn';

  let copiedField = $state<string | null>(null);

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedField = field;
      setTimeout(() => (copiedField = null), 1600);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function formatPrice(listing: ForSaleListing): string {
    if (!listing.price) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: listing.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(listing.price);
  }

  function getMarketplaceName(marketplace: string): string {
    return marketplace === 'afternic' ? 'Afternic' : marketplace === 'dynadot' ? 'Dynadot' : marketplace;
  }

  const data = $derived(extensionState.rdapState.data);
  const forSaleListings = $derived(extensionState.forSaleState.data?.listings ?? []);
  const hasForSaleListings = $derived(forSaleListings.length > 0);

  function getDomainAge(created: string): string {
    if (!created) return '';
    const createdDate = new Date(created);
    if (isNaN(createdDate.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - createdDate.getFullYear();
    let months = now.getMonth() - createdDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}m`;
    return '<1m';
  }

  function getDaysUntilExpiry(expires: string): number | null {
    if (!expires) return null;
    const expiryDate = new Date(expires);
    if (isNaN(expiryDate.getTime())) return null;
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getExpiryColor(days: number | null): string {
    if (days === null) return 'text-fg-muted';
    if (days < 30) return 'text-bad-400';
    if (days < 90) return 'text-warn-400';
    return 'text-ok-400';
  }

  function getExpiryBgColor(days: number | null): string {
    if (days === null) return 'bg-surface-2 border-line';
    if (days < 30) return 'bg-bad-500/10 border-bad-500/25';
    if (days < 90) return 'bg-warn-500/10 border-warn-500/25';
    return 'bg-ok-500/10 border-ok-500/25';
  }
</script>

<div class="space-y-2.5">
  {#if extensionState.rdapState.loading}
    <LoadingState message="Looking up RDAP/WHOIS data…" />
  {:else if extensionState.rdapState.error}
    <ErrorState message={extensionState.rdapState.error} />
  {:else if data}
    <div class="flex justify-end">
      <RefreshButton onClick={() => extensionState.queryRdap()} loading={extensionState.rdapState.loading} />
    </div>
    <!-- For Sale Banner -->
    {#if hasForSaleListings}
      <div class="bg-primary-500/10 rounded-xl p-3 border border-primary-500/25">
        <div class="flex items-center gap-1.5 mb-2">
          <Tag class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">For Sale</h3>
        </div>
        <div class="space-y-1.5">
          {#each forSaleListings as listing}
            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between p-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors group"
            >
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold text-fg-muted uppercase tracking-wide">
                  {getMarketplaceName(listing.marketplace)}
                </span>
                {#if listing.buyNowAvailable}
                  <span class="px-1 py-0.5 text-[9px] font-medium bg-primary-500/15 text-primary-400 rounded">Buy Now</span>
                {/if}
              </div>
              <div class="flex items-center gap-1.5">
                {#if listing.price}
                  <span class="text-xs font-semibold text-primary-300 tnum">{formatPrice(listing)}</span>
                {:else}
                  <span class="text-xs text-fg-muted">Contact</span>
                {/if}
                <ExternalLink class="w-3 h-3 text-fg-subtle group-hover:text-primary-400 transition-colors" />
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Domain & Status -->
    <div class="bg-surface-2 rounded-xl p-3 border border-line fade-in-up">
      <div class="flex items-center justify-between mb-1.5">
        <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">Domain</h3>
        <div class="flex items-center gap-1">
          {#if data.dnssecEnabled}
            <span class="flex items-center gap-1 text-[10px] text-ok-400">
              <Shield class="w-3 h-3" />
              DNSSEC
            </span>
          {:else}
            <span class="flex items-center gap-1 text-[10px] text-fg-subtle">
              <ShieldOff class="w-3 h-3" />
              No DNSSEC
            </span>
          {/if}
        </div>
      </div>
      <p class="text-sm text-fg font-mono">{data.domainName}</p>
      {#if data.status.length > 0}
        <div class="flex flex-wrap gap-1 mt-2">
          {#each data.status.slice(0, 4) as status}
            <span class="px-1.5 py-0.5 text-[10px] bg-surface-3 text-fg-muted rounded-md">{status}</span>
          {/each}
          {#if data.status.length > 4}
            <span class="px-1.5 py-0.5 text-[10px] bg-surface-3 text-fg-subtle rounded-md">+{data.status.length - 4}</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Age & Expiry -->
    {#if data.created || data.expires}
      {@const age = getDomainAge(data.created)}
      {@const daysLeft = getDaysUntilExpiry(data.expires)}
      <div class={cn('rounded-xl p-3 border flex items-center justify-between', getExpiryBgColor(daysLeft))}>
        {#if age}
          <div>
            <p class="text-[10px] text-fg-subtle uppercase tracking-wide">Age</p>
            <p class="text-sm font-semibold text-fg tnum mt-0.5">{age}</p>
          </div>
        {/if}
        {#if daysLeft !== null}
          <div class="text-right">
            <p class="text-[10px] text-fg-subtle uppercase tracking-wide">{daysLeft > 0 ? 'Expires in' : 'Expired'}</p>
            <p class={cn('text-sm font-semibold tnum mt-0.5', getExpiryColor(daysLeft))}>
              {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : `${Math.abs(daysLeft)} d ago`}
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Registration Dates -->
    <div class="bg-surface-2 rounded-xl p-3 border border-line">
      <div class="flex items-center gap-1.5 mb-2">
        <Calendar class="w-3.5 h-3.5 text-primary-400" />
        <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">Registration</h3>
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p class="text-fg-subtle text-[10px]">Created</p>
          <p class="text-fg tnum">{formatRdapDate(data.created)}</p>
        </div>
        <div>
          <p class="text-fg-subtle text-[10px]">Updated</p>
          <p class="text-fg tnum">{formatRdapDate(data.updated)}</p>
        </div>
        <div>
          <p class="text-fg-subtle text-[10px]">Expires</p>
          <p class="text-fg tnum">{formatRdapDate(data.expires)}</p>
        </div>
      </div>
    </div>

    <!-- Registrar -->
    {#if data.registrar}
      <div class="bg-surface-2 rounded-xl p-3 border border-line">
        <div class="flex items-center gap-1.5 mb-1">
          <Building2 class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">Registrar</h3>
        </div>
        <p class="text-fg text-xs">{data.registrar}</p>
      </div>
    {/if}

    <!-- DNSSEC chain -->
    {#if data.dnssecData?.dsData && data.dnssecData.dsData.length > 0}
      <div class="bg-surface-2 rounded-xl p-3 border border-line">
        <div class="flex items-center gap-1.5 mb-2">
          <Shield class="w-3.5 h-3.5 text-ok-400" />
          <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">DNSSEC Chain</h3>
        </div>
        <div class="space-y-1">
          {#each data.dnssecData.dsData as ds}
            <div class="text-[10px] font-mono text-fg-muted flex flex-wrap gap-x-3 gap-y-0.5">
              <span><span class="text-fg-subtle">tag</span> {ds.keyTag}</span>
              <span><span class="text-fg-subtle">alg</span> {ds.algorithm}</span>
              <span><span class="text-fg-subtle">type</span> {ds.digestType}</span>
              <span class="break-all opacity-80 truncate" title={ds.digest}>{ds.digest.slice(0, 24)}…</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Nameservers -->
    {#if data.nameservers.length > 0}
      <div class="bg-surface-2 rounded-xl p-3 border border-line">
        <div class="flex items-center gap-1.5 mb-2">
          <Server class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="text-[11px] font-semibold tracking-wide uppercase text-primary-400">Nameservers</h3>
        </div>
        <div class="space-y-1">
          {#each data.nameservers as ns}
            <button
              type="button"
              onclick={() => copyToClipboard(ns, ns)}
              class={cn(
                'w-full flex items-center justify-between gap-2 px-2 py-1 -mx-2 rounded-lg transition-colors group text-left',
                copiedField === ns ? 'bg-ok-500/10' : 'hover:bg-surface-3'
              )}
              aria-label="Copy nameserver"
              title="Click to copy"
            >
              <p class="text-fg text-xs font-mono">{ns}</p>
              <span class="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                {#if copiedField === ns}
                  <Check class="w-3 h-3 text-ok-400" />
                {:else}
                  <Copy class="w-3 h-3 text-fg-subtle group-hover:text-fg" />
                {/if}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <EmptyState title="RDAP / WHOIS data" hint="Look up a domain to see registration details." />
  {/if}

  {#if data}
    <QuickActions tab="rdap" />
  {/if}
</div>
