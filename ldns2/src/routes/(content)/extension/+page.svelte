<script lang="ts">
    import { Globe, Shield, Mail, Server, Moon, History, Search, Zap } from "lucide-svelte";
    import SEO from "$lib/components/SEO.svelte";
    import { SiGooglechrome, SiFirefoxbrowser } from "@icons-pack/svelte-simple-icons";

    const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn";
    const FIREFOX_AMO_URL = "https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/";

    const features = [
        {
            icon: Globe,
            title: "DNS Records",
            description: "Look up A, AAAA, MX, TXT, NS, SOA, CAA, DNSKEY, and more record types instantly."
        },
        {
            icon: Search,
            title: "WHOIS/RDAP",
            description: "Domain registration data with WHOIS fallback for ccTLDs that don't support RDAP."
        },
        {
            icon: Mail,
            title: "Email Security",
            description: "Analyze SPF, DMARC, MTA-STS, and BIMI records with provider detection."
        },
        {
            icon: Server,
            title: "Server Info",
            description: "HTTP headers, redirect tracing, and response analysis for any domain."
        },
        {
            icon: Zap,
            title: "Multiple DNS Providers",
            description: "Choose between Cloudflare, Google, and DNS.SB for DNS-over-HTTPS queries."
        },
        {
            icon: Moon,
            title: "Dark & Light Themes",
            description: "Switch between dark and light themes to match your preference."
        },
        {
            icon: History,
            title: "Recent Searches",
            description: "Quick access to your last 10 domain lookups, stored locally."
        },
        {
            icon: Shield,
            title: "Privacy Focused",
            description: "No data collection, no tracking. All queries go directly to public DNS services."
        }
    ];
</script>

<SEO
    title="Browser Extension | LDNS"
    description="Get the LDNS browser extension for Chrome and Firefox. Instant DNS lookups, WHOIS data, email security analysis, and more - right from your browser toolbar."
/>

<div class="max-w-4xl mx-auto px-4">
    <!-- Hero Section -->
    <header class="text-center mb-16">
        <h1 class="text-5xl font-bold text-white mb-4">
            LDNS Browser Extension
        </h1>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Instant DNS lookups, WHOIS data, and email security analysis - right from your browser toolbar.
        </p>

        <!-- Install Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
                <SiGooglechrome size={20} />
                <span>Add to Chrome</span>
            </a>
            <a
                href={FIREFOX_AMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
                <SiFirefoxbrowser size={20} />
                <span>Add to Firefox</span>
            </a>
        </div>
    </header>

    <!-- Features Section -->
    <section class="mb-16">
        <h2 class="text-3xl font-bold text-white mb-8 text-center">
            Features
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each features as feature}
                <div class="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <feature.icon class="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-1">
                            {feature.title}
                        </h3>
                        <p class="text-gray-400 text-sm">
                            {feature.description}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Privacy Section -->
    <section class="mb-16">
        <div class="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <div class="flex items-start gap-4">
                <Shield class="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                    <h2 class="text-2xl font-bold text-white mb-3">
                        Privacy First
                    </h2>
                    <ul class="space-y-2 text-gray-300">
                        <li class="flex items-center gap-2">
                            <span class="text-green-400">&#10003;</span>
                            No data collection or analytics
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="text-green-400">&#10003;</span>
                            No tracking or telemetry
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="text-green-400">&#10003;</span>
                            All queries go directly to public DNS services
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="text-green-400">&#10003;</span>
                            Recent searches stored locally only
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="text-green-400">&#10003;</span>
                            Open source and transparent
                        </li>
                    </ul>
                    <a
                        href="/extension/privacy"
                        class="inline-block mt-4 text-primary-400 hover:text-primary-300 text-sm"
                    >
                        Read full privacy policy &rarr;
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works -->
    <section class="mb-16">
        <h2 class="text-3xl font-bold text-white mb-8 text-center">
            How It Works
        </h2>
        <div class="space-y-4 text-gray-300">
            <div class="flex items-start gap-4">
                <span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white font-bold flex-shrink-0">1</span>
                <div>
                    <h3 class="text-lg font-semibold text-white">Click the extension icon</h3>
                    <p class="text-gray-400">The current tab's domain is automatically detected and loaded.</p>
                </div>
            </div>
            <div class="flex items-start gap-4">
                <span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white font-bold flex-shrink-0">2</span>
                <div>
                    <h3 class="text-lg font-semibold text-white">View DNS records instantly</h3>
                    <p class="text-gray-400">See all DNS records, WHOIS data, and email configuration in organized tabs.</p>
                </div>
            </div>
            <div class="flex items-start gap-4">
                <span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white font-bold flex-shrink-0">3</span>
                <div>
                    <h3 class="text-lg font-semibold text-white">Look up any domain</h3>
                    <p class="text-gray-400">Type any domain to analyze it, or select from your recent searches.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="text-center mb-8">
        <div class="p-8 bg-gradient-to-r from-primary-900/50 to-primary-800/50 rounded-lg border border-primary-700">
            <h2 class="text-2xl font-bold text-white mb-4">
                Ready to get started?
            </h2>
            <p class="text-gray-300 mb-6">
                Install the extension and start looking up DNS records in seconds.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                    <SiGooglechrome size={20} />
                    <span>Chrome Web Store</span>
                </a>
                <a
                    href={FIREFOX_AMO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                    <SiFirefoxbrowser size={20} />
                    <span>Firefox Add-ons</span>
                </a>
            </div>
        </div>
    </section>
</div>
