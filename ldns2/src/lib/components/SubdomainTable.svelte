<script lang="ts">
    import {
        createTable,
        getCoreRowModel,
        getSortedRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
        type ColumnDef,
        type SortingState,
    } from '@tanstack/svelte-table';
    import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Copy, Check } from 'lucide-svelte';

    interface Props {
        subdomains: string[];
        loading?: boolean;
    }

    let { subdomains = [], loading = false }: Props = $props();

    interface SubdomainRow {
        subdomain: string;
    }

    const tableData = $derived<SubdomainRow[]>(
        subdomains.map((subdomain) => ({ subdomain }))
    );

    // Copy state tracking
    let copiedSubdomain = $state<string | null>(null);

    async function copyToClipboard(subdomain: string) {
        try {
            await navigator.clipboard.writeText(subdomain);
            copiedSubdomain = subdomain;
            setTimeout(() => {
                copiedSubdomain = null;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    // Table state
    let sorting = $state<SortingState>([]);
    let globalFilter = $state('');

    const columns: ColumnDef<SubdomainRow>[] = [
        {
            accessorKey: 'subdomain',
            header: 'Subdomain',
            cell: ({ getValue }) => getValue(),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            cell: ({ row }) => row.original.subdomain,
        },
    ];

    const table = $derived(createTable({
        get data() { return tableData; },
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
</script>

{#if loading}
    <div class="flex items-center justify-center py-8">
        <div class="text-gray-400">
            <svg class="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-400">Discovering subdomains...</p>
        </div>
    </div>
{:else if subdomains.length > 0}
    <div class="space-y-4">
        <!-- Search and page size controls -->
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="relative flex-1 max-w-sm">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search subdomains..."
                    bind:value={globalFilter}
                    class="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                />
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-400">
                <span>Show</span>
                <select
                    value={table.getState().pagination.pageSize}
                    onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
                    class="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-primary-500"
                >
                    {#each [10, 25, 50, 100] as size}
                        <option value={size}>{size}</option>
                    {/each}
                </select>
                <span>entries</span>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-700">
            <table class="w-full text-left text-sm text-gray-300">
                <thead class="bg-gray-800 text-xs uppercase text-gray-400">
                    {#each table.getHeaderGroups() as headerGroup}
                        <tr>
                            {#each headerGroup.headers as header}
                                <th
                                    class="px-4 py-3 font-medium"
                                    class:cursor-pointer={header.column.getCanSort()}
                                    onclick={header.column.getToggleSortingHandler()}
                                >
                                    <div class="flex items-center gap-2">
                                        {#if header.id === 'subdomain'}
                                            Subdomain
                                        {:else if header.id === 'actions'}
                                            Actions
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
                <tbody class="divide-y divide-gray-700">
                    {#each table.getRowModel().rows as row}
                        <tr class="hover:bg-gray-800/50 transition-colors">
                            {#each row.getVisibleCells() as cell}
                                <td class="px-4 py-3">
                                    {#if cell.column.id === 'subdomain'}
                                        <span class="text-white font-medium">{cell.getValue()}</span>
                                    {:else if cell.column.id === 'actions'}
                                        <div class="flex gap-2 items-center">
                                            <a
                                                href="/{row.original.subdomain}"
                                                data-sveltekit-preload-data="off"
                                                class="text-primary-400 hover:text-primary-300 text-xs"
                                            >
                                                Check DNS
                                            </a>
                                            <button
                                                onclick={() => copyToClipboard(row.original.subdomain)}
                                                class={`px-2 py-1 text-xs rounded transition-colors ${
                                                    copiedSubdomain === row.original.subdomain
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                                }`}
                                            >
                                                {#if copiedSubdomain === row.original.subdomain}
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
                                        </div>
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
            <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                <div>
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )} of {table.getFilteredRowModel().rows.length} subdomains
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    {#each Array.from({ length: table.getPageCount() }, (_, i) => i) as pageIndex}
                        {#if pageIndex === 0 || pageIndex === table.getPageCount() - 1 || Math.abs(pageIndex - table.getState().pagination.pageIndex) <= 1}
                            <button
                                onclick={() => table.setPageIndex(pageIndex)}
                                class="px-3 py-1 rounded transition-colors"
                                class:bg-primary-600={pageIndex === table.getState().pagination.pageIndex}
                                class:text-white={pageIndex === table.getState().pagination.pageIndex}
                                class:bg-gray-800={pageIndex !== table.getState().pagination.pageIndex}
                                class:hover:bg-gray-700={pageIndex !== table.getState().pagination.pageIndex}
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
                        class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div class="text-center py-4 text-gray-400">
        No subdomains found
    </div>
{/if}
