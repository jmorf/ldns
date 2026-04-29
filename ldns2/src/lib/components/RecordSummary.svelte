<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    
    interface Props {
        dnsData: any;
        variant?: "compact" | "detailed";
        onRecordClick?: (recordType: string) => void;
    }

    let { dnsData, variant = "detailed", onRecordClick }: Props = $props();

    // Define color mapping for different record types
    const recordTypeColors = {
        A: "blue",
        AAAA: "indigo", 
        CNAME: "purple",
        MX: "pink",
        TXT: "green",
        NS: "yellow",
        SOA: "red",
        SRV: "purple",
        PTR: "gray",
        CAA: "orange",
        DNSKEY: "lime",
        DS: "amber",
        RRSIG: "emerald",
        NSEC: "teal",
        NSEC3: "indigo",
        TLSA: "violet",
        SSHFP: "rose",
        DMARC: "fuchsia",
        SPF: "emerald"
    } as const;

    // Get summary of all record types and counts
    const recordSummary = $derived(() => {
        if (!dnsData) return [];
        
        const summary: Array<{type: string, count: number, color: "blue" | "green" | "red" | "yellow" | "orange" | "purple" | "gray" | "indigo" | "pink" | "amber" | "lime" | "emerald" | "teal" | "violet" | "fuchsia" | "rose"}> = [];
        
        Object.keys(dnsData).forEach(recordType => {
            const records = dnsData[recordType];
            if (Array.isArray(records) && records.length > 0) {
                const color = recordTypeColors[recordType as keyof typeof recordTypeColors] || "gray";
                summary.push({
                    type: recordType,
                    count: records.length,
                    color: color as "blue" | "green" | "red" | "yellow" | "orange" | "purple" | "gray" | "indigo" | "pink" | "amber" | "lime" | "emerald" | "teal" | "violet" | "fuchsia" | "rose"
                });
            }
        });
        
        // Sort by priority: critical records first, then alphabetically
        const priorityOrder = ['SOA', 'NS', 'A', 'AAAA', 'MX', 'CNAME', 'TXT'];
        return summary.sort((a, b) => {
            const aPriority = priorityOrder.indexOf(a.type);
            const bPriority = priorityOrder.indexOf(b.type);
            
            if (aPriority !== -1 && bPriority !== -1) {
                return aPriority - bPriority;
            } else if (aPriority !== -1) {
                return -1;
            } else if (bPriority !== -1) {
                return 1;
            } else {
                return a.type.localeCompare(b.type);
            }
        });
    });

    // Calculate total records
    const totalRecords = $derived(() => {
        return recordSummary().reduce((total: number, item: any) => total + item.count, 0);
    });

    // Get record type description
    function getRecordDescription(type: string): string {
        const descriptions = {
            A: "IPv4 address records",
            AAAA: "IPv6 address records", 
            CNAME: "Canonical name aliases",
            MX: "Mail exchange servers",
            TXT: "Text records (SPF, DKIM, etc.)",
            NS: "Name server records",
            SOA: "Start of authority",
            SRV: "Service location records",
            PTR: "Pointer records",
            CAA: "Certificate authority authorization",
            DNSKEY: "DNS public keys",
            DS: "Delegation signer records",
            RRSIG: "Resource record signatures",
            NSEC: "Next secure records",
            NSEC3: "Next secure v3 records",
            TLSA: "TLS association records",
            SSHFP: "SSH fingerprint records",
            DMARC: "DMARC policy records",
            SPF: "Sender policy framework"
        };
        return descriptions[type as keyof typeof descriptions] || `${type} records`;
    }
</script>

<div class="record-summary">
    {#if variant === "compact"}
        <!-- Compact view - just badges -->
        <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm text-gray-300 font-medium">Records:</span>
            {#each recordSummary() as record (record.type)}
                <Badge variant={record.color} class="text-xs">
                    {record.type} ({record.count})
                </Badge>
            {/each}
            <span class="text-xs text-gray-400 ml-2">
                Total: {totalRecords()}
            </span>
        </div>
    {:else}
        <!-- Mobile view - compact summary -->
        <div class="sm:hidden">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-base font-semibold text-white">DNS Summary</h3>
                <Badge variant="gray" class="text-xs">
                    {totalRecords()} records
                </Badge>
            </div>
            <div class="flex flex-wrap gap-1">
                {#each recordSummary().slice(0, 6) as record (record.type)}
                    {#if onRecordClick}
                        <button
                            onclick={() => onRecordClick(record.type)}
                            type="button"
                            class="cursor-pointer"
                        >
                            <Badge variant={record.color} class="text-xs hover:opacity-80 transition-opacity">
                                {record.type} ({record.count})
                            </Badge>
                        </button>
                    {:else}
                        <Badge variant={record.color} class="text-xs">
                            {record.type} ({record.count})
                        </Badge>
                    {/if}
                {/each}
                {#if recordSummary().length > 6}
                    <span class="text-xs text-gray-400">+{recordSummary().length - 6} more</span>
                {/if}
            </div>
        </div>
        
        <!-- Desktop view - full micro cards -->
        <div class="hidden sm:block space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">DNS Records Summary</h3>
                <Badge variant="gray" class="text-xs">
                    {totalRecords()} total records
                </Badge>
            </div>
            
            {#if recordSummary().length === 0}
                <div class="text-gray-400 text-sm italic">
                    No DNS records found
                </div>
            {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {#each recordSummary() as record (record.type)}
                        {#if onRecordClick}
                            <button 
                                class="bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer hover:bg-gray-700 hover:border-gray-600 transition-colors w-full text-left"
                                onclick={() => onRecordClick(record.type)}
                                type="button"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <Badge variant={record.color} class="text-sm font-medium">
                                        {record.type}
                                    </Badge>
                                    <span class="text-lg font-bold text-white">
                                        {record.count}
                                    </span>
                                </div>
                                <p class="text-xs text-gray-400">
                                    {getRecordDescription(record.type)}
                                    <span class="block mt-1 text-xs text-gray-500">Click to filter</span>
                                </p>
                            </button>
                        {:else}
                            <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                <div class="flex items-center justify-between mb-2">
                                    <Badge variant={record.color} class="text-sm font-medium">
                                        {record.type}
                                    </Badge>
                                    <span class="text-lg font-bold text-white">
                                        {record.count}
                                    </span>
                                </div>
                                <p class="text-xs text-gray-400">
                                    {getRecordDescription(record.type)}
                                </p>
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>