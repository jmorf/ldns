<script lang="ts">
    import { domain, queryConfig } from "$lib/state.svelte";
    import {
        createTable,
        getCoreRowModel,
        getSortedRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
        type ColumnDef,
        type SortingState,
        FlexRender,
    } from '@tanstack/svelte-table';
    import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Copy, Check } from 'lucide-svelte';
    import Badge from '$lib/components/ui/badge.svelte';
    import type { BadgeVariant } from '$lib/components/ui/badge.svelte';
    import ExportButton from "./ExportButton.svelte";
    import ZoneFileExporter from "./ZoneFileExporter.svelte";

    interface Props {
        filterType?: string;
        onFilterChange?: (newFilter: string) => void;
    }

    let { filterType = "ALL", onFilterChange }: Props = $props();

    interface DnsRecord {
        type: string;
        data: string;
        ttl: number;
        originalRecord: any;
    }

    // Get filtered records
    const filteredRecords = $derived<DnsRecord[]>(
        filterType === "ALL"
            ? Object.entries(domain.toolState.dns.data || {}).flatMap(
                  ([type, records]) =>
                      (records as any[]).map((r: any) => ({
                          type: String(type),
                          data: r.data,
                          ttl: r.ttl,
                          originalRecord: r,
                      })),
              )
            : (domain.toolState.dns.data?.[filterType] || []).map((r: any) => ({
                  type: String(filterType),
                  data: r.data,
                  ttl: r.ttl,
                  originalRecord: r,
              }))
    );

    function getRecordCount(type: string) {
        return type === "ALL"
            ? Object.values(domain.toolState.dns.data || {}).reduce(
                  (count: number, records) => count + (records as any[]).length,
                  0,
              )
            : (domain.toolState.dns.data?.[type] || []).length;
    }

    // Badge variant for record types
    function getTypeBadgeVariant(type: string): BadgeVariant {
        const variantMap: Record<string, BadgeVariant> = {
            A: 'blue',
            AAAA: 'purple',
            NS: 'green',
            MX: 'orange',
            TXT: 'yellow',
            SOA: 'red',
            CNAME: 'indigo',
            CAA: 'pink',
            SRV: 'gray',
        };
        return variantMap[type] || 'gray';
    }

    // Copy state tracking
    let copiedData = $state<string | null>(null);

    async function copyToClipboard(data: string) {
        try {
            await navigator.clipboard.writeText(data);
            copiedData = data;
            setTimeout(() => {
                copiedData = null;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    // Table state
    let sorting = $state<SortingState>([]);
    let globalFilter = $state('');
    let pageSize = $state(25);

    // Column definitions
    const columns: ColumnDef<DnsRecord>[] = [
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: 'data',
            header: 'Data',
            cell: ({ getValue }) => getValue(),
        },
        {
            accessorKey: 'ttl',
            header: 'TTL',
            cell: ({ getValue }) => getValue(),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            cell: ({ row }) => row.original.data,
        },
    ];

    const table = $derived(createTable({
        get data() { return filteredRecords; },
        columns,
        state: {
            get sorting() { return sorting; },
            get globalFilter() { return globalFilter; },
        },
        onSortingChange: (updater) => {
            sorting = typeof updater === 'function' ? updater(sorting) : updater;
        },
        onGlobalFilterChange: (updater) => {
            globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 25,
            },
        },
    }));

    // Reset to first page when filter changes
    $effect(() => {
        filterType;
        table.setPageIndex(0);
    });
</script>

<div>
    <!-- Controls row with filters and export buttons -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- Record type filters -->
        <div class="flex flex-wrap gap-2">
            <button
                class={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                    filterType === "ALL"
                        ? "bg-primary-500 hover:bg-primary-600 text-fg"
                        : "bg-surface-2 text-fg-muted hover:bg-surface-3"
                }`}
                onclick={() => onFilterChange?.("ALL")}
            >
                ALL
            </button>

            {#each queryConfig.recordTypes as type}
                {#if type !== "ALL" && domain.toolState.dns.data?.[type] && domain.toolState.dns.data[type].length > 0}
                    <button
                        class={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                            filterType === type
                                ? "bg-primary-500 hover:bg-primary-600 text-fg"
                                : "bg-surface-2 text-fg-muted hover:bg-surface-3"
                        }`}
                        onclick={() => onFilterChange?.(type)}
                    >
                        {type} ({getRecordCount(type)})
                    </button>
                {/if}
            {/each}
        </div>

        <!-- Export buttons -->
        <div class="flex items-center gap-2">
            <ZoneFileExporter
                dnsData={filterType === 'ALL' ? domain.toolState.dns.data : { [filterType]: domain.toolState.dns.data?.[filterType] }}
                domain={domain.name}
                variant="dropdown"
                size="sm"
            />
            <ExportButton
                data={filteredRecords.map((r) => ({
                    type: r.type,
                    data: r.data,
                    ttl: r.ttl,
                    ...r.originalRecord
                }))}
                filename={`${domain.name}-dns-records${filterType !== 'ALL' ? `-${filterType}` : ''}`}
                variant="dropdown"
                size="sm"
                pdfData={filterType === 'ALL' ? domain.toolState.dns.data : { [filterType]: domain.toolState.dns.data?.[filterType] }}
                domain={domain.name}
                pdfTitle={`DNS Records${filterType !== 'ALL' ? ` - ${filterType}` : ''}`}
            />
        </div>
    </div>

    <!-- DNS Records Table -->
    {#if domain.toolState.dns.loading}
        <!-- Let ToolPage handle loading state -->
    {:else if filteredRecords.length > 0}
        <div class="space-y-4 mb-4">
            <!-- Search and page size controls -->
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="relative flex-1 max-w-sm">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                    <input
                        type="text"
                        placeholder="Search DNS records..."
                        bind:value={globalFilter}
                        class="w-full pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500 text-sm"
                    />
                </div>
                <div class="flex items-center gap-2 text-sm text-fg-muted">
                    <span>Show</span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
                        class="bg-surface-2 border border-line rounded px-2 py-1 text-fg focus:outline-none focus:border-primary-500"
                    >
                        {#each [10, 25, 50, 100] as size}
                            <option value={size}>{size}</option>
                        {/each}
                    </select>
                    <span>entries</span>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto rounded-lg border border-line">
                <table class="w-full text-left text-sm text-fg-muted">
                    <thead class="bg-surface-2 text-xs uppercase text-fg-muted">
                        {#each table.getHeaderGroups() as headerGroup}
                            <tr>
                                {#each headerGroup.headers as header}
                                    <th
                                        class="px-4 py-3 font-medium"
                                        class:cursor-pointer={header.column.getCanSort()}
                                        onclick={header.column.getToggleSortingHandler()}
                                    >
                                        <div class="flex items-center gap-2">
                                            {#if !header.isPlaceholder}
                                                {#if header.id === 'type'}
                                                    Type
                                                {:else if header.id === 'data'}
                                                    Data
                                                {:else if header.id === 'ttl'}
                                                    TTL
                                                {:else if header.id === 'actions'}
                                                    Actions
                                                {/if}
                                            {/if}
                                            {#if header.column.getCanSort()}
                                                {#if header.column.getIsSorted() === 'asc'}
                                                    <ChevronUp class="w-4 h-4" />
                                                {:else if header.column.getIsSorted() === 'desc'}
                                                    <ChevronDown class="w-4 h-4" />
                                                {:else}
                                                    <ChevronsUpDown class="w-4 h-4 opacity-50" />
                                                {/if}
                                            {/if}
                                        </div>
                                    </th>
                                {/each}
                            </tr>
                        {/each}
                    </thead>
                    <tbody class="divide-y divide-line">
                        {#each table.getRowModel().rows as row}
                            <tr class="hover:bg-surface-2/50 transition-colors">
                                {#each row.getVisibleCells() as cell}
                                    <td class="px-4 py-3">
                                        {#if cell.column.id === 'type'}
                                            <Badge variant={getTypeBadgeVariant(cell.getValue() as string)} class="text-xs">
                                                {cell.getValue()}
                                            </Badge>
                                        {:else if cell.column.id === 'data'}
                                            <span class="text-fg font-medium">{cell.getValue()}</span>
                                        {:else if cell.column.id === 'ttl'}
                                            {cell.getValue()}
                                        {:else if cell.column.id === 'actions'}
                                            <button
                                                onclick={() => copyToClipboard(row.original.data)}
                                                class={`px-2 py-1 text-xs rounded transition-colors min-w-[70px] ${
                                                    copiedData === row.original.data
                                                        ? 'bg-ok-500 hover:bg-ok-500/80 text-fg'
                                                        : 'bg-surface-3 hover:bg-surface-3 text-fg'
                                                }`}
                                            >
                                                {#if copiedData === row.original.data}
                                                    <span class="flex items-center gap-1">
                                                        <Check class="w-3 h-3" />
                                                        Copied!
                                                    </span>
                                                {:else}
                                                    <span class="flex items-center gap-1">
                                                        <Copy class="w-3 h-3" />
                                                        Copy
                                                    </span>
                                                {/if}
                                            </button>
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            {#if table.getPageCount() > 1}
                <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-fg-muted">
                    <div>
                        Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )} of {table.getFilteredRowModel().rows.length} records
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            class="px-3 py-1 rounded bg-surface-2 hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        {#each Array.from({ length: table.getPageCount() }, (_, i) => i) as pageIndex}
                            {#if pageIndex === 0 || pageIndex === table.getPageCount() - 1 || Math.abs(pageIndex - table.getState().pagination.pageIndex) <= 1}
                                <button
                                    onclick={() => table.setPageIndex(pageIndex)}
                                    class="px-3 py-1 rounded transition-colors"
                                    class:bg-primary-600={pageIndex === table.getState().pagination.pageIndex}
                                    class:text-fg={pageIndex === table.getState().pagination.pageIndex}
                                    class:bg-surface-2={pageIndex !== table.getState().pagination.pageIndex}
                                    class:hover:bg-surface-3={pageIndex !== table.getState().pagination.pageIndex}
                                >
                                    {pageIndex + 1}
                                </button>
                            {:else if pageIndex === 1 || pageIndex === table.getPageCount() - 2}
                                <span class="px-2">...</span>
                            {/if}
                        {/each}
                        <button
                            onclick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            class="px-3 py-1 rounded bg-surface-2 hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {:else if domain.toolState.dns.hasData}
        <div class="text-center py-8">
            <p class="text-fg-subtle">
                {filterType !== "ALL"
                    ? `No ${filterType} records found`
                    : "No DNS records found"}
            </p>
        </div>
    {/if}

    <!-- Record count -->
    <div class="text-xs text-fg-muted mt-2">
        Showing {filteredRecords.length}
        {filteredRecords.length === 1 ? "record" : "records"}
        {#if filterType !== "ALL"}
            of type {filterType}
        {/if}
    </div>
</div>
