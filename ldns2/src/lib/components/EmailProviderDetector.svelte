<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import { Mail, Building, Globe } from 'lucide-svelte';
    import CopyButton from "./CopyButton.svelte";
    import CustomBadge from "./Badge.svelte";
    
    interface Props {
        mxRecords?: any[];
        variant?: "compact" | "detailed";
    }

    let { mxRecords = [], variant = "detailed" }: Props = $props();

    // Email provider detection patterns
    const providerPatterns = [
        // Google Workspace / Gmail
        {
            name: "Google Workspace",
            patterns: [
                /gmail-smtp-in\.l\.google\.com$/i,
                /aspmx\.l\.google\.com$/i,
                /alt\d+\.aspmx\.l\.google\.com$/i,
                /aspmx\d+\.googlemail\.com$/i
            ],
            type: "cloud",
            website: "workspace.google.com",
            features: ["High deliverability", "Advanced security", "Large storage", "Mobile apps"],
            popularity: "high"
        },
        // Microsoft 365 / Outlook
        {
            name: "Microsoft 365",
            patterns: [
                /\.mail\.protection\.outlook\.com$/i,
                /\.outlook\.com$/i,
                /\.hotmail\.com$/i
            ],
            type: "cloud",
            website: "office.com",
            features: ["Office integration", "Advanced threat protection", "Compliance tools", "Teams integration"],
            popularity: "high"
        },
        // Amazon SES
        {
            name: "Amazon SES",
            patterns: [
                /\.amazonaws\.com$/i,
                /inbound-smtp\..*\.amazonaws\.com$/i
            ],
            type: "cloud",
            website: "aws.amazon.com/ses",
            features: ["High volume sending", "API integration", "Cost effective", "Analytics"],
            popularity: "medium"
        },
        // SendGrid
        {
            name: "SendGrid",
            patterns: [
                /sendgrid\.net$/i,
                /sendgrid\.com$/i
            ],
            type: "service",
            website: "sendgrid.com",
            features: ["Transactional emails", "Marketing campaigns", "Analytics", "API-first"],
            popularity: "medium"
        },
        // Mailgun
        {
            name: "Mailgun",
            patterns: [
                /mailgun\.org$/i,
                /\.mailgun\.org$/i
            ],
            type: "service",
            website: "mailgun.com",
            features: ["Developer-focused", "Email validation", "Analytics", "Routing"],
            popularity: "medium"
        },
        // Zoho Mail
        {
            name: "Zoho Mail",
            patterns: [
                /mx\.zoho\.com$/i,
                /mx\d+\.zoho\.com$/i,
                /zoho\.com$/i
            ],
            type: "cloud",
            website: "zoho.com/mail",
            features: ["Business email", "Calendar", "Contacts", "Notes"],
            popularity: "medium"
        },
        // ProtonMail
        {
            name: "ProtonMail",
            patterns: [
                /mail\.protonmail\.ch$/i,
                /protonmail\.com$/i
            ],
            type: "cloud",
            website: "protonmail.com",
            features: ["End-to-end encryption", "Privacy focused", "Secure", "Anonymous"],
            popularity: "low"
        },
        // Fastmail
        {
            name: "Fastmail",
            patterns: [
                /fastmail\.com$/i,
                /messagingengine\.com$/i
            ],
            type: "cloud",
            website: "fastmail.com",
            features: ["Fast performance", "JMAP support", "Custom domains", "Privacy focused"],
            popularity: "low"
        },
        // Cloudflare Email
        {
            name: "Cloudflare Email",
            patterns: [
                /route\.mx\.cloudflare\.net$/i,
                /cloudflare\.net$/i
            ],
            type: "service",
            website: "cloudflare.com",
            features: ["Email routing", "Security", "Performance", "Free tier"],
            popularity: "medium"
        },
        // Generic hosting providers
        {
            name: "cPanel/WHM",
            patterns: [
                /.*\.hostgator\.com$/i,
                /.*\.bluehost\.com$/i,
                /.*\.godaddy\.com$/i,
                /.*\.inmotionhosting\.com$/i,
                /.*\.siteground\.com$/i,
                /.*\.hostinger\.com$/i,
                /.*\.a2hosting\.com$/i,
                /mail\.\w+\.(net|org|info)$/i, // More specific pattern for mail servers
                /mx\d+\.\w+\.(net|org|info)$/i // Numbered MX servers for smaller hosts
            ],
            type: "hosting",
            website: "cpanel.net",
            features: ["Shared hosting", "Basic features", "Web interface", "POP/IMAP"],
            popularity: "medium"
        }
    ];

    // Analyze MX records to detect providers
    const providerAnalysis = $derived(() => {
        if (!mxRecords || mxRecords.length === 0) {
            return {
                providers: [],
                primaryProvider: null,
                confidence: 0,
                setup: 'none',
                redundancy: false
            };
        }

        const detectedProviders: Array<{
            name: string;
            type: string;
            website: string;
            features: string[];
            popularity: string;
            matchedRecords: string[];
            priority: number[];
            confidence: number;
        }> = [];

        // Check each MX record against provider patterns
        mxRecords.forEach(record => {
            const mxHost = record.data.split(' ').slice(1).join(' ').toLowerCase(); // Remove priority
            
            providerPatterns.forEach(provider => {
                const isMatch = provider.patterns.some(pattern => pattern.test(mxHost));
                
                if (isMatch) {
                    const existingProvider = detectedProviders.find(p => p.name === provider.name);
                    const priority = parseInt(record.data.split(' ')[0]) || 0;
                    
                    if (existingProvider) {
                        existingProvider.matchedRecords.push(mxHost);
                        existingProvider.priority.push(priority);
                        existingProvider.confidence += 20;
                    } else {
                        detectedProviders.push({
                            ...provider,
                            matchedRecords: [mxHost],
                            priority: [priority],
                            confidence: 50
                        });
                    }
                }
            });
        });

        // If no known providers detected, try to infer from domain patterns
        if (detectedProviders.length === 0) {
            const unknownProviders = mxRecords.map(record => {
                const mxHost = record.data.split(' ').slice(1).join(' ').toLowerCase();
                const priority = parseInt(record.data.split(' ')[0]) || 0;
                
                return {
                    name: "Unknown Provider",
                    type: "unknown",
                    website: "",
                    features: ["Custom setup"],
                    popularity: "unknown",
                    matchedRecords: [mxHost],
                    priority: [priority],
                    confidence: 30
                };
            });
            
            detectedProviders.push(...unknownProviders);
        }

        // Sort by confidence and priority
        detectedProviders.sort((a, b) => {
            const aMinPriority = Math.min(...a.priority);
            const bMinPriority = Math.min(...b.priority);
            
            if (aMinPriority !== bMinPriority) {
                return aMinPriority - bMinPriority;
            }
            
            return b.confidence - a.confidence;
        });

        const primaryProvider = detectedProviders[0] || null;
        const hasRedundancy = mxRecords.length > 1;
        
        let setup = 'unknown';
        if (primaryProvider) {
            if (primaryProvider.type === 'cloud') setup = 'cloud';
            else if (primaryProvider.type === 'service') setup = 'service';
            else if (primaryProvider.type === 'hosting') setup = 'hosting';
            else setup = 'custom';
        }

        return {
            providers: detectedProviders,
            primaryProvider,
            confidence: primaryProvider?.confidence || 0,
            setup,
            redundancy: hasRedundancy
        };
    });

    // Get setup description
    function getSetupDescription(setup: string): string {
        switch (setup) {
            case 'cloud': return 'Cloud-based email service';
            case 'service': return 'Email delivery service';
            case 'hosting': return 'Web hosting email';
            case 'custom': return 'Custom email setup';
            case 'none': return 'No email configured';
            default: return 'Unknown configuration';
        }
    }

    // Get setup color
    function getSetupColor(setup: string): "green" | "blue" | "yellow" | "red" | "gray" {
        switch (setup) {
            case 'cloud': return 'green';
            case 'service': return 'blue';
            case 'hosting': return 'yellow';
            case 'custom': return 'gray';
            case 'none': return 'red';
            default: return 'gray';
        }
    }

    // Get popularity color
    function getPopularityColor(popularity: string): "green" | "blue" | "yellow" | "gray" {
        switch (popularity) {
            case 'high': return 'green';
            case 'medium': return 'blue';
            case 'low': return 'yellow';
            default: return 'gray';
        }
    }
