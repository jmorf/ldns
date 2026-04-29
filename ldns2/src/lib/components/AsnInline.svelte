<script lang="ts">
  import type { AsnInfo } from '@ldns/core/types';

  interface Props {
    info: AsnInfo | null | undefined;
  }
  let { info }: Props = $props();
</script>

{#if info && info.asn}
  <span class="inline-flex items-center gap-2 text-[11px] text-fg-muted font-mono">
    <span class="text-fg">AS{info.asn}</span>
    {#if info.country}<span class="text-fg-subtle">·</span><span>{info.country}</span>{/if}
    {#if info.asName}<span class="text-fg-subtle">·</span><span class="text-fg-muted truncate max-w-[220px]" title={info.asName}>{info.asName}</span>{/if}
    {#if info.prefix}<span class="text-fg-subtle">·</span><span class="text-fg-subtle">{info.prefix}</span>{/if}
  </span>
{/if}
