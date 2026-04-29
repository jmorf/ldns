<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import { CheckCircle, AlertCircle, ShieldCheck } from 'lucide-svelte';
    
    interface Props {
        txtRecords?: any[];
        variant?: "compact" | "detailed";
    }

    let { txtRecords = [], variant = "detailed" }: Props = $props();

    // Find SPF records from TXT records
    const spfRecords = $derived(() => {
        return txtRecords.filter(record => {
            if (!record || !record.data) return false;
            // Remove quotes and normalize the data - handle both single and double quotes
            let normalizedData = record.data.trim();
            // Remove surrounding quotes (both single and double)
            normalizedData = normalizedData.replace(/^["'](.+)["']$/, '$1');
            // Also try without the ending quote in case it's malformed
            normalizedData = normalizedData.replace(/^["'](.+)$/, '$1');
            normalizedData = normalizedData.toLowerCase().trim();
            return normalizedData.startsWith('v=spf1');
        });
    });

    // Parse SPF record with comprehensive validation
    function parseSPF(spfRecord: string) {
        // Remove quotes if present - handle both single and double quotes
        let cleanRecord = spfRecord.trim();
        cleanRecord = cleanRecord.replace(/^["'](.+)["']$/, '$1');
        cleanRecord = cleanRecord.replace(/^["'](.+)$/, '$1');
        cleanRecord = cleanRecord.trim();
        
        const mechanisms: Array<{
            type: string,
            value: string,
            qualifier: string,
            valid: boolean,
            description: string,
            severity: 'good' | 'warning' | 'error',
            errorDetail?: string
        }> = [];
        
        const modifiers: Array<{
            type: string,
            value: string,
            valid: boolean,
            description: string,
            errorDetail?: string
        }> = [];
        
        let policy = 'neutral';
        
        // Split by spaces and parse each directive
        const directives = cleanRecord.split(/\s+/);
        
        for (const directive of directives) {
            if (!directive.trim()) continue;
            
            // Version check
            if (directive === 'v=spf1') continue;
            
            // Parse qualifier
            const qualifier = directive.match(/^([~\-\+\?])/)?.[1] || '+';
            const cleanDirective = directive.replace(/^[~\-\+\?]/, '');
            
            // Parse mechanisms with comprehensive validation
            if (cleanDirective.startsWith('include:')) {
                const domain = cleanDirective.substring(8);
                const validation = validateDomain(domain);
                mechanisms.push({
                    type: 'include',
                    value: domain,
                    qualifier,
                    valid: validation.valid,
                    description: `Include SPF record from ${domain}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('a:') || cleanDirective === 'a') {
                const value = cleanDirective === 'a' ? '' : cleanDirective.substring(2);
                let validation: ValidationResult = { valid: true };
                
                if (value) {
                    validation = validateMechanism('a', value);
                    if (validation.valid && !value.includes('/')) {
                        // Also validate as domain if no CIDR
                        validation = validateDomain(value);
                    }
                }
                
                mechanisms.push({
                    type: 'a',
                    value: value || 'current domain',
                    qualifier,
                    valid: validation.valid,
                    description: `Allow A record IPs from ${value || 'current domain'}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('mx:') || cleanDirective === 'mx') {
                const value = cleanDirective === 'mx' ? '' : cleanDirective.substring(3);
                let validation: ValidationResult = { valid: true };
                
                if (value) {
                    validation = validateMechanism('mx', value);
                    if (validation.valid && !value.includes('/')) {
                        // Also validate as domain if no CIDR
                        validation = validateDomain(value);
                    }
                }
                
                mechanisms.push({
                    type: 'mx',
                    value: value || 'current domain',
                    qualifier,
                    valid: validation.valid,
                    description: `Allow MX record IPs from ${value || 'current domain'}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('ip4:')) {
                const ip = cleanDirective.substring(4);
                const validation = validateIPv4(ip);
                mechanisms.push({
                    type: 'ip4',
                    value: ip,
                    qualifier,
                    valid: validation.valid,
                    description: `Allow IPv4 address/range: ${ip}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('ip6:')) {
                const ip = cleanDirective.substring(4);
                const validation = validateIPv6(ip);
                mechanisms.push({
                    type: 'ip6',
                    value: ip,
                    qualifier,
                    valid: validation.valid,
                    description: `Allow IPv6 address/range: ${ip}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('exists:')) {
                const domain = cleanDirective.substring(7);
                const validation = validateDomain(domain);
                mechanisms.push({
                    type: 'exists',
                    value: domain,
                    qualifier,
                    valid: validation.valid,
                    description: `Check if domain exists: ${domain}`,
                    severity: validation.valid ? 'good' : 'error',
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('ptr:') || cleanDirective === 'ptr') {
                const value = cleanDirective === 'ptr' ? '' : cleanDirective.substring(4);
                let validation: ValidationResult = { valid: true };
                
                if (value) {
                    validation = validateDomain(value);
                }
                
                mechanisms.push({
                    type: 'ptr',
                    value: value || 'current domain',
                    qualifier,
                    valid: validation.valid,
                    description: `Reverse DNS check for ${value || 'current domain'} (DEPRECATED - avoid using)`,
                    severity: validation.valid ? 'warning' : 'error',
                    errorDetail: validation.error || (validation.valid ? 'PTR mechanism is deprecated and should be avoided' : undefined)
                });
            } else if (['~all', '-all', '+all', '?all', 'all'].includes(directive)) {
                policy = directive;
                mechanisms.push({
                    type: 'all',
                    value: '',
                    qualifier: directive.replace('all', '') || '+',
                    valid: true,
                    description: `Final policy: ${getPolicyDescription(directive)}`,
                    severity: getPolicySeverity(directive)
                });
            } else if (cleanDirective.startsWith('redirect=')) {
                const domain = cleanDirective.substring(9);
                const validation = validateDomain(domain, false); // Don't allow macros in redirect
                modifiers.push({
                    type: 'redirect',
                    value: domain,
                    valid: validation.valid,
                    description: `Redirect to SPF record at ${domain}`,
                    errorDetail: validation.error
                });
            } else if (cleanDirective.startsWith('exp=')) {
                const domain = cleanDirective.substring(4);
                const validation = validateDomain(domain);
                modifiers.push({
                    type: 'exp',
                    value: domain,
                    valid: validation.valid,
                    description: `Explanation text from ${domain}`,
                    errorDetail: validation.error
                });
            } else if (cleanDirective.trim()) {
                // Unknown directive - provide specific error
                let errorDetail = `Unknown SPF mechanism or modifier: ${directive}`;
                
                // Check for common mistakes
                if (directive.includes(':') && !directive.includes('=')) {
                    const [mech, value] = directive.split(':', 2);
                    if (!['include', 'a', 'mx', 'ip4', 'ip6', 'exists', 'ptr'].includes(mech.replace(/^[~\-\+\?]/, ''))) {
                        errorDetail = `Unknown mechanism '${mech}'. Valid mechanisms are: include, a, mx, ip4, ip6, exists, ptr`;
                    }
                } else if (directive.includes('=') && !directive.includes(':')) {
                    const [mod] = directive.split('=', 1);
                    if (!['redirect', 'exp'].includes(mod)) {
                        errorDetail = `Unknown modifier '${mod}'. Valid modifiers are: redirect, exp`;
                    }
                } else if (directive !== 'all' && !directive.match(/^[~\-\+\?]all$/)) {
                    errorDetail = `Invalid syntax '${directive}'. Expected format: [qualifier]mechanism[:value] or modifier=value`;
                }
                
                mechanisms.push({
                    type: 'unknown',
                    value: directive,
                    qualifier: '+',
                    valid: false,
                    description: `Unknown directive`,
                    severity: 'error',
                    errorDetail
                });
            }
        }
        
        return { mechanisms, modifiers, policy };
    }

    // Comprehensive validation helpers with specific error messages
    interface ValidationResult {
        valid: boolean;
        error?: string;
    }

    function validateDomain(domain: string, allowMacros: boolean = true): ValidationResult {
        if (!domain) {
            return { valid: false, error: "Domain cannot be empty" };
        }

        // Check for macros if allowed
        if (allowMacros && domain.includes('%')) {
            // Basic macro validation - check for valid macro syntax
            const macroRegex = /%\{[slodipvh]([+-]\d+)?[rR]?\}/g;
            const withoutMacros = domain.replace(macroRegex, 'x');
            // Continue validation with macros replaced
            domain = withoutMacros;
        }

        // Allow underscores in SPF domains (common in DKIM/DMARC)
        const spfDomainRegex = /^([a-zA-Z0-9_]([a-zA-Z0-9\-_]{0,61}[a-zA-Z0-9_])?\.)*[a-zA-Z0-9_]([a-zA-Z0-9\-_]{0,61}[a-zA-Z0-9_])?$/;
        
        if (!spfDomainRegex.test(domain)) {
            if (domain.includes('..')) {
                return { valid: false, error: "Domain contains consecutive dots" };
            }
            if (domain.startsWith('.') || domain.endsWith('.')) {
                return { valid: false, error: "Domain cannot start or end with a dot" };
            }
            if (domain.length > 253) {
                return { valid: false, error: "Domain exceeds 253 characters" };
            }
            return { valid: false, error: "Invalid domain format" };
        }
        
        return { valid: true };
    }

    function validateIPv4(ip: string): ValidationResult {
        const parts = ip.split('/');
        const address = parts[0];
        const cidr = parts[1];

        // Validate IP address format
        const octets = address.split('.');
        if (octets.length !== 4) {
            return { valid: false, error: "IPv4 address must have 4 octets" };
        }

        for (let i = 0; i < octets.length; i++) {
            const octet = octets[i];
            if (!/^\d+$/.test(octet)) {
                return { valid: false, error: `Octet ${i + 1} contains non-numeric characters` };
            }
            const num = parseInt(octet);
            if (num < 0 || num > 255) {
                return { valid: false, error: `Octet ${i + 1} value ${num} is out of range (0-255)` };
            }
        }

        // Validate CIDR notation if present
        if (cidr !== undefined) {
            if (!/^\d+$/.test(cidr)) {
                return { valid: false, error: "CIDR prefix must be numeric" };
            }
            const cidrNum = parseInt(cidr);
            if (cidrNum < 0 || cidrNum > 32) {
                return { valid: false, error: `CIDR prefix /${cidr} is out of range (0-32)` };
            }
        }

        return { valid: true };
    }

    function validateIPv6(ip: string): ValidationResult {
        const parts = ip.split('/');
        const address = parts[0];
        const cidr = parts[1];

        // Basic IPv6 validation - handle compressed notation
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;
        
        if (!ipv6Regex.test(address)) {
            if (address.includes(':::')) {
                return { valid: false, error: "IPv6 address contains too many consecutive colons" };
            }
            return { valid: false, error: "Invalid IPv6 address format" };
        }

        // Validate CIDR notation if present
        if (cidr !== undefined) {
            if (!/^\d+$/.test(cidr)) {
                return { valid: false, error: "CIDR prefix must be numeric" };
            }
            const cidrNum = parseInt(cidr);
            if (cidrNum < 0 || cidrNum > 128) {
                return { valid: false, error: `CIDR prefix /${cidr} is out of range (0-128)` };
            }
        }

        return { valid: true };
    }

    function validateMechanism(type: string, value: string): ValidationResult {
        // Validate dual CIDR notation for a and mx mechanisms
        if ((type === 'a' || type === 'mx') && value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 3) {
                // Dual CIDR notation: domain/ip4-cidr/ip6-cidr
                const domain = parts[0];
                const ip4Cidr = parts[1];
                const ip6Cidr = parts[2];
                
                if (domain) {
                    const domainResult = validateDomain(domain);
                    if (!domainResult.valid) return domainResult;
                }
                
                if (!/^\d+$/.test(ip4Cidr) || parseInt(ip4Cidr) < 0 || parseInt(ip4Cidr) > 32) {
                    return { valid: false, error: `IPv4 CIDR /${ip4Cidr} is out of range (0-32)` };
                }
                if (!/^\d+$/.test(ip6Cidr) || parseInt(ip6Cidr) < 0 || parseInt(ip6Cidr) > 128) {
                    return { valid: false, error: `IPv6 CIDR /${ip6Cidr} is out of range (0-128)` };
                }
                return { valid: true };
            } else if (parts.length === 2) {
                // Single CIDR notation
                const domain = parts[0];
                const cidr = parts[1];
                
                if (domain) {
                    const domainResult = validateDomain(domain);
                    if (!domainResult.valid) return domainResult;
                }
                
                if (!/^\d+$/.test(cidr)) {
                    return { valid: false, error: "CIDR prefix must be numeric" };
                }
                const cidrNum = parseInt(cidr);
                // Could be IPv4 or IPv6 CIDR
                if (cidrNum < 0 || cidrNum > 128) {
                    return { valid: false, error: `CIDR prefix /${cidr} is out of range` };
                }
                return { valid: true };
            }
        }
        
        return { valid: true };
    }

    function getPolicyDescription(policy: string): string {
        switch (policy) {
            case '-all': return 'Hard fail - reject all others';
            case '~all': return 'Soft fail - mark as spam';
            case '+all': return 'Pass - allow all others';
            case '?all': return 'Neutral - no policy';
            case 'all': return 'Neutral - no policy';
            default: return 'Unknown policy';
        }
    }

    function getPolicySeverity(policy: string): 'good' | 'warning' | 'error' {
        switch (policy) {
            case '-all': return 'good';
            case '~all': return 'good'; 
            case '+all': return 'warning';
            case '?all': case 'all': return 'warning';
            default: return 'error';
        }
    }

    function getQualifierDescription(qualifier: string): string {
        switch (qualifier) {
            case '+': return 'Pass';
            case '-': return 'Fail';
            case '~': return 'Soft Fail';
            case '?': return 'Neutral';
            default: return 'Pass';
        }
    }

    function getQualifierColor(qualifier: string): "green" | "red" | "yellow" | "blue" | "gray" {
        switch (qualifier) {
            case '+': return 'green';
            case '-': return 'red';
            case '~': return 'yellow';
            case '?': return 'blue';
            default: return 'gray';
        }
    }

    // Analyze all SPF records
    const spfAnalysis = $derived(() => {
        if (spfRecords().length === 0) {
            return {
                hasSpf: false,
                records: [],
                issues: [],
                valid: false
            };
        }

        const records = spfRecords().map((record: any) => ({
            record: record.data,
            parsed: parseSPF(record.data),
            ttl: record.TTL || record.ttl
        }));

        const issues: string[] = [];
        let hasErrors = false;

        // Check for multiple SPF records (RFC violation)
        if (records.length > 1) {
            issues.push('Multiple SPF records found - RFC 7208 requires exactly one SPF record per domain');
            hasErrors = true;
        }

        // Analyze each record
        records.forEach((record: any, index: number) => {
            const { mechanisms, modifiers } = record.parsed;
            
            // Check for missing policy directive
            const hasPolicy = mechanisms.some((m: any) => m.type === 'all');
            if (!hasPolicy) {
                issues.push(`Record ${index + 1}: Missing terminating mechanism (all) - emails may be accepted by default`);
            }

            // Check for invalid mechanisms
            const invalidMechanisms = mechanisms.filter((m: any) => !m.valid);
            if (invalidMechanisms.length > 0) {
                hasErrors = true;
                invalidMechanisms.forEach((m: any) => {
                    issues.push(`Record ${index + 1}: Invalid ${m.type} mechanism - ${m.errorDetail || 'syntax error'}`);
                });
            }

            // Check for too many DNS lookups (RFC 7208 limit)
            const dnsLookupMechanisms = mechanisms.filter((m: any) => 
                ['include', 'a', 'mx', 'exists', 'ptr'].includes(m.type)
            );
            const redirectModifiers = modifiers.filter((m: any) => m.type === 'redirect');
            const totalLookups = dnsLookupMechanisms.length + redirectModifiers.length;
            
            if (totalLookups > 10) {
                issues.push(`Record ${index + 1}: Too many DNS lookups (${totalLookups}/10 max) - may cause SPF evaluation to fail`);
            }

            // Check for redirect with other mechanisms
            const hasRedirect = modifiers.some((m: any) => m.type === 'redirect');
            const hasMechanisms = mechanisms.length > 0;
            if (hasRedirect && hasMechanisms) {
                issues.push(`Record ${index + 1}: Redirect modifier used with mechanisms - redirect will be ignored`);
            }

            // Check for deprecated ptr mechanism
            const hasPtrMechanism = mechanisms.some((m: any) => m.type === 'ptr');
            if (hasPtrMechanism) {
                issues.push(`Record ${index + 1}: PTR mechanism is deprecated and should be avoided (RFC 7208 Section 5.5)`);
            }

            // Check for overly permissive policy
            const allMechanism = mechanisms.find((m: any) => m.type === 'all');
            if (allMechanism && allMechanism.qualifier === '+') {
                issues.push(`Record ${index + 1}: Overly permissive +all policy allows anyone to send email for this domain`);
            }

            // Check for invalid modifiers
            const invalidModifiers = modifiers.filter((m: any) => !m.valid);
            if (invalidModifiers.length > 0) {
                hasErrors = true;
                invalidModifiers.forEach((m: any) => {
                    issues.push(`Record ${index + 1}: Invalid ${m.type} modifier - ${m.errorDetail || 'syntax error'}`);
                });
            }
        });

        return {
            hasSpf: true,
            records,
            issues,
            valid: !hasErrors
        };
    });
</script>

{#if variant === "compact"}
    <!-- Compact view -->
    <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-blue-400" />
        {#if spfAnalysis().hasSpf}
            <Badge variant={spfAnalysis().valid ? 'green' : 'red'} class="text-xs">
                SPF {spfAnalysis().valid ? 'Valid' : 'Invalid'}
            </Badge>
            <span class="text-xs text-gray-400">
                {spfRecords().length} record{spfRecords().length !== 1 ? 's' : ''}
            </span>
        {:else}
            <Badge variant="red" class="text-xs">
                No SPF
            </Badge>
        {/if}
    </div>
{:else}
    <!-- Detailed view -->
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div class="flex items-center gap-2 mb-3">
            <ShieldCheck class="w-5 h-5 text-blue-400" />
            <h3 class="text-lg font-semibold text-white">SPF Record Analysis</h3>
            {#if spfAnalysis().hasSpf}
                <Badge variant={spfAnalysis().valid ? 'green' : 'red'} class="text-sm">
                    {spfAnalysis().valid ? 'Valid' : 'Invalid'}
                </Badge>
            {:else}
                <Badge variant="red" class="text-sm">
                    No SPF Record
                </Badge>
            {/if}
        </div>
        
        {#if !spfAnalysis().hasSpf}
            <!-- No SPF record -->
            <div class="text-gray-400 text-sm">
                No SPF (Sender Policy Framework) record was found. This means anyone can send emails claiming to be from this domain.
            </div>
            <div class="text-gray-400 text-sm mt-2">
                <strong>Recommendation:</strong> Add an SPF record to prevent email spoofing.
            </div>
        {:else}
            <div class="space-y-4">
                <!-- SPF records found -->
                <div class="bg-gray-900 rounded p-3">
                    <div class="text-sm font-medium text-white mb-2">Analysis Summary</div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                            <div class="text-xs text-gray-400">Records Found</div>
                            <div class="text-lg font-semibold text-white">{spfRecords().length}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400">Validity Status</div>
                            <div class="text-lg font-semibold {spfAnalysis().valid ? 'text-green-400' : 'text-red-400'}">
                                {spfAnalysis().valid ? 'Valid' : 'Invalid'}
                            </div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400">Issues Found</div>
                            <div class="text-lg font-semibold text-white">{spfAnalysis().issues.length}</div>
                        </div>
                    </div>
                </div>

                <!-- Issues -->
                {#if spfAnalysis().issues.length > 0}
                    <div class="space-y-2">
                        <h4 class="text-md font-medium text-white">Issues & Warnings</h4>
                        {#each spfAnalysis().issues as issue}
                            {@const isError = issue.includes('Invalid') || issue.includes('Multiple SPF records')}
                            <div class="bg-{isError ? 'red' : 'yellow'}-900/20 border border-{isError ? 'red' : 'yellow'}-800 rounded p-2">
                                <div class="text-{isError ? 'red' : 'yellow'}-300 text-sm">{issue}</div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- SPF Records -->
                {#each spfAnalysis().records as record, index}
                    <div class="space-y-3">
                        <h4 class="text-md font-medium text-white border-b border-gray-600 pb-1">
                            SPF Record {index + 1} {record.ttl ? `(TTL: ${record.ttl})` : ''}
                        </h4>
                        
                        <!-- Raw record -->
                        <div class="bg-gray-900 rounded p-3">
                            <div class="text-xs text-gray-400 mb-1">Raw SPF Record</div>
                            <code class="text-sm font-mono text-blue-300 break-all">
                                {record.record}
                            </code>
                        </div>

                        <!-- Mechanisms -->
                        {#if record.parsed.mechanisms.length > 0}
                            <div class="space-y-2">
                                <div class="text-sm font-medium text-white">Mechanisms</div>
                                {#each record.parsed.mechanisms as mechanism}
                                    <div class="bg-gray-900 rounded p-3">
                                        <div class="flex items-start gap-3">
                                            {#if mechanism.severity === 'good'}
                                                <CheckCircle class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                            {:else}
                                                <AlertCircle class="w-5 h-5 text-{mechanism.severity === 'error' ? 'red' : 'yellow'}-400 mt-0.5 flex-shrink-0" />
                                            {/if}
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-1">
                                                    <code class="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-blue-300">
                                                        {mechanism.type}{mechanism.value ? ':' + mechanism.value : ''}
                                                    </code>
                                                    <Badge variant={getQualifierColor(mechanism.qualifier)} class="text-xs">
                                                        {getQualifierDescription(mechanism.qualifier)}
                                                    </Badge>
                                                    {#if !mechanism.valid}
                                                        <Badge variant="red" class="text-xs">Invalid</Badge>
                                                    {/if}
                                                </div>
                                                <div class="text-sm text-gray-300">
                                                    {mechanism.description}
                                                </div>
                                                {#if mechanism.errorDetail}
                                                    <div class="text-sm text-red-400 mt-1">
                                                        <span class="font-medium">Error:</span> {mechanism.errorDetail}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Modifiers -->
                        {#if record.parsed.modifiers.length > 0}
                            <div class="space-y-2">
                                <div class="text-sm font-medium text-white">Modifiers</div>
                                {#each record.parsed.modifiers as modifier}
                                    <div class="bg-gray-900 rounded p-3">
                                        <div class="flex items-center gap-2 mb-1">
                                            <code class="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-purple-300">
                                                {modifier.type}={modifier.value}
                                            </code>
                                            {#if !modifier.valid}
                                                <Badge variant="red" class="text-xs">Invalid</Badge>
                                            {/if}
                                        </div>
                                        <div class="text-sm text-gray-300">
                                            {modifier.description}
                                        </div>
                                        {#if modifier.errorDetail}
                                            <div class="text-sm text-red-400 mt-1">
                                                <span class="font-medium">Error:</span> {modifier.errorDetail}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}