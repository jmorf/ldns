<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import { CheckCircle, AlertCircle, Shield } from 'lucide-svelte';
    import CopyButton from "./CopyButton.svelte";
    
    interface Props {
        dmarcRecords?: any[];
        variant?: "compact" | "detailed";
    }

    let { dmarcRecords = [], variant = "detailed" }: Props = $props();

    // Parse DMARC record
    function parseDMARC(dmarcRecord: string) {
        // Remove quotes if present
        let cleanRecord = dmarcRecord.trim();
        cleanRecord = cleanRecord.replace(/^["'](.+)["']$/, '$1');
        cleanRecord = cleanRecord.trim();
        
        const tags: Array<{
            name: string,
            value: string,
            valid: boolean,
            description: string,
            severity?: 'good' | 'warning' | 'error',
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
                    severity: 'error',
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
                        valid: tagValue === 'DMARC1',
                        description: 'DMARC version',
                        severity: tagValue === 'DMARC1' ? 'good' : 'error',
                        errorDetail: tagValue !== 'DMARC1' ? `Invalid version '${tagValue}', must be 'DMARC1'` : undefined
                    });
                    break;
                    
                case 'p':
                    const validPolicies = ['none', 'quarantine', 'reject'];
                    tags.push({
                        name: 'p',
                        value: tagValue,
                        valid: validPolicies.includes(tagValue),
                        description: `Policy for domain: ${getPolicyDescription(tagValue)}`,
                        severity: getPolicySeverity(tagValue),
                        errorDetail: !validPolicies.includes(tagValue) ? `Invalid policy '${tagValue}'` : undefined
                    });
                    break;
                    
                case 'sp':
                    const validSubPolicies = ['none', 'quarantine', 'reject'];
                    tags.push({
                        name: 'sp',
                        value: tagValue,
                        valid: validSubPolicies.includes(tagValue),
                        description: `Policy for subdomains: ${getPolicyDescription(tagValue)}`,
                        severity: getPolicySeverity(tagValue),
                        errorDetail: !validSubPolicies.includes(tagValue) ? `Invalid subdomain policy '${tagValue}'` : undefined
                    });
                    break;
                    
                case 'rua':
                    tags.push({
                        name: 'rua',
                        value: tagValue,
                        valid: validateURIList(tagValue),
                        description: 'Aggregate report recipients',
                        severity: 'good',
                        errorDetail: !validateURIList(tagValue) ? 'Invalid URI format' : undefined
                    });
                    break;
                    
                case 'ruf':
                    tags.push({
                        name: 'ruf',
                        value: tagValue,
                        valid: validateURIList(tagValue),
                        description: 'Forensic report recipients',
                        severity: 'good',
                        errorDetail: !validateURIList(tagValue) ? 'Invalid URI format' : undefined
                    });
                    break;
                    
                case 'pct':
                    const pctNum = parseInt(tagValue);
                    const pctValid = !isNaN(pctNum) && pctNum >= 0 && pctNum <= 100;
                    tags.push({
                        name: 'pct',
                        value: tagValue,
                        valid: pctValid,
                        description: `Apply policy to ${tagValue}% of messages`,
                        severity: pctNum < 100 ? 'warning' : 'good',
                        errorDetail: !pctValid ? 'Percentage must be 0-100' : undefined
                    });
                    break;
                    
                case 'adkim':
                    const validAdkim = ['r', 's'];
                    tags.push({
                        name: 'adkim',
                        value: tagValue,
                        valid: validAdkim.includes(tagValue),
                        description: `DKIM alignment: ${tagValue === 's' ? 'Strict' : 'Relaxed'}`,
                        severity: 'good',
                        errorDetail: !validAdkim.includes(tagValue) ? `Invalid value '${tagValue}', must be 'r' or 's'` : undefined
                    });
                    break;
                    
                case 'aspf':
                    const validAspf = ['r', 's'];
                    tags.push({
                        name: 'aspf',
                        value: tagValue,
                        valid: validAspf.includes(tagValue),
                        description: `SPF alignment: ${tagValue === 's' ? 'Strict' : 'Relaxed'}`,
                        severity: 'good',
                        errorDetail: !validAspf.includes(tagValue) ? `Invalid value '${tagValue}', must be 'r' or 's'` : undefined
                    });
                    break;
                    
                case 'fo':
                    const foOptions = tagValue.split(':');
                    const validFo = ['0', '1', 'd', 's'];
                    const allValid = foOptions.every(opt => validFo.includes(opt));
                    tags.push({
                        name: 'fo',
                        value: tagValue,
                        valid: allValid,
                        description: `Failure reporting options: ${getFailureOptionsDescription(tagValue)}`,
                        severity: 'good',
                        errorDetail: !allValid ? 'Invalid failure option' : undefined
                    });
                    break;
                    
                case 'ri':
                    const riNum = parseInt(tagValue);
                    tags.push({
                        name: 'ri',
                        value: tagValue,
                        valid: !isNaN(riNum) && riNum > 0,
                        description: `Report interval: ${tagValue} seconds`,
                        severity: 'good',
                        errorDetail: isNaN(riNum) || riNum <= 0 ? 'Must be a positive number' : undefined
                    });
                    break;
                    
                default:
                    tags.push({
                        name: tagName,
                        value: tagValue,
                        valid: false,
                        description: 'Unknown tag',
                        severity: 'warning',
                        errorDetail: `'${tagName}' is not a standard DMARC tag`
                    });
            }
        }
        
        return { tags, hasVersion };
    }

    function getPolicyDescription(policy: string): string {
        switch (policy) {
            case 'none': return 'Monitor only (no action)';
            case 'quarantine': return 'Mark as spam/suspicious';
            case 'reject': return 'Reject failed messages';
            default: return 'Unknown policy';
        }
    }

    function getPolicySeverity(policy: string): 'good' | 'warning' | 'error' {
        switch (policy) {
            case 'reject': return 'good';
            case 'quarantine': return 'good';
            case 'none': return 'warning';
            default: return 'error';
        }
    }

    function getFailureOptionsDescription(fo: string): string {
        const options = fo.split(':');
        const descriptions = options.map(opt => {
            switch (opt) {
                case '0': return 'all alignment failures';
                case '1': return 'any alignment failures';
                case 'd': return 'DKIM failures';
                case 's': return 'SPF failures';
                default: return `unknown (${opt})`;
            }
        });
        return descriptions.join(', ');
    }

    function validateURIList(uris: string): boolean {
        const uriList = uris.split(',');
        return uriList.every(uri => {
            const trimmed = uri.trim();
            return trimmed.startsWith('mailto:') && trimmed.includes('@');
        });
    }

    // Analyze DMARC records
    const dmarcAnalysis = $derived(() => {
        if (!dmarcRecords || dmarcRecords.length === 0) {
            return {
                hasDmarc: false,
                records: [],
                issues: [],
                valid: false
            };
        }

        const records = dmarcRecords.map((record: any) => ({
            record: record.data,
            parsed: parseDMARC(record.data),
            ttl: record.TTL || record.ttl
        }));

        const issues: string[] = [];
        let hasErrors = false;

        // Check for multiple DMARC records
        if (records.length > 1) {
            issues.push('Multiple DMARC records found - only one DMARC record should exist');
            hasErrors = true;
        }

        // Analyze each record
        records.forEach((record: any, index: number) => {
            const { tags, hasVersion } = record.parsed;
            
            // Check for version tag
            if (!hasVersion) {
                issues.push('Missing required v=DMARC1 tag');
                hasErrors = true;
            }

            // Check for policy tag
            const hasPolicy = tags.some((t: any) => t.name === 'p');
            if (!hasPolicy) {
                issues.push('Missing required policy (p=) tag');
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

            // Check for monitoring without reporting
            const policy = tags.find((t: any) => t.name === 'p');
            const hasRua = tags.some((t: any) => t.name === 'rua');
            const hasRuf = tags.some((t: any) => t.name === 'ruf');
            
            if (policy && policy.value === 'none' && !hasRua && !hasRuf) {
                issues.push('Policy set to "none" without reporting addresses - no feedback will be received');
            }

            // Check percentage
            const pct = tags.find((t: any) => t.name === 'pct');
            if (pct && parseInt(pct.value) < 100) {
                issues.push(`Policy only applies to ${pct.value}% of messages`);
            }
        });

        return {
            hasDmarc: true,
            records,
            issues,
            valid: !hasErrors
        };
    });
</script>

{#if variant === "compact"}
    <!-- Compact view -->
    <div class="flex items-center gap-2">
        <Shield class="w-4 h-4 text-blue-400" />
        {#if dmarcAnalysis().hasDmarc}
            <Badge variant={dmarcAnalysis().valid ? 'green' : 'red'} class="text-xs">
                DMARC {dmarcAnalysis().valid ? 'Valid' : 'Invalid'}
            </Badge>
        {:else}
            <Badge variant="red" class="text-xs">
                No DMARC
            </Badge>
        {/if}
    </div>
{:else}
    <!-- Detailed view -->
    <div class="bg-surface-2 rounded-lg p-4 border border-line">
        <div class="flex items-center gap-2 mb-3">
            <Shield class="w-5 h-5 text-blue-400" />
            <h3 class="text-lg font-semibold text-fg">DMARC Record Analysis</h3>
            {#if dmarcAnalysis().hasDmarc}
                <Badge variant={dmarcAnalysis().valid ? 'green' : 'red'} class="text-sm">
                    {dmarcAnalysis().valid ? 'Valid' : 'Invalid'}
                </Badge>
            {:else}
                <Badge variant="red" class="text-sm">
                    No DMARC Record
                </Badge>
            {/if}
        </div>

        {#if !dmarcAnalysis().hasDmarc}
            <!-- No DMARC record -->
            <div class="text-fg-muted text-sm">
                No DMARC record was found. This means the domain has no email authentication policy.
            </div>
            <div class="text-fg-muted text-sm mt-2">
                <strong>Recommendation:</strong> Add a DMARC record to protect against email spoofing.
            </div>
        {:else}
            <div class="space-y-4">
                <!-- Issues -->
                {#if dmarcAnalysis().issues.length > 0}
                    <div class="space-y-2 mb-4">
                        {#each dmarcAnalysis().issues as issue}
                            <div class="flex items-start gap-2 text-sm">
                                <AlertCircle class="w-4 h-4 text-warn-400 mt-0.5" />
                                <div class="text-warn-400">{issue}</div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Parsed tags -->
                {#each dmarcAnalysis().records as record}
                    <div class="space-y-2 mb-4">
                        <div class="text-sm font-medium text-fg mb-2">DMARC Tags</div>
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

                <!-- DMARC records table -->
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
                                {#each dmarcRecords as record, index}
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