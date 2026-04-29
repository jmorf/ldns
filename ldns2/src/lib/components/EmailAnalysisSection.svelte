<script lang="ts">
    import Badge from "./Badge.svelte";
    import CopyButton from "./CopyButton.svelte";
    import ExportButton from "./ExportButton.svelte";

    interface EmailRecord {
        data: string;
        ttl: number;
    }

    interface Analysis {
        policy?: string;
        includes?: number;
        providers?: string[];
        mechanisms?: string[];
        percentage?: number;
        subdomainPolicy?: string;
        strictness?: string;
        reportingAddresses?: {
            aggregate?: string[];
        };
    }

    interface Props {
        title: string;
        records: EmailRecord[];
        analysis?: Analysis;
        recordType: string;
        domain?: string;
    }

    let {
        title,
        records,
        analysis,
        recordType,
        domain = "domain"
    }: Props = $props();

    function getPolicyColor(policy: string) {
        switch (policy?.toLowerCase()) {
            case 'fail':
            case 'reject':
                return 'bg-red-900 text-red-200';
            case 'softfail':
            case 'quarantine':
                return 'bg-yellow-900 text-yellow-200';
            default:
                return 'bg-green-900 text-green-200';
        }
    }

    function getStrictnessColor(strictness: string) {
        switch (strictness?.toLowerCase()) {
            case 'high':
                return 'bg-red-900 text-red-200';
            case 'medium':
                return 'bg-yellow-900 text-yellow-200';
            default:
                return 'bg-green-900 text-green-200';
        }
    }
</script>

<div class="bg-gray-900 rounded-lg border border-gray-700">
    <div class="p-6">
        {#if records.length > 0}
            <!-- Records header with export button -->
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-md font-medium text-white">Records</h4>
                <ExportButton 
                    data={records.map(r => ({ type: recordType, ...r }))}
                    filename={`${domain}-${recordType.toLowerCase()}-records`}
                    variant="dropdown"
                    size="sm"
                />
            </div>
            
            <!-- Records table -->
            <div class="mb-6">
                <div class="bg-gray-800 rounded-lg overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-800">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">TTL</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-gray-900 divide-y divide-gray-700">
                            {#each records as record, index}
                                <tr class="hover:bg-gray-800 transition-colors">
                                    <td class="px-6 py-4 text-sm text-gray-300">
                                        <Badge text="TXT" color="yellow" size="sm" />
                                    </td>
                                    <td class="px-6 py-4 text-base font-medium text-white break-words">
                                        <span class="font-mono">{record.data}</span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-300">
                                        <span class="font-mono">{record.ttl}</span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-300">
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
                </div>
            </div>
            
            <!-- Analysis -->
            {#if analysis}
                <div>
                    <h4 class="text-md font-medium text-white mb-3">Analysis</h4>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            {#if analysis.policy}
                                <div>
                                    <span class="text-sm text-gray-400">Policy:</span>
                                    <span class="ml-2 px-2 py-1 rounded text-xs font-medium {getPolicyColor(analysis.policy)}">
                                        {analysis.policy}
                                    </span>
                                </div>
                            {/if}
                            {#if analysis.includes !== undefined}
                                <div>
                                    <span class="text-sm text-gray-400">Includes:</span>
                                    <span class="ml-2 text-white">{analysis.includes}</span>
                                </div>
                            {/if}
                            {#if analysis.percentage !== undefined}
                                <div>
                                    <span class="text-sm text-gray-400">Percentage:</span>
                                    <span class="ml-2 text-white">{analysis.percentage}%</span>
                                </div>
                            {/if}
                            {#if analysis.subdomainPolicy}
                                <div>
                                    <span class="text-sm text-gray-400">Subdomain Policy:</span>
                                    <span class="ml-2 text-white">{analysis.subdomainPolicy}</span>
                                </div>
                            {/if}
                            {#if analysis.strictness}
                                <div>
                                    <span class="text-sm text-gray-400">Strictness:</span>
                                    <span class="ml-2 px-2 py-1 rounded text-xs font-medium {getStrictnessColor(analysis.strictness)}">
                                        {analysis.strictness}
                                    </span>
                                </div>
                            {/if}
                        </div>
                        
                        {#if analysis.providers && analysis.providers.length > 0}
                            <div>
                                <span class="text-sm text-gray-400">Authorized Providers:</span>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    {#each analysis.providers as provider}
                                        <span class="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">{provider}</span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        
                        {#if analysis.mechanisms && analysis.mechanisms.length > 0}
                            <div>
                                <span class="text-sm text-gray-400">Mechanisms:</span>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    {#each analysis.mechanisms as mechanism}
                                        <span class="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs font-mono">{mechanism}</span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                        
                        {#if analysis.reportingAddresses?.aggregate && analysis.reportingAddresses.aggregate.length > 0}
                            <div>
                                <span class="text-sm text-gray-400">Reporting Addresses:</span>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    {#each analysis.reportingAddresses.aggregate as address}
                                        <span class="px-2 py-1 bg-purple-900 text-purple-200 rounded text-xs">{address}</span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        {:else}
            <p class="text-gray-500 italic">No {recordType} records found</p>
        {/if}
    </div>
</div>