<script lang="ts">
  import { domain, queryConfig } from "$lib/state.svelte";
  import { onMount } from "svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import DnsTable from "$lib/components/DnsTable.svelte";
  import ToolPage from "$lib/components/ToolPage.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import ShareButton from "$lib/components/ShareButton.svelte";
  import SectionHeader from "$lib/components/SectionHeader.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import RecordSummary from "$lib/components/RecordSummary.svelte";
  import EndpointSelector from "$lib/components/EndpointSelector.svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
  import { generateDnsFaqJsonLd } from "$lib/utils/faqJsonLd";
  import RelatedDomains from "$lib/components/RelatedDomains.svelte";
  import InternalLinks from "$lib/components/InternalLinks.svelte";
  import { ALL_PAGE_SLUGS } from "$lib/utils/seoContent";

  // State for DNS record filtering
  let currentFilter = $state("ALL");

  // Generate FAQ JSON-LD when DNS data is available
  const faqJsonLd = $derived(
    domain.toolState.dns.hasData 
      ? generateDnsFaqJsonLd(domain.name, domain.toolState.dns.data)
      : null
  );

  // Handle filter changes from both micro cards and filter chips
  function handleFilterChange(newFilter: string) {
    currentFilter = newFilter;
    // Update URL hash without triggering page reload
    if (browser) {
      if (newFilter === "ALL") {
        history.replaceState(null, '', window.location.pathname);
      } else {
        history.replaceState(null, '', `${window.location.pathname}#${newFilter.toLowerCase()}`);
      }
    }
  }

  // Handle hash-based filtering from URL
  function handleHashNavigation() {
    if (browser && window.location.hash) {
      const hash = window.location.hash.substring(1).toUpperCase();
      // List of valid record types for filtering
      const validRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'PTR', 'CAA', 'DNSKEY', 'DS', 'RRSIG', 'NSEC', 'NSEC3', 'TLSA', 'SSHFP'];
      
      if (validRecordTypes.includes(hash)) {
        currentFilter = hash;
      }
    }
  }

  // Look up all common record types using the new toolState method
  async function lookupAllRecords() {
    try {
      await domain.lookupDnsRecordsWithToolState("ALL");
    } catch (error) {
      console.error("DNS lookup error:", error);
    }
  }

  // Handle refresh using the new refresh system
  async function handleRefresh() {
    await domain.refreshTool("dns");
  }

  // Track the current domain to detect changes
  let currentDomain = domain.name;
  
  // Look up DNS records when domain changes
  $effect(() => {
    if (domain.name && domain.name !== currentDomain) {
      currentDomain = domain.name;
      lookupAllRecords();
    }
  });
  
  // Automatically look up DNS records when the page loads
  onMount(() => {
    // Handle hash navigation on initial load
    handleHashNavigation();
    
    // Always fetch on mount
    if (domain.name && domain.isValid) {
      lookupAllRecords();
    }
    
    // Listen for hash changes (browser back/forward, manual hash changes)
    const handleHashChange = () => {
      handleHashNavigation();
    };
    
    if (browser) {
      window.addEventListener('hashchange', handleHashChange);
      
      // Cleanup
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  });

  // Handle hash navigation with Svelte 5 $effect
  $effect(() => {
    // Re-run when DNS data loads to ensure hash navigation works
    if (domain.toolState.dns.hasData && browser && window.location.hash) {
      handleHashNavigation();
    }
  });
</script>

<SEO 
  title="{$page.params.domain} DNS Lookup"
  description="DNS lookup for {$page.params.domain}. View A, AAAA, MX, TXT, NS, CNAME, SOA and other DNS record types in real time with this free DNS lookup tool."
/>

<FaqJsonLd faqData={faqJsonLd} />

<ToolPage
  eyebrow="dns · all records"
  title="{domain.name} DNS Lookup"
  description="DNS lookup results for {domain.name}: live records using the {queryConfig.endpointName} endpoint"
  domainName={domain.name}
  isLoading={domain.toolState.dns.loading}
  error={domain.toolState.dns.error}
  badge={{
    text: queryConfig.endpointName,
    color: "orange",
  }}
>
  {#snippet actions()}
    <div class="flex items-center gap-3">
      <EndpointSelector onchange={handleRefresh} />
      <div class="flex gap-2">
        <ShareButton />
        <RefreshButton
          onClick={handleRefresh}
          loading={domain.toolState.dns.loading}
          variant="secondary"
        />
      </div>
    </div>
  {/snippet}

  <!-- Content is only shown when not loading and has data -->
  {#if domain.toolState.dns.hasData}
    <!-- Record Summary -->
    <div class="mb-6 hidden sm:block">
      <RecordSummary
        dnsData={domain.toolState.dns.data}
        variant="detailed"
        onRecordClick={handleFilterChange}
      />
    </div>

    <!-- DNS Records Section -->
    <div class="mb-8">
      <SectionHeader id="dns-records" title="DNS Lookup Results" />
      <DnsTable 
        filterType={currentFilter}
        onFilterChange={handleFilterChange}
      />
    </div>

    <!-- Related Tools Section -->
    <div class="mb-8">
      <InternalLinks
        domain={$page.params.domain ?? ''}
        currentSlug="dns"
        relatedSlugs={ALL_PAGE_SLUGS}
      />
    </div>

    <!-- Related Domains Section -->
    {#key $page.params.domain}
      <RelatedDomains domain={$page.params.domain ?? ''} />
    {/key}
  {/if}
</ToolPage>
