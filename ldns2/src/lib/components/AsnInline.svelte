<script lang="ts">
  import type { AsnInfo } from '@ldns/core/types';

  interface Props {
    info: AsnInfo | null | undefined;
  }
  let { info }: Props = $props();
</script>

{#if info && info.asn}
  <span class="inline-flex items-center gap-2 text-[11px] text-gray-400 font-mono">
    <span class="text-gray-200">AS{info.asn}</span>
    {#if info.country}<span class="text-gray-500">·</span><span>{info.country}</span>{/if}
    {#if info.asName}<span class="text-gray-500">·</span><span class="text-gray-300 truncate max-w-[220px]" title={info.asName}>{info.asName}</span>{/if}
    {#if info.prefix}<span class="text-gray-500">·</span><span class="text-gray-500">{info.prefix}</span>{/if}
  </span>
{/if}
