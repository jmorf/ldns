<script lang="ts">
  import { checkCaaAgainstIssuer, type CaaIssuerCheck } from '@ldns/core/caa-check';
  import { ShieldAlert, ShieldCheck, Info } from 'lucide-svelte';

  interface Props {
    /** Raw CAA rdata strings from the DNS lookup. */
    caaRecords: string[];
    /** Issuer string from the certificate (Certificate Transparency). */
    certIssuer: string | null | undefined;
  }

  let { caaRecords = [], certIssuer }: Props = $props();

  // Pure comparison of data both already fetched — no extra network request.
  const result = $derived<CaaIssuerCheck>(checkCaaAgainstIssuer(caaRecords, certIssuer));
</script>

<div class="bg-surface-2 border border-line rounded-xl p-4">
  <h3 class="text-sm font-medium text-fg mb-2">CAA policy vs. actual issuer</h3>

  <div class="flex items-start gap-2">
    {#if result.verdict === 'covered'}
      <ShieldCheck class="w-4 h-4 text-ok-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-ok-400 font-medium">CAA permits the issuing CA</p>
        <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
      </div>
    {:else if result.verdict === 'not-covered'}
      <ShieldAlert class="w-4 h-4 text-warn-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-warn-400 font-medium">Mismatch — renewals may fail</p>
        <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
      </div>
    {:else if result.verdict === 'forbids-all'}
      <ShieldAlert class="w-4 h-4 text-bad-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-bad-400 font-medium">CAA forbids all issuance</p>
        <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
      </div>
    {:else}
      <Info class="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-fg-muted font-medium">
          {result.verdict === 'no-caa' ? 'No CAA records' : 'Could not verify'}
        </p>
        <p class="text-xs text-fg-muted mt-0.5 leading-relaxed">{result.explanation}</p>
      </div>
    {/if}
  </div>

  {#if result.allowed.length > 0}
    <div class="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-2 text-xs">
      <span class="text-fg-subtle">Permitted:</span>
      {#each result.allowed as ca}
        <span class="px-1.5 py-0.5 bg-surface-3 text-fg-muted rounded font-mono">{ca}</span>
      {/each}
    </div>
  {/if}
  {#if result.rawIssuer}
    <p class="text-xs text-fg-subtle mt-2 font-mono break-all">Issued by: {result.rawIssuer}</p>
  {/if}
</div>
