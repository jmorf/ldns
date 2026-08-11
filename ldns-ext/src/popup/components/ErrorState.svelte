<script lang="ts">
  import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-svelte';
  import { classifyUpstreamError } from '@ldns/core/upstream-errors';

  interface Props {
    message: string;
    /**
     * Name of the upstream service this lookup depends on. When set, the raw
     * error is turned into a plain explanation of what went wrong and whose
     * fault it is, instead of showing a bare status code.
     */
    service?: string;
    /** Treat HTTP 404 from the service as "nothing logged" rather than a fault. */
    notFoundIsEmpty?: boolean;
    /** Shown as a Retry button when the failure is worth retrying. */
    onRetry?: () => void;
    /** Optional link so the user can check the upstream service themselves. */
    statusUrl?: string;
  }

  let { message, service, notFoundIsEmpty = false, onRetry, statusUrl }: Props = $props();

  const failure = $derived(
    service ? classifyUpstreamError(new Error(message), { service, notFoundIsEmpty }) : null
  );
</script>

{#if failure}
  <div class="card border-bad-500/30 bg-bad-500/5">
    <div class="flex items-start gap-2">
      <AlertCircle class="w-4 h-4 text-bad-400 shrink-0 mt-0.5" />
      <div class="min-w-0">
        <p class="text-xs font-semibold text-bad-400">{failure.title}</p>
        <p class="text-[11px] text-fg-muted leading-relaxed mt-1">{failure.message}</p>
        {#if failure.hint}
          <p class="text-[11px] text-fg-subtle leading-relaxed mt-1">{failure.hint}</p>
        {/if}

        {#if onRetry || statusUrl}
          <div class="flex items-center gap-3 mt-2.5">
            {#if onRetry && failure.retryable}
              <button
                onclick={onRetry}
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-surface-2 border border-line rounded-lg text-fg-muted hover:text-fg hover:border-primary-500/40 transition-colors"
              >
                <RefreshCw class="w-3 h-3" />
                Try again
              </button>
            {/if}
            {#if statusUrl}
              <a
                href={statusUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[11px] text-fg-subtle hover:text-fg-muted transition-colors"
              >
                Check {service} directly
                <ExternalLink class="w-2.5 h-2.5" />
              </a>
            {/if}
          </div>
        {/if}

        <p class="text-[10px] text-fg-subtle mt-2 pt-2 border-t border-line">
          Only this tab depends on {service}. The other tabs are unaffected.
        </p>
      </div>
    </div>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center py-6 text-bad-400/90">
    <AlertCircle class="w-5 h-5 mb-2" />
    <p class="text-xs text-center max-w-[280px]">{message}</p>
    {#if onRetry}
      <button
        onclick={onRetry}
        class="mt-3 inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-surface-2 border border-line rounded-lg text-fg-muted hover:text-fg transition-colors"
      >
        <RefreshCw class="w-3 h-3" />
        Try again
      </button>
    {/if}
  </div>
{/if}