</script>

{#if variant === "compact"}
    <!-- Compact view -->
    <div class="flex items-center gap-2">
        <Mail class="w-4 h-4 text-blue-400" />
        {#if providerAnalysis().primaryProvider}
            <Badge variant={getSetupColor(providerAnalysis().setup)} class="text-xs">
                {providerAnalysis().primaryProvider?.name || 'Unknown'}
            </Badge>
            <span class="text-xs text-fg-muted">
                {mxRecords.length} MX record{mxRecords.length !== 1 ? 's' : ''}
            </span>
        {:else}
            <Badge variant="red" class="text-xs">
                No Email
            </Badge>
        {/if}
    </div>
{:else}
    <!-- Detailed view -->
    <div class="bg-surface-2 rounded-lg p-4 border border-line">
        <div class="flex items-center gap-2 mb-3">
            <Mail class="w-5 h-5 text-blue-400" />
            <h3 class="text-lg font-semibold text-fg">Email Provider Detection</h3>
            {#if providerAnalysis().primaryProvider}
                <Badge variant={getSetupColor(providerAnalysis().setup)} class="text-sm">
                    {getSetupDescription(providerAnalysis().setup)}
                </Badge>
            {:else}
                <Badge variant="red" class="text-sm">
                    No Email Setup
                </Badge>
            {/if}
        </div>

        {#if !providerAnalysis().primaryProvider}
            <!-- No email setup -->
            <div class="text-fg-muted text-sm">
                No MX records found. Email delivery is not configured for this domain.
            </div>
        {:else}
            <div class="space-y-4">
                <!-- Email setup summary -->
                <div class="bg-surface rounded p-3">
                    <div class="text-sm font-medium text-fg mb-2">Email Setup Overview</div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <div class="text-xs text-fg-muted">Primary Provider</div>
                            <div class="text-sm font-semibold text-fg truncate">
                                {providerAnalysis().primaryProvider?.name || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs text-fg-muted">MX Records</div>
                            <div class="text-sm font-semibold text-fg">{mxRecords.length}</div>
                        </div>
                        <div>
                            <div class="text-xs text-fg-muted">Redundancy</div>
                            <div class="text-sm font-semibold text-fg">
                                {providerAnalysis().redundancy ? 'Yes' : 'No'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detected providers -->
                <div class="space-y-3">
                    <h4 class="text-md font-medium text-fg">Detected Email Providers</h4>

                    {#each providerAnalysis().providers as provider, index}
                        <div class="bg-surface rounded p-3">
                            <div class="flex items-start gap-3">
                                {#if provider.type === 'cloud'}
                                    <Globe class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                {:else if provider.type === 'hosting'}
                                    <Building class="w-5 h-5 text-warn-400 mt-0.5 flex-shrink-0" />
                                {:else}
                                    <Mail class="w-5 h-5 text-ok-400 mt-0.5 flex-shrink-0" />
                                {/if}

                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div class="text-fg font-medium">
                                            {provider.name}
                                            {#if index === 0}
                                                <Badge variant="primary" class="text-xs ml-1">Primary</Badge>
                                            {/if}
                                        </div>
                                    </div>

                                    {#if provider.website}
                                        <div class="text-xs text-blue-400 mb-2">
                                            <a href="https://{provider.website}" target="_blank" rel="noopener noreferrer" class="hover:underline">
                                                {provider.website}
                                            </a>
                                        </div>
                                    {/if}

                                    <div class="text-sm text-fg-muted mb-2">
                                        Matched records: {provider.matchedRecords.join(', ')}
                                    </div>

                                    <div class="text-sm text-fg-muted mb-2">
                                        Priority: {provider.priority.join(', ')}
                                    </div>

                                </div>
                            </div>
                        </div>
                    {/each}
                </div>

                <!-- MX Records Table -->
                <div class="space-y-3">
                    <h4 class="text-md font-medium text-fg">MX Records</h4>

                    <div class="bg-surface rounded-lg overflow-hidden">
                        {#if mxRecords && mxRecords.length > 0}
                            <table class="w-full">
                                <thead class="bg-surface-2">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Type</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Data</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">TTL</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-surface divide-y divide-line">
                                    {#each mxRecords as record, index}
                                        <tr class="hover:bg-surface-3 transition-colors">
                                            <td class="px-6 py-4 text-sm text-fg-muted">
                                                <CustomBadge text="MX" color="orange" size="sm" />
                                            </td>
                                            <td class="px-6 py-4 text-base font-medium text-fg break-words">
                                                <span class="font-mono">{record.data}</span>
                                            </td>
                                            <td class="px-6 py-4 text-sm text-fg-muted">
                                                <span class="font-mono">{record.ttl}</span>
                                            </td>
                                            <td class="px-6 py-4 text-sm text-fg-muted">
                                                <CopyButton
                                                    text={record.data}
                                                    size="sm"
                                                    variant="compact"
                                                />
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="p-8 text-center">
                                <p class="text-fg-subtle italic">No MX records found</p>
                            </div>
                        {/if}
                    </div>
                </div>

            </div>
        {/if}
    </div>
{/if}