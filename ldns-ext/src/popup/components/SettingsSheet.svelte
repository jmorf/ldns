<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { X, Settings as SettingsIcon, ExternalLink, Bug } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';
  import { sidePanelSupported } from '$lib/utils/sidepanel';
  import { feedbackUrl, X_PROFILE_URL, X_HANDLE } from '$lib/utils/feedback';

  const hasSidePanel = sidePanelSupported();

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  type SettingKey = 'funMessages' | 'grain' | 'sidePanelMode';

  function toggle(key: SettingKey) {
    extensionState.updateSettings({ [key]: !extensionState.settings[key] });
  }

  const rows: Array<{
    key: SettingKey;
    label: string;
    hint: string;
  }> = [
    {
      key: 'sidePanelMode',
      label: 'Side panel mode',
      hint: 'Open LDNS as a side panel instead of a popup, so it stays pinned while you browse.'
    },
    {
      key: 'funMessages',
      label: 'Playful loading messages',
      hint: 'Cycles light-hearted text after 5 seconds of waiting.'
    },
    {
      key: 'grain',
      label: 'Grain overlay',
      hint: 'Subtle film grain texture on the popup background.'
    }
  ];
</script>

{#if open}
  <button
    aria-label="Close settings"
    class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px]"
    onclick={onClose}
  ></button>
  <section
    class="absolute inset-x-0 bottom-0 z-30 bg-surface-2 border-t border-line rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
    aria-label="Settings panel"
  >
    <header class="flex items-center justify-between px-4 py-3 border-b border-line">
      <div class="flex items-center gap-2">
        <SettingsIcon class="w-3.5 h-3.5 text-primary-400" />
        <h2 class="text-xs font-medium tracking-wide uppercase text-fg-muted">Settings</h2>
      </div>
      <button
        onclick={onClose}
        class="p-1 text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg transition-colors active:scale-[0.96]"
        aria-label="Close"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </header>

    <div class="px-4 py-3 space-y-3 max-h-[460px] overflow-y-auto">
      {#each rows.filter((r) => r.key !== 'sidePanelMode' || hasSidePanel) as row}
        <button
          onclick={() => toggle(row.key)}
          class="w-full flex items-start gap-3 text-left p-2.5 rounded-xl hover:bg-surface-3 transition-colors active:scale-[0.99]"
        >
          <span
            class={cn(
              'mt-0.5 w-7 h-4 rounded-full relative transition-colors flex-shrink-0',
              extensionState.settings[row.key] ? 'bg-primary-500' : 'bg-surface-3 border border-line'
            )}
          >
            <span
              class={cn(
                'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow',
                extensionState.settings[row.key] ? 'left-3.5' : 'left-0.5'
              )}
            ></span>
          </span>
          <span class="flex-1 min-w-0">
            <span class="flex items-center gap-1.5">
              <span class="text-xs font-medium text-fg">{row.label}</span>
            </span>
            <span class="block text-[10px] text-fg-muted mt-0.5">{row.hint}</span>
          </span>
        </button>
      {/each}

      <!-- Optional CertSpotter key. Stored locally; nothing is proxied. -->
      <div class="pt-2 border-t border-line">
        <label class="block px-2.5 py-2">
          <span class="text-xs font-medium text-fg">CertSpotter API key</span>
          <span class="block text-[10px] text-fg-muted mt-0.5 leading-relaxed">
            Optional. Subdomain discovery falls back to CertSpotter when crt.sh is down, but the
            free tier allows only a few lookups per hour per IP. A key removes that limit. It is
            stored only in this browser and sent only to api.certspotter.com.
          </span>
          <input
            type="password"
            autocomplete="off"
            spellcheck="false"
            placeholder="Paste key (leave blank to use the free tier)"
            value={extensionState.settings.certSpotterKey ?? ''}
            onchange={(e) => extensionState.updateSettings({ certSpotterKey: e.currentTarget.value.trim() })}
            class="w-full mt-2 px-2 py-1.5 text-[11px] font-mono bg-surface-2 border border-line rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:border-primary-500/50"
          />
          <a
            href="https://sslmate.com/signup?for=ct_search_api"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block text-[10px] text-primary-400 hover:text-primary-300 mt-1.5"
          >Get a free key from SSLMate</a>
        </label>
      </div>

      <div class="pt-2 border-t border-line">
        <a
          href={feedbackUrl()}
          target="_blank"
          rel="noopener noreferrer"
          class="w-full flex items-start gap-3 text-left p-2.5 rounded-xl hover:bg-surface-3 transition-colors active:scale-[0.99]"
        >
          <Bug class="mt-0.5 w-4 h-4 text-primary-400 flex-shrink-0" />
          <span class="flex-1 min-w-0">
            <span class="flex items-center gap-1.5">
              <span class="text-xs font-medium text-fg">Report a bug or send feedback</span>
              <ExternalLink class="w-2.5 h-2.5 text-fg-muted opacity-70" />
            </span>
            <span class="block text-[10px] text-fg-muted mt-0.5">Opens a GitHub issue prefilled with your extension version and browser. Nothing is sent until you submit it.</span>
          </span>
        </a>
        <p class="text-[10px] text-fg-muted px-2.5 mt-1">
          You can also reach
          <a
            href={X_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-400 hover:text-primary-300"
          >{X_HANDLE} on X</a>.
        </p>
      </div>

      <div class="pt-2 border-t border-line">
        <p class="text-[10px] text-fg-muted leading-relaxed px-1">
          Every lookup goes straight from your browser to public DNS and registry services. Nothing is sent to LDNS. See the
          <a
            class="text-primary-400 hover:text-primary-300 inline-flex items-center gap-0.5"
            href="https://ldns.com/extension/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            full privacy policy
            <ExternalLink class="w-2.5 h-2.5 opacity-70" />
          </a>.
        </p>
      </div>
    </div>
  </section>
{/if}
