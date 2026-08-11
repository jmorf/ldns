<script lang="ts">
  import { evaluateSpf, type SpfEvaluation } from '@ldns/core/spf-eval';

  interface Props {
    domain: string;
    /** Skip the walk entirely when the domain has no SPF record. */
    hasSpf?: boolean;
  }

  let { domain, hasSpf = true }: Props = $props();

  let evaluation = $state<SpfEvaluation | null>(null);
  let loading = $state(false);

  // Walking the include tree costs one DNS query per include, so only do it
  // when there's an SPF record to walk, and guard against a slow result for a
  // previous domain landing after the user moved on.
  $effect(() => {
    const d = domain;
    if (!d || !hasSpf) {
      evaluation = null;
      return;
    }
    loading = true;
    evaluation = null;
    let cancelled = false;
    evaluateSpf(d)
      .then((r) => {
        if (!cancelled) evaluation = r;
      })
      .catch(() => {
        if (!cancelled) evaluation = null;
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
    return () => {
      cancelled = true;
    };
  });

  const pct = $derived(
    evaluation ? Math.min(100, (evaluation.lookups / evaluation.limit) * 100) : 0
  );
  const tone = $derived(
    !evaluation ? 'ok' : evaluation.exceeded ? 'bad' : evaluation.lookups >= 8 ? 'warn' : 'ok'
  );
  const barClass = $derived(
    tone === 'bad' ? 'bg-bad-500' : tone === 'warn' ? 'bg-warn-500' : 'bg-ok-500'
  );
  const textClass = $derived(
    tone === 'bad' ? 'text-bad-400' : tone === 'warn' ? 'text-warn-400' : 'text-ok-400'
  );
</script>

{#if hasSpf}
  <div class="bg-surface-2 border border-line rounded-xl p-4">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-medium text-fg">DNS lookup budget</h3>
      {#if evaluation}
        <span class="text-sm font-mono tnum font-semibold {textClass}">
          {evaluation.lookups} / {evaluation.limit}
        </span>
      {:else if loading}
        <span class="text-xs text-fg-subtle">checking…</span>
      {/if}
    </div>

    {#if evaluation}
      <div class="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div class="h-full rounded-full transition-all {barClass}" style={`width: ${pct}%`}></div>
      </div>

      <p class="text-xs text-fg-muted mt-2 leading-relaxed">
        {#if evaluation.exceeded}
          <span class="text-bad-400 font-medium">Over the limit.</span>
          SPF evaluation is capped at {evaluation.limit} DNS lookups by RFC 7208. Receivers
          return <span class="font-mono">permerror</span> and SPF fails, even though the record
          itself looks valid. Reduce nested <span class="font-mono">include:</span> chains or
          flatten them to IP ranges.
        {:else if evaluation.lookups >= 8}
          <span class="text-warn-400 font-medium">Close to the limit.</span>
          RFC 7208 allows {evaluation.limit}. Adding one more provider could push this over and
          silently break SPF.
        {:else}
          Within the RFC 7208 limit of {evaluation.limit} lookups.
        {/if}
      </p>

      {#if evaluation.voidExceeded}
        <p class="text-xs text-warn-400 mt-1 leading-relaxed">
          {evaluation.voidLookups} void lookups (limit {evaluation.voidLimit}): some includes
          resolve to nothing, usually a provider you no longer use.
        </p>
      {/if}
      {#if evaluation.loops.length > 0}
        <p class="text-xs text-bad-400 mt-1 leading-relaxed">
          Include loop detected via {evaluation.loops.join(', ')}.
        </p>
      {/if}

      {#if evaluation.tree.length > 0}
        <details class="mt-3">
          <summary class="text-xs text-fg-muted cursor-pointer hover:text-fg">
            Show which terms consume lookups
          </summary>
          <ul class="mt-2 space-y-1 text-xs font-mono">
            {#each evaluation.tree as node}
              <li>
                <span class="text-fg">{node.term}</span>
                {#if node.void}<span class="text-warn-400 ml-2">(no record)</span>{/if}
                {#if node.note}<span class="text-fg-subtle ml-2">({node.note})</span>{/if}
                {#if node.children.length > 0}
                  <ul class="ml-4 mt-1 space-y-1 border-l border-line pl-3">
                    {#each node.children as child}
                      <li>
                        <span class="text-fg-muted">{child.term}</span>
                        {#if child.void}<span class="text-warn-400 ml-2">(no record)</span>{/if}
                        {#if child.children.length > 0}
                          <span class="text-fg-subtle ml-2">+{child.children.length} nested</span>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    {/if}
  </div>
{/if}
