<script lang="ts">
    import { onMount } from "svelte";
    import { domain } from "$lib/state.svelte";
    import ToolPage from "$lib/components/ToolPage.svelte";
    import RefreshButton from "$lib/components/RefreshButton.svelte";
    import ShareButton from "$lib/components/ShareButton.svelte";
    import SectionHeader from "$lib/components/SectionHeader.svelte";
    import MetricsGrid from "$lib/components/MetricsGrid.svelte";
    import StatStrip from "$lib/components/StatStrip.svelte";
    import EmailAnalysisSection from "$lib/components/EmailAnalysisSection.svelte";
    import CopyButton from "$lib/components/CopyButton.svelte";
    import { browser } from "$app/environment";
    import SEO from "$lib/components/SEO.svelte";
    import SPFAnalyzer from "$lib/components/SPFAnalyzer.svelte";
    import SpfLookupBudget from "$lib/components/SpfLookupBudget.svelte";
    import EmailProviderDetector from "$lib/components/EmailProviderDetector.svelte";
    import DMARCAnalyzer from "$lib/components/DMARCAnalyzer.svelte";
    import MTASTSAnalyzer from "$lib/components/MTASTSAnalyzer.svelte";
    import BIMIAnalyzer from "$lib/components/BIMIAnalyzer.svelte";
    import { page } from "$app/stores";
    import FaqJsonLd from "$lib/components/FaqJsonLd.svelte";
    import { generateEmailFaqJsonLd } from "$lib/utils/faqJsonLd";

    // Look up email records
    async function lookupEmailRecords() {
        try {
            await domain.lookupEmailRecords();
        } catch (error) {
            console.error("Email lookup error:", error);
        }
    }

    // Handle refresh
    async function handleRefresh() {
        await domain.refreshTool("email");
    }

    // Handle navigation to email sections
    function navigateToSection(sectionId: string) {
        if (browser) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                // Update URL hash
                history.replaceState(null, '', `${window.location.pathname}#${sectionId}`);
            }
        }
    }

    // Generate FAQ JSON-LD when email data is available
    const faqJsonLd = $derived(
        domain.toolState.email.hasData 
            ? generateEmailFaqJsonLd(domain.name, domain.toolState.email.data)
            : null
    );

    // Email summary data for micro cards
    const emailSummary = $derived(() => {
        const data = domain.toolState.email.data;
        if (!data) return [];

        return [
            {
                type: "MX",
                title: "Mail Server",
                description: "Mail exchange servers",
                count: data.mx?.length || 0,
                hasData: (data.mx?.length || 0) > 0,
                color: "pink" as const,
                sectionId: "provider"
            },
            {
                type: "SPF",
                title: "SPF Protection", 
                description: "Sender Policy Framework",
                count: data.spf?.length || 0,
                hasData: (data.spf?.length || 0) > 0,
                color: "emerald" as const,
                sectionId: "spf"
            },
            {
                type: "DMARC",
                title: "DMARC Policy",
                description: "Domain-based Message Authentication",
                count: data.dmarc?.length || 0,
                hasData: (data.dmarc?.length || 0) > 0,
                color: "fuchsia" as const,
                sectionId: "dmarc"
            },
            {
                type: "MTA-STS",
                title: "MTA-STS",
                description: "Mail Transfer Agent Strict Transport Security",
                count: data.mtaSts?.length || 0,
                hasData: (data.mtaSts?.length || 0) > 0,
                color: "blue" as const,
                sectionId: "mta-sts"
            },
            {
                type: "BIMI",
                title: "BIMI",
                description: "Brand Indicators for Message Identification",
                count: data.bimi?.length || 0,
                hasData: (data.bimi?.length || 0) > 0,
                color: "yellow" as const,
                sectionId: "bimi"
            }
        ];
    });

    onMount(() => {
        // Auto-lookup email records when page loads if we don't have data
        if (
            domain.name &&
            domain.isValid &&
            !domain.toolState.email.hasData &&
            !domain.toolState.email.loading
        ) {
            lookupEmailRecords();
        }
        
    });
    
    // Handle hash navigation after data loads using Svelte 5 $effect
    $effect(() => {
        // Reference email data so this effect re-runs when data loads
        if (domain.toolState.email.hasData && browser && window.location.hash) {
            const hash = window.location.hash.substring(1);
            const element = document.getElementById(hash);
            if (element) {
                // Small delay to ensure DOM is fully rendered
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            }
        }
    });
    
</script>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
</style>

<SEO 
    title="{$page.params.domain} Email Security Checker"
    description="Email security checker for {$page.params.domain}. Check SPF, DMARC, MX records, and email security settings to ensure proper email delivery and protection."
/>

<FaqJsonLd faqData={faqJsonLd} />

<ToolPage
    eyebrow="email · authentication"
    title="{domain.name} Email Security Checker"
    domainName={domain.name}
    isLoading={domain.toolState.email.loading}
    error={domain.toolState.email.error}
>
    {#snippet actions()}
        <div class="flex gap-2">
            <ShareButton />
            <RefreshButton
                onClick={handleRefresh}
                loading={domain.toolState.email.loading}
                variant="secondary"
            />
        </div>
    {/snippet}

    <!-- Email security at a glance: one cell per mechanism, click to jump
         to its analysis section -->
    <div class="mb-8" id="summary">
        <StatStrip
            cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            stats={emailSummary().map((item) => ({
                label: item.type,
                value: item.hasData
                    ? `${item.count} record${item.count === 1 ? '' : 's'}`
                    : 'Missing',
                tone: item.hasData ? ('ok' as const) : undefined,
                onclick: () => navigateToSection(item.sectionId)
            }))}
        />
    </div>
    
    <!-- Email Provider Analysis -->
    <div class="mb-8">
        <SectionHeader id="provider" title="Email Provider Analysis" />
        
        <EmailProviderDetector
            mxRecords={domain.toolState.email.data?.mx}
            variant="detailed"
        />
    </div>
    
    <!-- SPF Records and Analysis -->
    <div class="mb-8">
        <SectionHeader id="spf" title="SPF - Sender Policy Framework" />
        
        <SPFAnalyzer
            txtRecords={domain.toolState.email.data?.txt}
            variant="detailed"
        />

        <div class="mt-4">
            <SpfLookupBudget
                domain={domain.rootDomain || domain.name}
                hasSpf={(domain.toolState.email.data?.spf?.length ?? 0) > 0}
            />
        </div>
    </div>

    <!-- DMARC Records and Analysis -->
    <div class="mb-8">
        <SectionHeader id="dmarc" title="DMARC - Domain-based Message Authentication" />
        
        <DMARCAnalyzer
            dmarcRecords={domain.toolState.email.data?.dmarc}
            variant="detailed"
        />
    </div>

    <!-- MTA-STS Records and Analysis -->
    <div class="mb-8">
        <SectionHeader id="mta-sts" title="MTA-STS - Mail Transfer Agent Strict Transport Security" />
        
        <MTASTSAnalyzer
            mtaStsRecords={domain.toolState.email.data?.mtaSts}
            variant="detailed"
        />
    </div>

    <!-- BIMI Records and Analysis -->
    <div class="mb-8">
        <SectionHeader id="bimi" title="BIMI - Brand Indicators for Message Identification" />
        
        <BIMIAnalyzer
            bimiRecords={domain.toolState.email.data?.bimi}
            variant="detailed"
        />
    </div>

</ToolPage>
