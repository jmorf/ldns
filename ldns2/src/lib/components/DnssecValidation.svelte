<script lang="ts">
  import { checkDnssec, type DnssecCheck } from '@ldns/core/dnssec-check';
  import { ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-svelte';

  interface Props {
    domain: string;
  }

  let { domain }: Props = $props();

  let result = $state<DnssecCheck | null>(null);
  let loading = $state(false);

  $effect(() => {
    const d = domain;
    if (!d) {
      result = null;
      return;
    }
    loading = true;
    result = null;
    let cancelled = false;
    checkDnssec(d)
      .then((r) => {
        if (!cancelled) result = r;
      })
      .catch(() => {
        if (!cancelled) result = null;
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="bg-surface-2 border border-line rounded-xl p-4">
  <h3 class="text-sm font-medium text-fg mb-2">DNSSEC validation</h3>

  {#if loading}
    <p class="text-xs text-fg-subtle">Checking the chain of trust…</p>
  {:else if result}
    <div class="flex items-start gap-2">
      {#if result.status === 'secure'}
        <ShieldCheck class="w-4 h-4 text-ok-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-ok-400 font-medium">Signed and valid</p>
          <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
        </div>
      {:else if result.status === 'bogus'}
        <ShieldAlert class="w-4 h-4 text-bad-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-bad-400 font-medium">Broken — domain unreachable for many users</p>
          <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
        </div>
      {:else if result.status === 'insecure'}
        <ShieldOff class="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-fg-muted font-medium">Not signed</p>
          <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
        </div>
      {:else}
        <ShieldOff class="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
        <p class="text-xs text-fg-muted">{result.explanation}</p>
      {/if}
    </div>
  {/if}
</div>
