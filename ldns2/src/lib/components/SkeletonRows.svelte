<script lang="ts">
  interface Props {
    rows?: number;
  }
  let { rows = 3 }: Props = $props();
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'];
</script>

<div class="py-4 space-y-2">
  {#each Array(rows) as _, i}
    <div class={`h-3 bg-gray-800 rounded ${widths[i % widths.length]} relative overflow-hidden`}>
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent shimmer"></div>
    </div>
  {/each}
</div>

<style>
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer {
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
</style>
