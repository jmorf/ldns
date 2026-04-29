<script lang="ts">
  import { AlertCircle } from 'lucide-svelte';

  interface Props {
    message: string;
  }

  let { message }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-6 text-bad-400/90">
  <AlertCircle class="w-5 h-5 mb-2" />
  <p class="text-xs text-center max-w-[280px]">{message}</p>
</div>
