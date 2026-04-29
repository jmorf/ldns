<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import ContentNav from '$lib/components/ContentNav.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-surface text-fg">
  <ContentNav />
  <main class="flex-1 w-full">
    {@render children()}
  </main>
  <Footer />
</div>
