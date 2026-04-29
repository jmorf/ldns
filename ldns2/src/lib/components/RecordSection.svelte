<script lang="ts">
    import CopyButton from "./CopyButton.svelte";
    import Badge from "./Badge.svelte";

    interface DnsRecord {
        data: string;
        ttl: number;
        type?: number;
    }

    interface Props {
        title: string;
        records: DnsRecord[];
        recordType: string;
        color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'gray' | 'indigo' | 'pink';
        emptyMessage?: string;
    }

    let {
        title,
        records,
        recordType,
        color = "blue",
        emptyMessage = `No ${recordType} records found`,
    }: Props = $props();


    function getTextColor(color: string) {
        const textColors: Record<string, string> = {
            blue: "text-blue-400",
            green: "text-green-400",
            purple: "text-purple-400",
            yellow: "text-yellow-400",
            red: "text-red-400",
            orange: "text-primary-400",
        };
        return textColors[color] || textColors.blue;
    }
</script>

<div class="mb-8">
    <div class="flex items-center space-x-3 mb-4">
        <Badge text={recordType.toUpperCase()} {color} size="sm" />
        <h3 class="text-lg font-semibold text-fg">{title}</h3>
    </div>

    {#if records.length > 0}
        <div class="space-y-3">
            {#each records as record, index}
                <div class="bg-surface-2 rounded-lg p-4 border border-line">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div
                                class="font-mono text-sm {getTextColor(
                                    color,
                                )} break-all"
                            >
                                {record.data}
                            </div>
                            <div class="text-xs text-fg-subtle mt-2">
                                TTL: {record.ttl}s
                            </div>
                        </div>
                        <CopyButton
                            text={record.data}
                            size="sm"
                            variant="compact"
                        />
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="bg-surface-2 rounded-lg p-6 border border-line">
            <p class="text-fg-subtle italic text-center">{emptyMessage}</p>
        </div>
    {/if}
</div>
