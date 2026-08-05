<script lang="ts">
  import type { ForSaleResult, ForSaleListing } from '$lib/forsale';
  import { ShoppingCart, ExternalLink, DollarSign, Tag } from 'lucide-svelte';
  import { safeHttpUrl } from '$lib/utils/url';

  interface Props {
    data: ForSaleResult | null;
    loading?: boolean;
    compact?: boolean;
  }

  let { data, loading = false, compact = false }: Props = $props();

  function formatPrice(listing: ForSaleListing): string {
    if (!listing.price) return 'Price on request';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: listing.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(listing.price);
  }

  function getMarketplaceName(marketplace: string): string {
    switch (marketplace) {
      case 'afternic':
        return 'Afternic';
      case 'dynadot':
        return 'Dynadot';
      default:
        return marketplace;
    }
  }

  const listings = $derived(data?.listings ?? []);
  const hasListings = $derived(listings.length > 0);
</script>

{#if loading}
  <!-- Loading state -->
  <div class="animate-pulse flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg">
    <div class="w-4 h-4 bg-surface-3 rounded"></div>
    <div class="h-4 w-24 bg-surface-3 rounded"></div>
  </div>
{:else if hasListings}
  {#if compact}
    <!-- Compact badge for inline display -->
    <a
      href={safeHttpUrl(listings[0].listingUrl)}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
    >
      <Tag class="w-3.5 h-3.5" />
      <span>For Sale</span>
      {#if listings[0].price}
        <span class="text-primary-600 dark:text-primary-300">
          {formatPrice(listings[0])}
        </span>
      {/if}
      <ExternalLink class="w-3 h-3 opacity-60" />
    </a>
  {:else}
    <!-- Full banner display -->
    <div class="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 border border-primary-200 dark:border-primary-700/50 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-800/50 rounded-lg">
          <ShoppingCart class="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-1">
            This domain is for sale
          </h3>
          <div class="space-y-2">
            {#each listings as listing}
              <a
                href={safeHttpUrl(listing.listingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-between gap-3 p-2 bg-surface-2/40 rounded-lg hover:bg-surface-2/60 transition-colors group"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    {getMarketplaceName(listing.marketplace)}
                  </span>
                  {#if listing.buyNowAvailable}
                    <span class="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-200 dark:bg-emerald-700/50 text-emerald-700 dark:text-emerald-300 rounded">
                      Buy Now
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  {#if listing.price}
                    <span class="flex items-center gap-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
                      <DollarSign class="w-4 h-4" />
                      {formatPrice(listing)}
                    </span>
                  {:else}
                    <span class="text-sm text-fg-subtle">
                      Contact for price
                    </span>
                  {/if}
                  <ExternalLink class="w-4 h-4 text-fg-muted group-hover:text-primary-400 transition-colors" />
                </div>
              </a>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
