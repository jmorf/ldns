<script lang="ts">
  /**
   * One-time tip banner nudging users to try side-panel mode. Shown only when
   *   - the host browser supports a side panel/sidebar API,
   *   - the popup is not already running inside the side panel, and
   *   - the user has never dismissed it.
   *
   * Dismissal is explicit (X or Got it) and persists in chrome.storage.local
   * via setSidebarTipSeen(). Once dismissed it never returns.
   */

  import { onMount } from 'svelte';
  import { Sidebar, X } from 'lucide-svelte';
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { sidePanelSupported } from '$lib/utils/sidepanel';
  import { getSidebarTipSeen, setSidebarTipSeen } from '$lib/utils/storage';

  interface Props {
    onOpenSettings: () => void;
  }

  let { onOpenSettings }: Props = $props();

  let visible = $state(false);

  // Re-evaluate visibility once the popup mounts. We hide the banner if the
  // popup is already in side-panel mode (the user clearly knows the feature
  // exists) and if the runtime doesn't expose either side-panel API.
  const isInSidePanel =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sp');

  onMount(async () => {
    if (isInSidePanel) return;
    if (!sidePanelSupported()) return;
    const seen = await getSidebarTipSeen();
    if (!seen) visible = true;
  });

  async function dismiss() {
    visible = false;
    await setSidebarTipSeen();
  }

  async function tryIt() {
    // Flip the setting on, then mark the tip seen and close the banner.
    // The user can revert from Settings if they didn't mean to enable it.
    await extensionState.updateSettings({ sidePanelMode: true });
    await dismiss();
    onOpenSettings();
  }
</script>

{#if visible}
  <div
    class="border-b border-line bg-primary-500/8 px-4 py-2.5 flex items-start gap-3"
    role="region"
    aria-label="Side panel tip"
  >
    <Sidebar class="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p class="text-[12px] text-fg leading-snug">
        <span class="font-medium">Tip:</span> turn on Side panel mode to keep LDNS
        open while you browse.
      </p>
      <div class="mt-1.5 flex items-center gap-2">
        <button
          onclick={tryIt}
          class="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Try it
        </button>
        <span class="text-fg-subtle text-[11px]">·</span>
        <button
          onclick={dismiss}
          class="text-[11px] text-fg-muted hover:text-fg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
    <button
      onclick={dismiss}
      class="p-1 -m-1 text-fg-subtle hover:text-fg transition-colors flex-shrink-0"
      aria-label="Dismiss tip"
      title="Dismiss"
    >
      <X class="w-3.5 h-3.5" />
    </button>
  </div>
{/if}
