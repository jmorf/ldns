<script lang="ts">
    interface Metric {
        label: string;
        value: string;
        color?: string;
    }

    interface Props {
        type: 'success' | 'warning' | 'error' | 'info';
        icon: string;
        title: string;
        description: string;
        metrics?: Metric[];
        showBackground?: boolean;
        details?: string[];
    }

    let {
        type,
        icon,
        title,
        description,
        metrics = [],
        showBackground = true,
        details = []
    }: Props = $props();

    function getTypeClasses(type: string) {
        const typeMap: Record<string, string> = {
            success: 'bg-ok-500/10 border-ok-500/25',
            warning: 'bg-warn-500/10 border-warn-500/25',
            error: 'bg-bad-500/10 border-bad-500/25',
            info: 'bg-surface-2 border-line'
        };
        return typeMap[type] || typeMap.info;
    }

    function getIconBgClass(type: string) {
        const iconBgMap: Record<string, string> = {
            success: 'bg-ok-500/20',
            warning: 'bg-warn-500/20',
            error: 'bg-bad-500/20',
            info: 'bg-surface-3'
        };
        return iconBgMap[type] || iconBgMap.info;
    }

    function getTitleColor(type: string) {
        const titleColorMap: Record<string, string> = {
            success: 'text-ok-400',
            warning: 'text-warn-400',
            error: 'text-bad-400',
            info: 'text-fg'
        };
        return titleColorMap[type] || titleColorMap.info;
    }

    function getDescriptionColor(type: string) {
        const descColorMap: Record<string, string> = {
            success: 'text-fg-muted',
            warning: 'text-fg-muted',
            error: 'text-fg-muted',
            info: 'text-fg-muted'
        };
        return descColorMap[type] || descColorMap.info;
    }

    function getDetailColor(type: string) {
        const detailColorMap: Record<string, string> = {
            success: 'text-ok-400/80',
            warning: 'text-warn-400/80',
            error: 'text-bad-400/80',
            info: 'text-fg-subtle'
        };
        return detailColorMap[type] || detailColorMap.info;
    }
</script>

<div class="{getTypeClasses(type)} rounded-lg p-8 text-center {showBackground ? 'border' : ''}">
    <div class="flex justify-center mb-4">
        <div class="w-16 h-16 {getIconBgClass(type)} rounded-full flex items-center justify-center">
            <span class="text-2xl">{icon}</span>
        </div>
    </div>
    <h3 class="text-xl font-semibold {getTitleColor(type)} mb-2">
        {title}
    </h3>
    <p class="{getDescriptionColor(type)} mb-4">
        {@html description}
    </p>
    
    {#if details && details.length > 0}
        <div class="text-sm {getDetailColor(type)} space-y-1">
            {#each details as detail}
                <p>• {detail}</p>
            {/each}
        </div>
    {/if}

    {#if metrics && metrics.length > 0}
        <div class="mt-6 bg-surface-2 border border-line rounded-xl p-4 max-w-md mx-auto">
            <h4 class="text-fg font-medium mb-2 text-sm">
                Available Information
            </h4>
            <div class="text-left space-y-2">
                {#each metrics as metric}
                    <div class="flex justify-between text-sm">
                        <span class="text-fg-subtle">{metric.label}</span>
                        <span class="text-fg font-mono">{metric.value}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>