<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import { CalendarPlus, Clock } from 'lucide-svelte';
    
    interface Props {
        createdDate?: string;
        variant?: "compact" | "detailed";
    }

    let { createdDate, variant = "detailed" }: Props = $props();

    // Calculate domain age from creation date
    const domainAge = $derived(() => {
        if (!createdDate) return null;
        
        const created = new Date(createdDate);
        const now = new Date();
        
        if (isNaN(created.getTime())) return null;
        
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        const days = diffDays % 30;
        
        return {
            totalDays: diffDays,
            years,
            months,
            days,
            createdDate: created,
            isNew: diffDays < 90, // Less than 3 months
            isYoung: diffDays < 365, // Less than 1 year
            isEstablished: diffDays > 365 * 2, // More than 2 years
            isMature: diffDays > 365 * 5 // More than 5 years
        };
    });

    // Get age badge color based on domain age
    function getAgeBadgeColor() {
        if (!domainAge()) return "gray";
        
        const age = domainAge()!;
        if (age.isNew) return "red";
        if (age.isYoung) return "yellow";
        if (age.isEstablished) return "green";
        if (age.isMature) return "blue";
        return "purple";
    }

    // Get age description
    function getAgeDescription() {
        if (!domainAge()) return "Unknown";
        
        const age = domainAge()!;
        if (age.isNew) return "Very New Domain";
        if (age.isYoung) return "Young Domain";
        if (age.isEstablished) return "Established Domain";
        if (age.isMature) return "Mature Domain";
        return "Legacy Domain";
    }

    // Format age string
    function formatAge() {
        if (!domainAge()) return "Unknown";
        
        const age = domainAge()!;
        const parts = [];
        
        if (age.years > 0) parts.push(`${age.years} year${age.years !== 1 ? 's' : ''}`);
        if (age.months > 0) parts.push(`${age.months} month${age.months !== 1 ? 's' : ''}`);
        if (age.days > 0 && age.years === 0) parts.push(`${age.days} day${age.days !== 1 ? 's' : ''}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Less than a day';
    }

    // Get trust level based on age
    function getTrustLevel() {
        if (!domainAge()) return { level: "Unknown", score: 0 };
        
        const age = domainAge()!;
        if (age.isNew) return { level: "Low", score: 25 };
        if (age.isYoung) return { level: "Moderate", score: 50 };
        if (age.isEstablished) return { level: "High", score: 75 };
        if (age.isMature) return { level: "Very High", score: 90 };
        return { level: "Maximum", score: 95 };
    }
</script>

{#if createdDate && domainAge()}
    {#if variant === "compact"}
        <!-- Compact view -->
        <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-fg-muted" />
            <Badge variant={getAgeBadgeColor()} class="text-xs">
                {formatAge()}
            </Badge>
            <span class="text-xs text-fg-muted">
                ({getAgeDescription()})
            </span>
        </div>
    {:else}
        <!-- Detailed view -->
        <div class="bg-surface-2 rounded-lg p-4 border border-line">
            <div class="flex items-center gap-2 mb-3">
                <CalendarPlus class="w-5 h-5 text-primary-400" />
                <h3 class="text-lg font-semibold text-fg">Domain Age Analysis</h3>
            </div>

            <div class="space-y-4">
                <!-- Main age display -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-2xl font-bold text-fg">
                            {formatAge()}
                        </div>
                        <div class="text-sm text-fg-muted">
                            Since {domainAge()?.createdDate.toLocaleDateString()}
                        </div>
                    </div>
                    <Badge variant={getAgeBadgeColor()} class="text-sm px-3 py-1">
                        {getAgeDescription()}
                    </Badge>
                </div>

                <!-- Age metrics -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-surface rounded p-3">
                        <div class="text-xs text-fg-muted uppercase tracking-wide">Total Days</div>
                        <div class="text-lg font-semibold text-fg">
                            {domainAge()?.totalDays.toLocaleString()}
                        </div>
                    </div>

                    <div class="bg-surface rounded p-3">
                        <div class="text-xs text-fg-muted uppercase tracking-wide">Trust Level</div>
                        <div class="flex items-center gap-2">
                            <div class="text-lg font-semibold text-fg">
                                {getTrustLevel().level}
                            </div>
                            <Badge variant={getTrustLevel().score > 75 ? "green" : getTrustLevel().score > 50 ? "yellow" : "red"} class="text-xs">
                                {getTrustLevel().score}%
                            </Badge>
                        </div>
                    </div>
                </div>

                <!-- Age indicators -->
                <div class="flex flex-wrap gap-2">
                    {#if domainAge()?.isNew}
                        <Badge variant="red" class="text-xs">
                            ⚠️ Very New Domain
                        </Badge>
                    {/if}

                    {#if domainAge()?.isYoung && !domainAge()?.isNew}
                        <Badge variant="yellow" class="text-xs">
                            🌱 Young Domain
                        </Badge>
                    {/if}

                    {#if domainAge()?.isEstablished}
                        <Badge variant="green" class="text-xs">
                            ✅ Established Domain
                        </Badge>
                    {/if}

                    {#if domainAge()?.isMature}
                        <Badge variant="blue" class="text-xs">
                            🏆 Mature Domain
                        </Badge>
                    {/if}
                </div>

                <!-- Security note for new domains -->
                {#if domainAge()?.isNew}
                    <div class="bg-bad-500/10 border border-bad-500/30 rounded p-3">
                        <div class="text-xs text-bad-400 font-medium">Security Note</div>
                        <div class="text-xs text-bad-400 mt-1">
                            Very new domains (less than 90 days) may pose higher security risks. Exercise caution and verify legitimacy.
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
{:else}
    <!-- No creation date available -->
    {#if variant === "compact"}
        <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-fg-subtle" />
            <span class="text-xs text-fg-subtle">Age unknown</span>
        </div>
    {:else}
        <div class="bg-surface-2 rounded-lg p-4 border border-line">
            <div class="flex items-center gap-2 mb-2">
                <CalendarPlus class="w-5 h-5 text-fg-subtle" />
                <h3 class="text-lg font-semibold text-fg">Domain Age Analysis</h3>
            </div>
            <div class="text-fg-muted text-sm">
                Creation date not available in RDAP data
            </div>
        </div>
    {/if}
{/if}