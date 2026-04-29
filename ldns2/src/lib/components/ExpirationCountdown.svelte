<script lang="ts">
    import Badge from '$lib/components/ui/badge.svelte';
    import { AlertCircle, CheckCircle, Clock } from 'lucide-svelte';
    
    interface Props {
        expirationDate?: string;
        variant?: "compact" | "detailed";
        showProgressBar?: boolean;
    }

    let { expirationDate, variant = "detailed", showProgressBar = true }: Props = $props();

    // Calculate time until expiration
    const expirationData = $derived(() => {
        if (!expirationDate) return null;
        
        const expiry = new Date(expirationDate);
        const now = new Date();
        
        if (isNaN(expiry.getTime())) return null;
        
        const diffTime = expiry.getTime() - now.getTime();
        const isExpired = diffTime < 0;
        const absDiffTime = Math.abs(diffTime);
        
        const totalDays = Math.ceil(absDiffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(totalDays / 365);
        const months = Math.floor((totalDays % 365) / 30);
        const days = totalDays % 30;
        
        // Calculate urgency levels
        const isCritical = !isExpired && totalDays <= 7; // 1 week
        const isUrgent = !isExpired && totalDays <= 30; // 1 month
        const isWarning = !isExpired && totalDays <= 90; // 3 months
        const isExpiringSoon = !isExpired && totalDays <= 180; // 6 months
        
        return {
            totalDays,
            years,
            months,
            days,
            expirationDate: expiry,
            isExpired,
            isCritical,
            isUrgent,
            isWarning,
            isExpiringSoon,
            diffTime: absDiffTime
        };
    });

    // Get status color based on urgency
    function getStatusColor() {
        if (!expirationData()) return "gray";
        
        const data = expirationData()!;
        if (data.isExpired) return "red";
        if (data.isCritical) return "red";
        if (data.isUrgent) return "orange";
        if (data.isWarning) return "yellow";
        if (data.isExpiringSoon) return "blue";
        return "green";
    }

    // Get status text
    function getStatusText() {
        if (!expirationData()) return "Unknown";
        
        const data = expirationData()!;
        if (data.isExpired) return "EXPIRED";
        if (data.isCritical) return "CRITICAL";
        if (data.isUrgent) return "URGENT";
        if (data.isWarning) return "WARNING";
        if (data.isExpiringSoon) return "EXPIRING SOON";
        return "HEALTHY";
    }

    // Format time remaining
    function formatTimeRemaining() {
        if (!expirationData()) return "Unknown";
        
        const data = expirationData()!;
        const parts = [];
        
        if (data.isExpired) {
            if (data.years > 0) parts.push(`${data.years} year${data.years !== 1 ? 's' : ''}`);
            if (data.months > 0) parts.push(`${data.months} month${data.months !== 1 ? 's' : ''}`);
            if (data.days > 0 && data.years === 0) parts.push(`${data.days} day${data.days !== 1 ? 's' : ''}`);
            return `Expired ${parts.join(', ')} ago`;
        }
        
        if (data.years > 0) parts.push(`${data.years} year${data.years !== 1 ? 's' : ''}`);
        if (data.months > 0) parts.push(`${data.months} month${data.months !== 1 ? 's' : ''}`);
        if (data.days > 0 && data.years === 0) parts.push(`${data.days} day${data.days !== 1 ? 's' : ''}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Less than a day';
    }


    // Calculate progress percentage (0-100)
    function getProgressPercentage() {
        if (!expirationData()) return 0;
        
        const data = expirationData()!;
        if (data.isExpired) return 0;
        
        // Assume 1 year typical renewal cycle for progress calculation
        const oneYear = 365;
        const remaining = Math.min(data.totalDays, oneYear);
        return Math.max(0, (remaining / oneYear) * 100);
    }

    // Get progress bar color
    function getProgressColor() {
        const percentage = getProgressPercentage();
        if (percentage < 8) return "bg-red-500"; // <30 days
        if (percentage < 25) return "bg-orange-500"; // <90 days  
        if (percentage < 50) return "bg-yellow-500"; // <180 days
        return "bg-green-500";
    }
</script>

{#if expirationDate && expirationData()}
    {#if variant === "compact"}
        <!-- Compact view -->
        <div class="flex items-center gap-2">
            {#if expirationData()?.isExpired || expirationData()?.isCritical || expirationData()?.isUrgent}
                <AlertCircle class="w-4 h-4 text-{getStatusColor()}-400" />
            {:else}
                <CheckCircle class="w-4 h-4 text-{getStatusColor()}-400" />
            {/if}
            <Badge variant={getStatusColor()} class="text-xs">
                {formatTimeRemaining()}
            </Badge>
            <span class="text-xs text-gray-400">
                ({getStatusText()})
            </span>
        </div>
    {:else}
        <!-- Detailed view -->
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center gap-2 mb-3">
                {#if expirationData()?.isExpired || expirationData()?.isCritical || expirationData()?.isUrgent}
                    <AlertCircle class="w-5 h-5 text-{getStatusColor()}-400" />
                {:else}
                    <CheckCircle class="w-5 h-5 text-{getStatusColor()}-400" />
                {/if}
                <h3 class="text-lg font-semibold text-white">Domain Expiration</h3>
                <Badge variant={getStatusColor()} class="text-sm">
                    {getStatusText()}
                </Badge>
            </div>
            
            <div class="space-y-4">
                <!-- Main expiration display -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-2xl font-bold text-white">
                            {formatTimeRemaining()}
                        </div>
                        <div class="text-sm text-gray-400">
                            {expirationData()?.isExpired ? 'Expired on' : 'Expires on'} {expirationData()?.expirationDate.toLocaleDateString()}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-semibold text-white">
                            {expirationData()?.totalDays}
                        </div>
                        <div class="text-xs text-gray-400">
                            {expirationData()?.isExpired ? 'days ago' : 'days left'}
                        </div>
                    </div>
                </div>

                <!-- Progress bar -->
                {#if showProgressBar && !expirationData()?.isExpired}
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs text-gray-400">
                            <span>Time Remaining</span>
                            <span>{Math.round(getProgressPercentage())}%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                class="h-2 rounded-full transition-all duration-300 {getProgressColor()}"
                                style="width: {getProgressPercentage()}%"
                            ></div>
                        </div>
                    </div>
                {/if}

                <!-- Status indicators and warnings -->
                <div class="flex flex-wrap gap-2">
                    {#if expirationData()?.isExpired}
                        <Badge variant="red" class="text-xs">
                            ❌ Domain Expired
                        </Badge>
                    {:else if expirationData()?.isCritical}
                        <Badge variant="red" class="text-xs">
                            🚨 Critical - Renew Immediately
                        </Badge>
                    {:else if expirationData()?.isUrgent}
                        <Badge variant="orange" class="text-xs">
                            ⚠️ Urgent - Renew Soon
                        </Badge>
                    {:else if expirationData()?.isWarning}
                        <Badge variant="yellow" class="text-xs">
                            ⚡ Plan Renewal
                        </Badge>
                    {:else if expirationData()?.isExpiringSoon}
                        <Badge variant="blue" class="text-xs">
                            📅 Expiring in 6 months
                        </Badge>
                    {:else}
                        <Badge variant="green" class="text-xs">
                            ✅ Well within renewal period
                        </Badge>
                    {/if}
                </div>

                <!-- Action recommendations -->
                {#if expirationData()?.isExpired}
                    <div class="bg-red-900/20 border border-red-800 rounded p-3">
                        <div class="text-xs text-red-400 font-medium">Immediate Action Required</div>
                        <div class="text-xs text-red-300 mt-1">
                            Domain has expired! Contact your registrar immediately to renew and prevent loss of domain.
                        </div>
                    </div>
                {:else if expirationData()?.isCritical}
                    <div class="bg-red-900/20 border border-red-800 rounded p-3">
                        <div class="text-xs text-red-400 font-medium">Critical Action Required</div>
                        <div class="text-xs text-red-300 mt-1">
                            Domain expires within 7 days. Renew immediately to avoid service disruption.
                        </div>
                    </div>
                {:else if expirationData()?.isUrgent}
                    <div class="bg-orange-900/20 border border-orange-800 rounded p-3">
                        <div class="text-xs text-orange-400 font-medium">Renewal Recommended</div>
                        <div class="text-xs text-orange-300 mt-1">
                            Domain expires within 30 days. Plan renewal to ensure continuity.
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
{:else}
    <!-- No expiration date available -->
    {#if variant === "compact"}
        <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-gray-500" />
            <span class="text-xs text-gray-500">Expiration unknown</span>
        </div>
    {:else}
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-center gap-2 mb-2">
                <Clock class="w-5 h-5 text-gray-500" />
                <h3 class="text-lg font-semibold text-white">Domain Expiration</h3>
            </div>
            <div class="text-gray-400 text-sm">
                Expiration date not available in RDAP data
            </div>
        </div>
    {/if}
{/if}