<script lang="ts">
    import { File, ChevronDown } from "lucide-svelte";
    import { generateZoneFile } from "@ldns/core";
    
    interface Props {
        dnsData: any;
        domain: string;
        variant?: "dropdown" | "icon";
        size?: "sm" | "md" | "lg";
    }

    let { dnsData, domain, variant = "dropdown", size = "sm" }: Props = $props();

    let showDropdown = $state(false);

    function buildZone(): string {
        if (!dnsData) return "";
        return generateZoneFile(domain, dnsData);
    }

    function exportZoneFile() {
        const zoneContent = buildZone();
        const blob = new Blob([zoneContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${domain}.zone`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showDropdown = false;
    }

    function copyZoneFile() {
        const zoneContent = buildZone();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(zoneContent).catch(err => {
                console.error('Failed to copy zone file:', err);
            });
        }
        showDropdown = false;
    }

    function getSizeClasses() {
        switch (size) {
            case "sm":
                return "px-2 py-1 text-xs";
            case "md":
                return "px-3 py-1.5 text-sm";
            case "lg":
                return "px-4 py-2 text-base";
            default:
                return "px-2 py-1 text-xs";
        }
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: Event) {
        const target = event.target as Element;
        if (!target.closest('.zone-export-dropdown')) {
            showDropdown = false;
        }
    }

    // Add/remove event listener for click outside
    $effect(() => {
        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    });
</script>

{#if variant === "dropdown"}
    <div class="relative zone-export-dropdown">
        <button
            onclick={() => showDropdown = !showDropdown}
            class={`${getSizeClasses()} flex items-center gap-1 bg-surface-3 hover:bg-surface-3 text-fg rounded transition-colors`}
            disabled={!dnsData}
            title="Export BIND-compatible zone file"
        >
            <File class="w-3 h-3" />
            Zone File
            <ChevronDown class="w-3 h-3" />
        </button>

        {#if showDropdown}
            <div class="absolute right-0 mt-1 w-40 bg-surface-2 border border-line rounded-md shadow-lg z-50">
                <button
                    onclick={exportZoneFile}
                    class="w-full px-3 py-2 text-left text-sm text-fg hover:bg-surface-3 rounded-t-md transition-colors"
                >
                    Download Zone File
                </button>
                <button
                    onclick={copyZoneFile}
                    class="w-full px-3 py-2 text-left text-sm text-fg hover:bg-surface-3 rounded-b-md transition-colors"
                >
                    Copy to Clipboard
                </button>
            </div>
        {/if}
    </div>
{:else}
    <!-- Icon variant - just download -->
    <button
        onclick={exportZoneFile}
        class={`${getSizeClasses()} flex items-center gap-1 bg-surface-3 hover:bg-surface-3 text-fg rounded transition-colors`}
        disabled={!dnsData}
        title="Download BIND zone file"
    >
        <File class="w-3 h-3" />
        {#if size !== "sm"}Zone{/if}
    </button>
{/if}