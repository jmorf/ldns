<script lang="ts">
  import { onMount } from 'svelte';
  import { extensionState } from '$lib/state/extension-state.svelte';

  interface Props {
    message?: string;
    rows?: number;
  }

  let { message = 'Loading…', rows = 3 }: Props = $props();

  let messageIndex = $state(0);
  let elapsed = $state(0);

  const funMessages = [
    'Still working on it…',
    'Packets are traveling…',
    'Negotiating with servers…',
    'Almost there…',
    'Tracing routes…'
  ];

  const showFun = $derived(elapsed >= 5000 && extensionState.settings.funMessages);
  const display = $derived(showFun ? funMessages[messageIndex % funMessages.length] : message);

  onMount(() => {
    const tick = setInterval(() => {
      elapsed += 1000;
      if (elapsed >= 5000) messageIndex += 1;
    }, 1000);
    return () => clearInterval(tick);
  });

  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'];
</script>

<div class="py-4 space-y-2">
  {#each Array(rows) as _, i}
    <div class={`h-3 bg-surface-3 rounded ${widths[i % widths.length]} relative overflow-hidden`}>
      <div class="absolute inset-0 shimmer"></div>
    </div>
  {/each}
  <p class="text-[10px] text-fg-subtle pt-2 text-center">{display}</p>
</div>
