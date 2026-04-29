<script lang="ts">
    import { File, ChevronDown } from "lucide-svelte";
    
    interface Props {
        dnsData: any;
        domain: string;
        variant?: "dropdown" | "icon";
        size?: "sm" | "md" | "lg";
    }

    let { dnsData, domain, variant = "dropdown", size = "sm" }: Props = $props();

    let showDropdown = $state(false);

    function generateZoneFile() {
        if (!dnsData) return "";

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const serial = `${today}01`; // YYYYMMDDNN format
        
        let zoneContent = `; Zone file for ${domain}\n`;
        zoneContent += `; Generated on ${new Date().toISOString()}\n`;
        zoneContent += `\n`;
        zoneContent += `$ORIGIN ${domain}.\n`;
        zoneContent += `$TTL 3600\n`;
        zoneContent += `\n`;

        // SOA Record (if available)
        if (dnsData.SOA && dnsData.SOA.length > 0) {
            const soa = dnsData.SOA[0];
            const soaParts = soa.data.split(' ');
            if (soaParts.length >= 7) {
                zoneContent += `@ IN SOA ${soaParts[0]} ${soaParts[1]} (\n`;
                zoneContent += `    ${serial}     ; Serial\n`;
                zoneContent += `    ${soaParts[3]}        ; Refresh\n`;
                zoneContent += `    ${soaParts[4]}        ; Retry\n`;
                zoneContent += `    ${soaParts[5]}        ; Expire\n`;
                zoneContent += `    ${soaParts[6]}        ; Minimum TTL\n`;
                zoneContent += `)\n\n`;
            }
        }

        // NS Records
        if (dnsData.NS && dnsData.NS.length > 0) {
            zoneContent += `; Name Servers\n`;
            dnsData.NS.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN NS ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // A Records
        if (dnsData.A && dnsData.A.length > 0) {
            zoneContent += `; A Records\n`;
            dnsData.A.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN A ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // AAAA Records
        if (dnsData.AAAA && dnsData.AAAA.length > 0) {
            zoneContent += `; AAAA Records\n`;
            dnsData.AAAA.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN AAAA ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // CNAME Records
        if (dnsData.CNAME && dnsData.CNAME.length > 0) {
            zoneContent += `; CNAME Records\n`;
            dnsData.CNAME.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN CNAME ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // MX Records
        if (dnsData.MX && dnsData.MX.length > 0) {
            zoneContent += `; MX Records\n`;
            dnsData.MX.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN MX ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // TXT Records
        if (dnsData.TXT && dnsData.TXT.length > 0) {
            zoneContent += `; TXT Records\n`;
            dnsData.TXT.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                // Escape quotes and ensure proper formatting
                const txtData = record.data.includes(' ') ? `"${record.data.replace(/"/g, '\\"')}"` : record.data;
                zoneContent += `@ ${ttl} IN TXT ${txtData}\n`;
            });
            zoneContent += `\n`;
        }

        // SRV Records
        if (dnsData.SRV && dnsData.SRV.length > 0) {
            zoneContent += `; SRV Records\n`;
            dnsData.SRV.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN SRV ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        // CAA Records
        if (dnsData.CAA && dnsData.CAA.length > 0) {
            zoneContent += `; CAA Records\n`;
            dnsData.CAA.forEach((record: any) => {
                const ttl = record.TTL || 3600;
                zoneContent += `@ ${ttl} IN CAA ${record.data}\n`;
            });
            zoneContent += `\n`;
        }

        return zoneContent;
    }

    function exportZoneFile() {
        const zoneContent = generateZoneFile();
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
        const zoneContent = generateZoneFile();
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