<script lang="ts">
  import { onMount } from 'svelte';
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { DNS_ENDPOINTS } from '@ldns/core/constants';
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
  import ReviewPrompt from './components/ReviewPrompt.svelte';
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

  /** Domain of the browser tab we are currently mirroring, if any. */
  let followedTabDomain = $state<string | null>(null);

  /** Hostname of the active tab, or null for internal pages we can't inspect. */
  async function currentTabDomain(): Promise<string | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (
        !tab?.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('moz-extension://')
      ) {
        return null;
      }
      const domain = new URL(tab.url).hostname;
      return domain && domain.includes('.') ? domain : null;
    } catch (e) {
      console.error('[LDNS] Could not read the active tab:', e);
      return null;
    }
  }

  onMount(async () => {
    await extensionState.init();

    const tabDomain = await currentTabDomain();
    const session = await recallSession(5 * 60_000);

    // The tab you are looking at wins. The session is only restored when it
    // was saved on this same tab (so a manual lookup survives closing and
    // reopening) or when the tab has no domain to inspect. Preferring the
    // session unconditionally meant navigating to a new site and reopening
    // still showed the previous domain.
    let target: string | null = null;
    if (session?.domain && (!tabDomain || session.tabDomain === tabDomain)) {
      target = session.domain;
    } else if (tabDomain) {
      target = tabDomain;
    } else if (session?.domain) {
      target = session.domain;
    }

    followedTabDomain = tabDomain;
    if (target) {
      await extensionState.setDomain(target, true);
    }

    // The side panel stays mounted while you browse, so onMount alone would
    // leave it pinned to whatever was open when it launched. Follow the active
    // tab, but only while the panel is still showing that tab's domain: if the
    // user has typed a different domain, leave their lookup alone.
    if (isSidePanel && chrome.tabs?.onActivated) {
      const syncToTab = async () => {
        const next = await currentTabDomain();
        if (!next || next === followedTabDomain) return;
        const showingTab = !extensionState.domain || extensionState.domain === followedTabDomain;
        followedTabDomain = next;
        if (showingTab) await extensionState.setDomain(next, true);
      };

      chrome.tabs.onActivated.addListener(() => void syncToTab());
      chrome.tabs.onUpdated.addListener((_id, changeInfo, tab) => {
        // Only react once the navigation has committed a new URL.
        if (changeInfo.url && tab.active) void syncToTab();
      });
    }
  });

  // Persist active domain in session storage so reopens are instant.
  $effect(() => {
    const d = extensionState.domain;
    const ep = extensionState.endpoint;
    if (d && extensionState.isValidDomain) {
      rememberSession(d, ep, followedTabDomain ?? undefined);
    }
  });
</script>

<div
  class="relative w-full h-screen min-h-[720px] bg-surface text-fg flex flex-col overflow-hidden"
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

  <!-- Side-panel mode tip: shown once on the popup, requires explicit
       dismissal. Never shown inside the side panel itself or on browsers
       that don't support a side-panel API. -->
  <SidebarTipBanner onOpenSettings={() => (settingsOpen = true)} />
  <ReviewPrompt />

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
    <span class="font-mono">{DNS_ENDPOINTS[extensionState.endpoint].name}</span>
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
