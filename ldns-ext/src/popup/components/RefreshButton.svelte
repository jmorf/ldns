<script lang="ts">
  import { RefreshCw } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';

  interface Props {
    onClick: () => void;
    loading?: boolean;
    label?: string;
  }

  let { onClick, loading = false, label = 'Refresh' }: Props = $props();
</script>

<button
  onclick={onClick}
  disabled={loading}
  class="flex items-center gap-1 px-2 py-0.5 text-[10px] text-fg-muted hover:text-fg hover:bg-surface-3 rounded-lg transition-colors disabled:opacity-50"
  aria-label={label}
  title={label}
>
  <RefreshCw class={cn('w-3 h-3', loading && 'animate-spin')} />
  <span>{label}</span>
</button>
