<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import { Info, CheckCircle, AlertCircle } from 'lucide-svelte';
    
    interface Props {
        statuses?: string[];
        variant?: "compact" | "detailed";
    }

    let { statuses = [], variant = "detailed" }: Props = $props();

    // RDAP status code definitions from RFC 7483
    const statusDefinitions = {
        // Registration status
        'active': {
            description: 'The domain is active and properly registered',
            category: 'Registration',
            severity: 'good',
            details: 'Domain is in good standing and operational'
        },
        'inactive': {
            description: 'The domain is inactive or suspended',
            category: 'Registration', 
            severity: 'warning',
            details: 'Domain may not resolve or may have limited functionality'
        },
        'locked': {
            description: 'The domain is locked to prevent unauthorized changes',
            category: 'Security',
            severity: 'good',
            details: 'Registrar lock or registry lock is in place for security'
        },
        'pending create': {
            description: 'The domain registration is pending creation',
            category: 'Registration',
            severity: 'neutral',
            details: 'Registration process is in progress'
        },
        'pending delete': {
            description: 'The domain is pending deletion',
            category: 'Registration',
            severity: 'critical',
            details: 'Domain will be deleted unless action is taken'
        },
        'pending restore': {
            description: 'The domain is pending restoration from deleted status',
            category: 'Registration',
            severity: 'warning',
            details: 'Domain was deleted but may be recoverable'
        },
        'pending transfer': {
            description: 'The domain transfer is pending',
            category: 'Registration',
            severity: 'neutral',
            details: 'Domain ownership transfer is in progress'
        },
        'pending update': {
            description: 'The domain information update is pending',
            category: 'Registration',
            severity: 'neutral',
            details: 'Domain record updates are being processed'
        },
        'redemption period': {
            description: 'The domain is in redemption period after expiration',
            category: 'Registration',
            severity: 'critical',
            details: 'Domain expired and must be renewed at higher cost'
        },
        'renew prohibited': {
            description: 'The domain renewal is prohibited',
            category: 'Restriction',
            severity: 'critical',
            details: 'Domain cannot be renewed by the current registrant'
        },
        'transfer prohibited': {
            description: 'The domain transfer is prohibited',
            category: 'Restriction',
            severity: 'warning',
            details: 'Domain cannot be transferred to another registrar'
        },
        'update prohibited': {
            description: 'The domain information cannot be updated',
            category: 'Restriction',
            severity: 'warning',
            details: 'Domain records cannot be modified'
        },
        'delete prohibited': {
            description: 'The domain cannot be deleted',
            category: 'Security',
            severity: 'good',
            details: 'Domain is protected from accidental deletion'
        },
        'client delete prohibited': {
            description: 'Client (registrar) cannot delete the domain',
            category: 'Security',
            severity: 'good',
            details: 'Registrar-level deletion protection is active'
        },
        'client hold': {
            description: 'Client (registrar) has placed a hold on the domain',
            category: 'Restriction',
            severity: 'warning',
            details: 'Registrar has suspended domain for policy violations'
        },
        'client renew prohibited': {
            description: 'Client (registrar) cannot renew the domain',
            category: 'Restriction',
            severity: 'critical',
            details: 'Registrar is prohibited from renewing this domain'
        },
        'client transfer prohibited': {
            description: 'Client (registrar) has prohibited transfers',
            category: 'Security',
            severity: 'good',
            details: 'Registrar-level transfer lock for security'
        },
        'client update prohibited': {
            description: 'Client (registrar) cannot update domain information',
            category: 'Restriction',
            severity: 'warning',
            details: 'Registrar is prohibited from updating domain records'
        },
        'server delete prohibited': {
            description: 'Registry server prohibits domain deletion',
            category: 'Security',
            severity: 'good',
            details: 'Registry-level deletion protection is active'
        },
        'server hold': {
            description: 'Registry server has placed a hold on the domain',
            category: 'Restriction',
            severity: 'critical',
            details: 'Registry has suspended domain, likely for legal/policy reasons'
        },
        'server renew prohibited': {
            description: 'Registry server prohibits domain renewal',
            category: 'Restriction',
            severity: 'critical',
            details: 'Registry prevents renewal, often due to policy violations'
        },
        'server transfer prohibited': {
            description: 'Registry server prohibits domain transfers',
            category: 'Security',
            severity: 'good',
            details: 'Registry-level transfer protection is active'
        },
        'server update prohibited': {
            description: 'Registry server prohibits domain updates',
            category: 'Restriction',
            severity: 'warning',
            details: 'Registry prevents updates to domain information'
        }
    } as const;

    // Get status info with fallback for unknown statuses
    function getStatusInfo(status: string) {
        const normalizedStatus = status.toLowerCase().trim();
        return statusDefinitions[normalizedStatus as keyof typeof statusDefinitions] || {
            description: `Unknown status: ${status}`,
            category: 'Unknown',
            severity: 'neutral' as const,
            details: 'This status code is not defined in RFC 7483'
        };
    }

    // Get badge color based on severity
    function getSeverityColor(severity: string) {
        switch (severity) {
            case 'good': return 'green';
            case 'warning': return 'yellow';
            case 'critical': return 'red';
            case 'neutral': return 'blue';
            default: return 'gray';
        }
    }

    // Get icon based on severity
    function getSeverityIcon(severity: string) {
        switch (severity) {
            case 'good': return CheckCircle;
            case 'warning': return AlertCircle;
            case 'critical': return AlertCircle;
            default: return Info;
        }
    }

    // Group statuses by category
    const groupedStatuses = $derived(() => {
        const groups: Record<string, Array<{status: string, info: any}>> = {};
        
        statuses.forEach(status => {
            const info = getStatusInfo(status);
            if (!groups[info.category]) {
                groups[info.category] = [];
            }
            groups[info.category].push({ status, info });
        });
        
        return groups;
    });

    // Get overall status assessment
    const overallAssessment = $derived(() => {
        if (statuses.length === 0) return { level: 'Unknown', color: 'gray' as const, message: 'No status information available' };
        
        const hasCritical = statuses.some(s => getStatusInfo(s).severity === 'critical');
        const hasWarning = statuses.some(s => getStatusInfo(s).severity === 'warning');
        const hasGood = statuses.some(s => getStatusInfo(s).severity === 'good');
        
        if (hasCritical) {
            return { level: 'Critical Issues', color: 'red' as const, message: 'Domain has critical status issues requiring immediate attention' };
        } else if (hasWarning) {
            return { level: 'Warning', color: 'yellow' as const, message: 'Domain has some restrictions or limitations' };
        } else if (hasGood) {
            return { level: 'Protected', color: 'green' as const, message: 'Domain has good security protections in place' };
        } else {
            return { level: 'Neutral', color: 'blue' as const, message: 'Domain has standard registration status' };
        }
    });
