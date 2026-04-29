<script lang="ts">
    import { Globe, GitBranch, Rocket, Mail, ArrowDown } from "lucide-svelte";
    import SEO from "$lib/components/SEO.svelte";
</script>

<SEO 
    title="About | LDNS.com" 
    description="LDNS is a free DNS lookup and domain analysis tool that runs entirely in your browser. Perform DNS queries, RDAP lookups, email configuration analysis, and security assessments."
/>

<div class="max-w-4xl mx-auto px-4">
    <!-- Hero Section -->
    <header class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About LDNS
        </h1>
        <p class="text-xl text-white dark:text-white max-w-2xl mx-auto">
            A comprehensive, client-side DNS lookup and domain analysis tool that runs entirely in your browser with no backend dependencies.
        </p>
    </header>

    <!-- Features Section -->
    <section class="mb-16">
        <h2 class="text-3xl font-bold text-white dark:text-white mb-8 text-center">
            What LDNS Offers
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div class="flex items-start gap-4">
                <Globe class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="text-lg font-semibold text-primary-300 dark:text-primary-300 mb-2">
                        DNS Records Analysis
                    </h3>
                    <p class="text-white dark:text-white text-sm">
                        Complete DNS lookup with clickable record filtering, export capabilities, and real-time validation.
                    </p>
                </div>
            </div>

            <div class="flex items-start gap-4">
                <Mail class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="text-lg font-semibold text-primary-300 dark:text-primary-300 mb-2">
                        Email Security Checker
                    </h3>
                    <p class="text-white dark:text-white text-sm">
                        SPF, DMARC, MTA-STS, and BIMI analysis with provider detection and security recommendations.
                    </p>
                </div>
            </div>

            <div class="flex items-start gap-4">
                <GitBranch class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="text-lg font-semibold text-primary-300 dark:text-primary-300 mb-2">
                        RDAP Lookup
                    </h3>
                    <p class="text-white dark:text-white text-sm">
                        Domain registration info, DNSSEC status, registrar details, and expiration tracking.
                    </p>
                </div>
            </div>


            <div class="flex items-start gap-4">
                <ArrowDown class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="text-lg font-semibold text-primary-300 dark:text-primary-300 mb-2">
                        Export & Share
                    </h3>
                    <p class="text-white dark:text-white text-sm">
                        Export data as JSON, CSV, BIND zone files, or generate PDF reports for documentation.
                    </p>
                </div>
            </div>

            <div class="flex items-start gap-4">
                <Rocket class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 class="text-lg font-semibold text-primary-300 dark:text-primary-300 mb-2">
                        100% Client-Side
                    </h3>
                    <p class="text-white dark:text-white text-sm">
                        No backend servers - everything runs in your browser with Cloudflare DNS over HTTPS.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- How to Use Section -->
    <section class="mb-16">
        <h2 class="text-3xl font-bold text-white dark:text-white mb-8 text-center">
            How to Use LDNS
        </h2>
        <div class="space-y-6 text-white dark:text-white">
            <div>
                <h3 class="text-xl font-semibold text-primary-300 dark:text-primary-300 mb-3">
                    DNS Analysis
                </h3>
                <p class="mb-2">
                    Enter a domain name in the search bar on the homepage, or navigate directly to:
                </p>
                <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm mb-2">
                    <span>ldns.com/ldns.com</span>
                    <a href="/ldns.com" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                </code>
                <p class="mb-3">View all DNS records with micro cards summary, clickable filtering, and export options (JSON, CSV, BIND zone files, PDF).</p>
                
                <p class="mb-2 text-white dark:text-white">
                    Features include:
                </p>
                <ul class="list-disc list-inside text-sm text-gray-300 space-y-1 mb-3">
                    <li>Clickable record type cards for instant filtering</li>
                    <li>Real-time record validation and error detection</li>
                    <li>Export to multiple formats including PDF reports</li>
                    <li>Direct links to specific record types</li>
                </ul>
            </div>

            <div>
                <h3 class="text-xl font-semibold text-primary-300 dark:text-primary-300 mb-3">
                    RDAP/WHOIS Data
                </h3>
                <p class="mb-2">
                    Get comprehensive domain registration information at:
                </p>
                <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm mb-2">
                    <span>ldns.com/ldns.com/rdap</span>
                    <a href="/ldns.com/rdap" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                </code>
                <p class="mb-3">Includes micro cards summary showing domain age, expiration countdown, registrar, and DNSSEC status with detailed explanations.</p>
                
                <p class="mb-2 text-white dark:text-white">
                    Key features:
                </p>
                <ul class="list-disc list-inside text-sm text-gray-300 space-y-1 mb-3">
                    <li>Domain age calculator and expiration tracking</li>
                    <li>DNSSEC status with DS record analysis</li>
                    <li>Status code explanations (RFC 7483 compliant)</li>
                    <li>Registrar and nameserver information</li>
                </ul>
            </div>

            <div>
                <h3 class="text-xl font-semibold text-primary-300 dark:text-primary-300 mb-3">
                    Email Security Analysis
                </h3>
                <p class="mb-2">
                    Comprehensive email configuration and security analysis at:
                </p>
                <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm mb-2">
                    <span>ldns.com/ldns.com/email</span>
                    <a href="/ldns.com/email" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                </code>
                <p class="mb-3">Features detailed analysis of all email security protocols with validation and recommendations.</p>
                
                <p class="mb-2 text-white dark:text-white">
                    Analyzes:
                </p>
                <ul class="list-disc list-inside text-sm text-gray-300 space-y-1 mb-3">
                    <li><strong>SPF</strong> - Sender Policy Framework validation and mechanism analysis</li>
                    <li><strong>DMARC</strong> - Policy validation and tag-by-tag breakdown</li>
                    <li><strong>MTA-STS</strong> - Mail Transfer Agent Strict Transport Security</li>
                    <li><strong>BIMI</strong> - Brand Indicators for Message Identification</li>
                    <li><strong>Email Provider Detection</strong> - Automatic MX provider identification</li>
                </ul>
            </div>

            <div>
                <h3 class="text-xl font-semibold text-primary-300 dark:text-primary-300 mb-3">
                    Deep Links
                </h3>
                <p class="mb-2">
                    You can link directly to specific sections using hash fragments:
                </p>
                <div class="space-y-2">
                    <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm">
                        <span>ldns.com/ldns.com#mx</span>
                        <a href="/ldns.com#mx" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                    </code>
                    <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm">
                        <span>ldns.com/ldns.com/rdap#summary</span>
                        <a href="/ldns.com/rdap#summary" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                    </code>
                    <code class="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm">
                        <span>ldns.com/ldns.com/email#spf</span>
                        <a href="/ldns.com/email#spf" class="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors">Try it</a>
                    </code>
                </div>
                <p class="text-sm text-gray-400 mt-2">
                    These links will automatically scroll to the specific section after page load.
                </p>
            </div>
        </div>
    </section>
</div>