<script lang="ts">
  /**
   * One-time ask for a rating or feedback, shown only to established users
   * (see the eligibility rules in storage.ts).
   *
   * Both actions are always offered together. Chrome Web Store policy
   * prohibits review gating (asking "do you like it?" first and routing only
   * happy users to the store), so this never pre-screens sentiment: rating
   * and feedback sit side by side and the user picks.
   */

  import { onMount } from 'svelte';
  import { Heart, X } from 'lucide-svelte';
  import {
    getSidebarTipSeen,
    shouldShowReviewPrompt,
    snoozeReviewPrompt,
    completeReviewPrompt
  } from '$lib/utils/storage';
  import { sidePanelSupported } from '$lib/utils/sidepanel';
  import { feedbackUrl } from '$lib/utils/feedback';

  const CHROME_REVIEW_URL =
    'https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn/reviews';
  const FIREFOX_REVIEW_URL =
    'https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/reviews/';

  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox/');
  const reviewUrl = isFirefox ? FIREFOX_REVIEW_URL : CHROME_REVIEW_URL;
  const storeName = isFirefox ? 'Firefox Add-ons' : 'the Chrome Web Store';

  let visible = $state(false);

  /** Open a URL in a new tab. chrome.tabs.create is the reliable path from an
   *  extension popup in both browsers; window.open is the dev-mode fallback. */
  function openTab(url: string) {
    if (chrome?.tabs?.create) {
      void chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  const isInSidePanel =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sp');

  onMount(async () => {
    // Never stack banners: if the side-panel tip is still pending (and would
    // render), let it have the slot. This prompt is patient by design.
    const tipSeen = await getSidebarTipSeen();
    const tipWouldShow = !tipSeen && !isInSidePanel && sidePanelSupported();
    if (tipWouldShow) return;

    visible = await shouldShowReviewPrompt();
  });

  async function rate() {
    visible = false;
    // Persist BEFORE opening the tab: opening it closes the popup, and a
    // write that has not committed by then would resurrect the prompt.
    await completeReviewPrompt();
    openTab(reviewUrl);
  }

  async function sendFeedback() {
    visible = false;
    await completeReviewPrompt();
    openTab(feedbackUrl());
  }

  async function later() {
    visible = false;
    await snoozeReviewPrompt();
  }
</script>

{#if visible}
  <div
    class="border-b border-line bg-primary-500/8 px-4 py-2.5 flex items-start gap-3"
    role="region"
    aria-label="Rate or send feedback"
  >
    <Heart class="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p class="text-[12px] text-fg leading-snug">
        <span class="font-medium">Enjoying LDNS?</span> A rating on {storeName} helps other
        domain nerds find it. Something broken or missing? Tell me instead.
      </p>
      <div class="mt-1.5 flex items-center gap-2 flex-wrap">
        <button
          onclick={rate}
          class="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Rate it
        </button>
        <span class="text-fg-subtle text-[11px]">·</span>
        <button
          onclick={sendFeedback}
          class="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Send feedback
        </button>
        <span class="text-fg-subtle text-[11px]">·</span>
        <button
          onclick={later}
          class="text-[11px] text-fg-muted hover:text-fg transition-colors"
        >
          Later
        </button>
      </div>
    </div>
    <button
      onclick={later}
      class="p-1 -m-1 text-fg-subtle hover:text-fg transition-colors flex-shrink-0"
      aria-label="Not now"
      title="Not now"
    >
      <X class="w-3.5 h-3.5" />
    </button>
  </div>
{/if}
