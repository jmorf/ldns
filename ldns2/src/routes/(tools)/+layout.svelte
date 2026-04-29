<script lang="ts">
    import '../../app.css';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import { page } from '$app/stores';
    import { navigationState } from '$lib/state.svelte';
    import { Menu } from 'lucide-svelte';

    let { children } = $props();

    $effect(() => {
        // Close mobile sidebar on every navigation. Sidebar itself derives
        // the active item from the URL — no separate currentPage state needed.
        $page.url.pathname;
        navigationState.closeSidebar();
    });
</script>

<div class="bg-surface min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-[256px_1fr]">
    <!-- Mobile header -->
    <div class="lg:hidden bg-surface-2 border-b border-line p-4 flex items-center justify-between">
        <div class="flex items-center">
            <button
                onclick={() => navigationState.toggleSidebar()}
                class="p-2 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg"
                aria-label="Toggle sidebar"
            >
                <Menu class="w-5 h-5" />
            </button>
            <div class="ml-3 flex items-center">
                <img src="/favicon.ico" class="h-7 mr-2" alt="LDNS" />
                <span class="text-lg font-semibold tracking-tight text-fg">LDNS</span>
            </div>
        </div>
        <ThemeToggle />
    </div>

    <Sidebar />

    <main class="overflow-auto px-6 py-6 lg:col-start-2">
        {@render children()}
    </main>
</div>
