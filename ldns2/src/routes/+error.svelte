<script lang="ts">
  import { page } from '$app/stores';
  import DomainForm from '$lib/components/DomainForm.svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';
</script>

<div class="min-h-screen bg-surface text-fg flex items-center justify-center px-4">
  <div class="max-w-2xl mx-auto text-center">
    <p class="font-mono text-[10px] uppercase tracking-wider text-fg-subtle mb-3">
      <span class="text-primary-500/80">// </span>HTTP {$page.status}
    </p>
    <h1 class="text-7xl sm:text-8xl font-semibold tracking-tight text-fg tabular-nums mb-2">{$page.status}</h1>

    {#if $page.status === 404}
      <h2 class="text-2xl font-medium text-primary-500 mb-3">No A record for this path</h2>
      <p class="text-fg-muted leading-relaxed mb-6 max-w-md mx-auto">
        The page you tried to load doesn't resolve. If you were looking up a domain, try entering it below.
      </p>
      <div class="max-w-md mx-auto mb-6">
        <DomainForm />
      </div>
    {:else}
      <h2 class="text-2xl font-medium text-bad-400 mb-3">Something went wrong</h2>
      <p class="text-fg-muted leading-relaxed mb-6">Something went wrong.</p>
    {/if}

    {#if $page.error?.message}
      <p class="font-mono text-xs text-fg-subtle mb-6 break-all">
        {$page.error.message}
      </p>
    {/if}

    <a
      href="/"
      class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
    >
      Go home →
    </a>
  </div>
</div>