</script>

{#if statuses.length > 0}
    {#if variant === "compact"}
        <!-- Compact view -->
        <div class="flex items-center gap-2">
            <Info class="w-4 h-4 text-blue-400" />
            <div class="flex flex-wrap gap-1">
                {#each statuses as status}
                    {@const info = getStatusInfo(status)}
                    <Badge variant={getSeverityColor(info.severity)} class="text-xs" title={info.description}>
                        {status}
                    </Badge>
                {/each}
            </div>
        </div>
    {:else}
        <!-- Detailed view -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center gap-2 mb-3">
                <Info class="w-5 h-5 text-blue-400" />
                <h3 class="text-lg font-semibold text-white">Domain Status Codes</h3>
                <Badge variant={overallAssessment().color} class="text-sm">
                    {overallAssessment().level}
                </Badge>
            </div>
            
            <div class="space-y-4">
                <!-- Overall assessment -->
                <div class="bg-gray-900 rounded p-3">
                    <div class="text-sm font-medium text-white mb-1">Overall Assessment</div>
                    <div class="text-sm text-gray-300">{overallAssessment().message}</div>
                </div>

                <!-- Status codes grouped by category -->
                {#each Object.entries(groupedStatuses()) as [category, statusList]}
                    <div class="space-y-2">
                        <h4 class="text-md font-medium text-white border-b border-gray-600 pb-1">
                            {category} Status
                        </h4>
                        
                        <div class="space-y-2">
                            {#each statusList as { status, info }}
                                {@const SeverityIcon = getSeverityIcon(info.severity)}
                                <div class="bg-gray-900 rounded p-3">
                                    <div class="flex items-start gap-3">
                                        <SeverityIcon class="w-5 h-5 text-{getSeverityColor(info.severity)}-400 mt-0.5 flex-shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 mb-1">
                                                <code class="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-blue-300">
                                                    {status}
                                                </code>
                                                <Badge variant={getSeverityColor(info.severity)} class="text-xs">
                                                    {info.severity.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div class="text-sm text-white font-medium mb-1">
                                                {info.description}
                                            </div>
                                            <div class="text-xs text-gray-400">
                                                {info.details}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}

                <!-- Status legend -->
                <div class="bg-gray-900 rounded p-3">
                    <div class="text-sm font-medium text-white mb-2">Status Severity Legend</div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div class="flex items-center gap-1">
                            <CheckCircle class="w-4 h-4 text-green-400" />
                            <Badge variant="green" class="text-xs">Good</Badge>
                        </div>
                        <div class="flex items-center gap-1">
                            <Info class="w-4 h-4 text-blue-400" />
                            <Badge variant="blue" class="text-xs">Neutral</Badge>
                        </div>
                        <div class="flex items-center gap-1">
                            <AlertCircle class="w-4 h-4 text-yellow-400" />
                            <Badge variant="yellow" class="text-xs">Warning</Badge>
                        </div>
                        <div class="flex items-center gap-1">
                            <AlertCircle class="w-4 h-4 text-red-400" />
                            <Badge variant="red" class="text-xs">Critical</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{:else}
    <!-- No status codes available -->
    {#if variant === "compact"}
        <div class="flex items-center gap-2">
            <Info class="w-4 h-4 text-gray-500" />
            <span class="text-xs text-gray-500">No status codes</span>
        </div>
    {:else}
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center gap-2 mb-2">
                <Info class="w-5 h-5 text-gray-500" />
                <h3 class="text-lg font-semibold text-white">Domain Status Codes</h3>
            </div>
            <div class="text-gray-400 text-sm">
                No status codes available in RDAP data
            </div>
        </div>
    {/if}
{/if}