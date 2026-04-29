<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import { CheckCircle, AlertCircle, Lock } from 'lucide-svelte';
    import CopyButton from "./CopyButton.svelte";
    
    interface Props {
        mtaStsRecords?: any[];
        variant?: "compact" | "detailed";
    }

    let { mtaStsRecords = [], variant = "detailed" }: Props = $props();

    // Parse MTA-STS record
    function parseMTASTS(record: string) {
        // Remove quotes if present
        let cleanRecord = record.trim();
        cleanRecord = cleanRecord.replace(/^["'](.+)["']$/, '$1');
        cleanRecord = cleanRecord.trim();
        
        const tags: Array<{
            name: string,
            value: string,
            valid: boolean,
            description: string,
            errorDetail?: string
        }> = [];
        
        const parts = cleanRecord.split(/\s*;\s*/);
        let hasVersion = false;
        
        for (const part of parts) {
            if (!part.trim()) continue;
            
            const [tagName, tagValue] = part.split('=', 2).map(s => s.trim());
            
            if (!tagName || tagValue === undefined) {
                tags.push({
                    name: 'unknown',
                    value: part,
                    valid: false,
                    description: 'Invalid tag format',
                    errorDetail: 'Tags must be in name=value format'
                });
                continue;
            }
            
            switch (tagName) {
                case 'v':
                    hasVersion = true;
                    tags.push({
                        name: 'v',
                        value: tagValue,
                        valid: tagValue === 'STSv1',
                        description: 'MTA-STS version',
                        errorDetail: tagValue !== 'STSv1' ? `Invalid version '${tagValue}', must be 'STSv1'` : undefined
                    });
                    break;
                    
                case 'id':
                    tags.push({
                        name: 'id',
                        value: tagValue,
                        valid: tagValue.length > 0 && tagValue.length <= 32,
                        description: 'Policy identifier (changes when policy updates)',
                        errorDetail: tagValue.length === 0 ? 'ID cannot be empty' : 
                                   tagValue.length > 32 ? 'ID must be 32 characters or less' : undefined
                    });
                    break;
                    
                default:
                    tags.push({
                        name: tagName,
                        value: tagValue,
                        valid: false,
                        description: 'Unknown tag',
                        errorDetail: `'${tagName}' is not a standard MTA-STS tag`
                    });
            }
        }
        
        return { tags, hasVersion };
    }

    // Analyze MTA-STS records
    const mtaStsAnalysis = $derived(() => {
        if (!mtaStsRecords || mtaStsRecords.length === 0) {
            return {
                hasMtaSts: false,
                records: [],
                issues: [],
                valid: false
            };
        }

        const records = mtaStsRecords.map((record: any) => ({
            record: record.data,
            parsed: parseMTASTS(record.data),
            ttl: record.TTL || record.ttl
        }));

        const issues: string[] = [];
        let hasErrors = false;

        // Check for multiple MTA-STS records
        if (records.length > 1) {
            issues.push('Multiple MTA-STS records found - only one should exist');
            hasErrors = true;
        }

        // Analyze each record
        records.forEach((record: any) => {
            const { tags, hasVersion } = record.parsed;
            
            // Check for version tag
            if (!hasVersion) {
                issues.push('Missing required v=STSv1 tag');
                hasErrors = true;
            }

            // Check for id tag
            const hasId = tags.some((t: any) => t.name === 'id');
            if (!hasId) {
                issues.push('Missing required id= tag');
                hasErrors = true;
            }

            // Check for invalid tags
            const invalidTags = tags.filter((t: any) => !t.valid);
            if (invalidTags.length > 0) {
                hasErrors = true;
                invalidTags.forEach((t: any) => {
                    if (t.errorDetail) {
                        issues.push(t.errorDetail);
                    }
                });
            }
        });

        // Note about policy file
        if (!hasErrors) {
            issues.push('Note: MTA-STS also requires a policy file at https://mta-sts.domain/.well-known/mta-sts.txt');
        }

        return {
            hasMtaSts: true,
            records,
            issues,
            valid: !hasErrors
        };
    });
</script>

{#if variant === "compact"}
    <!-- Compact view -->
    <div class="flex items-center gap-2">
        <Lock class="w-4 h-4 text-blue-400" />
        {#if mtaStsAnalysis().hasMtaSts}
            <Badge variant={mtaStsAnalysis().valid ? 'green' : 'red'} class="text-xs">
                MTA-STS {mtaStsAnalysis().valid ? 'Valid' : 'Invalid'}
            </Badge>
        {:else}
            <Badge variant="gray" class="text-xs">
                No MTA-STS
            </Badge>
        {/if}
    </div>
{:else}
    <!-- Detailed view -->
    <div class="bg-surface-2 rounded-lg p-4 border border-line">
        <div class="flex items-center gap-2 mb-3">
            <Lock class="w-5 h-5 text-blue-400" />
            <h3 class="text-lg font-semibold text-fg">MTA-STS Record Analysis</h3>
            {#if mtaStsAnalysis().hasMtaSts}
                <Badge variant={mtaStsAnalysis().valid ? 'green' : 'red'} class="text-sm">
                    {mtaStsAnalysis().valid ? 'Valid' : 'Invalid'}
                </Badge>
            {:else}
                <Badge variant="gray" class="text-sm">
                    No MTA-STS Record
                </Badge>
            {/if}
        </div>

        {#if !mtaStsAnalysis().hasMtaSts}
            <!-- No MTA-STS record -->
            <div class="text-fg-muted text-sm">
                No MTA-STS record was found. MTA-STS (Mail Transfer Agent Strict Transport Security) enforces TLS encryption for email delivery.
            </div>
            <div class="text-fg-muted text-sm mt-2">
                <strong>Optional:</strong> MTA-STS provides additional email security but is not required for basic email functionality.
            </div>
        {:else}
            <div class="space-y-4">
                <!-- Issues -->
                {#if mtaStsAnalysis().issues.length > 0}
                    <div class="space-y-2 mb-4">
                        {#each mtaStsAnalysis().issues as issue}
                            <div class="flex items-start gap-2 text-sm">
                                {#if issue.startsWith('Note:')}
                                    <CheckCircle class="w-4 h-4 text-blue-400 mt-0.5" />
                                    <div class="text-blue-300">{issue}</div>
                                {:else}
                                    <AlertCircle class="w-4 h-4 text-warn-400 mt-0.5" />
                                    <div class="text-warn-400">{issue}</div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Parsed tags -->
                {#each mtaStsAnalysis().records as record}
                    <div class="space-y-2 mb-4">
                        <div class="text-sm font-medium text-fg mb-2">MTA-STS Tags</div>
                        <div class="grid gap-2">
                            {#each record.parsed.tags as tag}
                                <div class="bg-surface rounded p-2 flex items-start gap-2">
                                    <div class="flex-shrink-0">
                                        {#if tag.valid}
                                            <CheckCircle class="w-4 h-4 text-ok-400 mt-0.5" />
                                        {:else}
                                            <AlertCircle class="w-4 h-4 text-bad-400 mt-0.5" />
                                        {/if}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono text-sm text-blue-400">{tag.name}={tag.value}</span>
                                        </div>
                                        <div class="text-xs text-fg-muted mt-1">{tag.description}</div>
                                        {#if tag.errorDetail}
                                            <div class="text-xs text-bad-400 mt-1">{tag.errorDetail}</div>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}

                <!-- MTA-STS records table -->
                <div class="mt-4">
                    <div class="text-sm font-medium text-fg mb-2">DNS Record</div>
                    <div class="bg-surface rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-surface-2">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Type</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Data</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">TTL</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-surface divide-y divide-line">
                                {#each mtaStsRecords as record, index}
                                    <tr class="hover:bg-surface-3 transition-colors">
                                        <td class="px-4 py-3 text-sm text-fg-muted">
                                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                                TXT
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-sm font-medium text-fg break-words">
                                            <span class="font-mono">{record.data}</span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-fg-muted">
                                            <span class="font-mono">{record.ttl}</span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-fg-muted">
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
            </div>
        {/if}
    </div>
{/if}