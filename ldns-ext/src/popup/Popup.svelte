<script lang="ts">
  import { onMount } from 'svelte';
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { Settings as SettingsIcon, Sun, Moon, Monitor } from 'lucide-svelte';
  import ExportMenu from './components/ExportMenu.svelte';
  import { recallSession, rememberSession } from '$lib/utils/storage';
  import { feedbackUrl } from '$lib/utils/feedback';
  import SearchForm from './components/SearchForm.svelte';
  import TabNavigation from './components/TabNavigation.svelte';
  import DnsResults from './components/DnsResults.svelte';
  import RdapResults from './components/RdapResults.svelte';
  import EmailResults from './components/EmailResults.svelte';
  import RecentSearches from './components/RecentSearches.svelte';
  import SettingsSheet from './components/SettingsSheet.svelte';
  import SidebarTipBanner from './components/SidebarTipBanner.svelte';
  import LoadingState from './components/LoadingState.svelte';

  // Lazy-load heavy tab components
  const ServerResults = $state<{ value: typeof import('./components/ServerResults.svelte').default | null }>({ value: null });
  const SubdomainResults = $state<{ value: typeof import('./components/SubdomainResults.svelte').default | null }>({ value: null });

  let settingsOpen = $state(false);

  $effect(() => {
    if (extensionState.activeTab === 'server' && !ServerResults.value) {
      import('./components/ServerResults.svelte').then((m) => (ServerResults.value = m.default));
    }
    if (extensionState.activeTab === 'subdomains' && !SubdomainResults.value) {
      import('./components/SubdomainResults.svelte').then((m) => (SubdomainResults.value = m.default));
    }
  });

  // Detect side-panel mode via the `?sp=1` query param baked into the side
  // panel manifest path. Set a class on <html> so CSS sizing adapts.
  const isSidePanel = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sp');
  if (typeof document !== 'undefined' && isSidePanel) {
    document.documentElement.classList.add('sidepanel');
  }

  onMount(async () => {
    await extensionState.init();

    let target: string | null = null;

    // Prefer recently-active session (popup just closed → reopened) so we
    // restore the last lookup immediately without re-querying.
    const session = await recallSession(5 * 60_000);
    if (session?.domain) {
      target = session.domain;
    } else {
      // Auto-lookup current tab domain
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (
          tab?.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('about:') &&
          !tab.url.startsWith('edge://') &&
          !tab.url.startsWith('chrome-extension://')
        ) {
          const url = new URL(tab.url);
          const domain = url.hostname;
          if (domain && domain.includes('.')) target = domain;
        }
      } catch (e) {
        console.error('[LDNS] Auto-lookup failed:', e);
      }
    }

    if (target) {
      await extensionState.setDomain(target, true);
    }
  });

  // Persist active domain in session storage so reopens are instant.
  $effect(() => {
    const d = extensionState.domain;
    const ep = extensionState.endpoint;
    if (d && extensionState.isValidDomain) {
      rememberSession(d, ep);
    }
  });
</script>

<div
  class="relative w-full h-screen min-h-[720px] bg-surface text-fg flex flex-col overflow-hidden"
  class:light={extensionState.theme === 'light'}
>
  {#if extensionState.settings.grain}
    <div class="grain"></div>
  {/if}

  <!-- Header -->
  <header class="relative z-40 px-4 py-2.5 border-b border-line flex items-center justify-between bg-surface/80 backdrop-blur-sm">
    <a
      href="https://ldns.com"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 text-fg hover:text-primary-400 transition-colors"
      aria-label="LDNS home"
    >
      <img
        src={chrome.runtime.getURL('icons/icon-48.png')}
        alt=""
        class="w-5 h-5 rounded-md"
      />
      <span class="text-[13px] font-semibold tracking-tight">LDNS</span>
      <span class="text-[10px] text-fg-subtle font-mono tnum">v{__APP_VERSION__}</span>
    </a>
    <div class="flex items-center gap-1">
      {#if extensionState.domain && extensionState.isValidDomain}
        <ExportMenu />
      {/if}
      <button
        onclick={() => (settingsOpen = true)}
        class="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg transition-colors"
        aria-label="Open settings"
        title="Settings"
      >
        <SettingsIcon class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => extensionState.toggleTheme()}
        class="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg transition-colors"
        aria-label={`Theme: ${extensionState.theme} (click to change)`}
        title={extensionState.theme === 'system'
          ? `System (${extensionState.resolvedTheme})`
          : extensionState.theme === 'dark'
            ? 'Dark mode'
            : 'Light mode'}
      >
        {#if extensionState.theme === 'system'}
          <Monitor class="w-3.5 h-3.5" />
        {:else if extensionState.theme === 'dark'}
          <Moon class="w-3.5 h-3.5" />
        {:else}
          <Sun class="w-3.5 h-3.5" />
        {/if}
      </button>
    </div>
  </header>

  <!-- Side-panel mode tip — shown once on the popup, requires explicit
       dismissal. Never shown inside the side panel itself or on browsers
       that don't support a side-panel API. -->
  <SidebarTipBanner onOpenSettings={() => (settingsOpen = true)} />

  <!-- Search Form -->
  <div class="px-4 py-3 border-b border-line">
    <SearchForm />
  </div>

  {#if extensionState.domain && extensionState.isValidDomain}
    <TabNavigation />
    <div class="flex-1 overflow-y-auto px-4 py-3">
      {#if extensionState.activeTab === 'dns'}
        <DnsResults />
      {:else if extensionState.activeTab === 'rdap'}
        <RdapResults />
      {:else if extensionState.activeTab === 'email'}
        <EmailResults />
      {:else if extensionState.activeTab === 'server'}
        {#if ServerResults.value}
          <ServerResults.value />
        {:else}
          <LoadingState message="Loading Server module…" />
        {/if}
      {:else if extensionState.activeTab === 'subdomains'}
        {#if SubdomainResults.value}
          <SubdomainResults.value />
        {:else}
          <LoadingState message="Loading Subdomains module…" />
        {/if}
      {/if}
    </div>
  {:else}
    <div class="flex-1 overflow-y-auto px-4 py-3">
      <RecentSearches />
    </div>
  {/if}

  <!-- Footer -->
  <footer class="px-4 py-1.5 border-t border-line flex items-center justify-between text-[10px] text-fg-subtle">
    <span class="font-mono">{extensionState.endpoint === 'cloudflare' ? 'Cloudflare DNS' : extensionState.endpoint === 'google' ? 'Google DNS' : 'DNS.SB'}</span>
    <span class="flex items-center gap-2">
      <a
        href={feedbackUrl()}
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-fg-muted transition-colors"
        title="Report a bug or send feedback (opens GitHub)"
      >Report a bug</a>
      <span aria-hidden="true">·</span>
      <span>ldns.com</span>
    </span>
  </footer>

  <SettingsSheet open={settingsOpen} onClose={() => (settingsOpen = false)} />
</div>
