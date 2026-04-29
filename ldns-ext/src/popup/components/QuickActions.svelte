<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import { ExternalLink } from 'lucide-svelte';

  interface Props {
    tab: 'dns' | 'rdap' | 'email' | 'server' | 'subdomains';
  }

  let { tab }: Props = $props();

  interface Action {
    label: string;
    href: (domain: string) => string;
  }

  const base = (d: string, sub = '') => `https://ldns.com/${encodeURIComponent(d)}${sub}`;

  const ACTIONS: Record<Props['tab'], Action[]> = {
    dns: [
      { label: 'Full DNS report', href: (d) => base(d) },
      { label: 'A records', href: (d) => base(d, '/a') },
      { label: 'NS', href: (d) => base(d, '/ns') },
      { label: 'TXT', href: (d) => base(d, '/txt') },
      { label: 'Propagation', href: (d) => base(d, '/propagation') }
    ],
    rdap: [
      { label: 'Full RDAP report', href: (d) => base(d, '/rdap') },
      { label: 'WHOIS view', href: (d) => base(d, '/whois') }
    ],
    email: [
      { label: 'Email overview', href: (d) => base(d, '/email') },
      { label: 'MX', href: (d) => base(d, '/mx') },
      { label: 'SPF', href: (d) => base(d, '/spf') },
      { label: 'DMARC', href: (d) => base(d, '/dmarc') }
    ],
    server: [
      { label: 'Server report', href: (d) => base(d, '/server') },
      { label: 'IP', href: (d) => base(d, '/ip') },
      { label: 'Reverse DNS', href: (d) => base(d, '/reverse-dns') },
      { label: 'Security', href: (d) => base(d, '/security') }
    ],
    subdomains: [
      { label: 'Subdomain report', href: (d) => base(d, '/subdomains') }
    ]
  };

  const domain = $derived(extensionState.rootDomain || extensionState.domain);
  const actions = $derived(ACTIONS[tab]);
</script>

{#if domain && actions.length > 0}
  <div class="pt-2 mt-1 border-t border-line">
    <p class="text-[10px] text-fg-subtle uppercase tracking-wide mb-1.5">Open on ldns.com</p>
    <div class="flex flex-wrap gap-1">
      {#each actions as action}
        <a
          href={action.href(domain)}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-surface-2 hover:bg-surface-3 border border-line rounded-md text-fg-muted hover:text-fg transition-colors"
        >
          {action.label}
          <ExternalLink class="w-2.5 h-2.5 opacity-60" />
        </a>
      {/each}
    </div>
  </div>
{/if}
