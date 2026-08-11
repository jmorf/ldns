<script lang="ts">
  import { extensionState } from '$lib/state/extension-state.svelte';
  import LoadingState from './LoadingState.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import RefreshButton from './RefreshButton.svelte';
  import QuickActions from './QuickActions.svelte';
  import CopyRow from './CopyRow.svelte';
  import { getSPFPolicyDescription, getDMARCPolicyDescription, getPolicyColor } from '@ldns/core/parsers';
  import { Mail, KeyRound, Image, Lock } from 'lucide-svelte';
  import { cn } from '$lib/utils/cn';
  import { createCopied } from '$lib/utils/copied.svelte';
  import { safeHttpUrl } from '$lib/utils/url';
  import { toneBadge } from '$lib/utils/status';

  const data = $derived(extensionState.emailState.data);
  const dkim = $derived(extensionState.dkimState.data);
  const spfEval = $derived(extensionState.spfEvalState.data);

  const copied = createCopied();

  const getPolicyBadgeClass = (policy: string) => toneBadge[getPolicyColor(policy)];

  // Compute auth strength: 5 dots for MX, SPF, DMARC, MTA-STS, BIMI
  const authChecks = $derived([
    { key: 'MX', on: (data?.mx?.length ?? 0) > 0 },
    { key: 'SPF', on: (data?.spf?.length ?? 0) > 0 },
    { key: 'DMARC', on: (data?.dmarc?.length ?? 0) > 0 },
    { key: 'MTA-STS', on: (data?.mtaSts?.length ?? 0) > 0 },
    { key: 'BIMI', on: (data?.bimi?.length ?? 0) > 0 }
  ]);
  const authOnCount = $derived(authChecks.filter((c) => c.on).length);
</script>

<div class="space-y-2.5">
  {#if extensionState.emailState.loading}
    <LoadingState message="Analyzing email configuration…" />
  {:else if extensionState.emailState.error}
    <ErrorState message={extensionState.emailState.error} />
  {:else if data}
    <div class="flex items-center justify-between pb-2 border-b border-line">
      <div class="flex items-center gap-2">
        <span class="flex gap-1">
          {#each authChecks as c}
            <span
              class={cn(
                'w-1.5 h-1.5 rounded-full',
                c.on ? 'bg-ok-500' : 'bg-fg-subtle/30'
              )}
              title={`${c.key}: ${c.on ? 'configured' : 'missing'}`}
            ></span>
          {/each}
        </span>
        <span class="text-[11px] text-fg-muted">
          <span class="font-semibold text-fg tnum">{authOnCount}</span> of <span class="tnum">5</span> auth records
        </span>
      </div>
      <RefreshButton onClick={() => { extensionState.queryEmail(true); extensionState.queryDkim(true); }} loading={extensionState.emailState.loading} />
    </div>

    <!-- Auth keys (badges) -->
    <div class="flex flex-wrap gap-1.5">
      {#each authChecks as c}
        <span
          class={cn(
            'px-2 py-0.5 text-[10px] rounded-md border',
            c.on
              ? 'bg-ok-500/10 text-ok-400 border-ok-500/30'
              : 'bg-surface-2 text-fg-subtle border-line'
          )}
        >
          {c.key}
        </span>
      {/each}
      {#if dkim && dkim.found > 0}
        <span class="px-2 py-0.5 text-[10px] rounded-md border bg-ok-500/10 text-ok-400 border-ok-500/30">
          DKIM ({dkim.found})
        </span>
      {/if}
    </div>

    <!-- Provider -->
    {#if data.provider}
      <div class="card fade-in-up">
        <div class="flex items-center gap-1.5 mb-1">
          <Mail class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="section-title">Provider</h3>
        </div>
        <p class="text-sm text-fg">{data.provider}</p>
      </div>
    {/if}

    <!-- MX Records -->
    {#if data.mx.length > 0}
      <div class="card">
        <h3 class="section-title mb-2">MX</h3>
        <div class="space-y-1">
          {#each data.mx as record}
            <CopyRow value={record.data} k={`mx-${record.data}`} {copied} class="px-2 py-1 -mx-2 rounded-lg" label="Copy MX record">
              <p class="text-xs text-fg font-mono truncate flex-1">{record.data}</p>
            </CopyRow>
          {/each}
        </div>
      </div>
    {/if}

    <!-- SPF -->
    {#if data.spfAnalysis}
      <div class="card">
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="section-title">SPF</h3>
          <span class={cn('px-1.5 py-0.5 text-[10px] rounded-md border', getPolicyBadgeClass(data.spfAnalysis.policy))}>
            {data.spfAnalysis.policy}
          </span>
        </div>
        <p class="text-[10px] text-fg-subtle mb-2">{getSPFPolicyDescription(data.spfAnalysis.policy)}</p>
        {#if data.spfAnalysis.providers.length > 0}
          <div class="flex flex-wrap gap-1 mb-2">
            {#each data.spfAnalysis.providers as provider}
              <span class="px-1.5 py-0.5 text-[10px] bg-surface-3 text-fg-muted rounded-md">{provider}</span>
            {/each}
          </div>
        {/if}
        <!-- DNS lookup budget: exceeding 10 makes receivers return permerror,
             which fails SPF even though the record looks fine. -->
        {#if spfEval}
          {@const over = spfEval.exceeded}
          <div class="pt-2 border-t border-line">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] text-fg-subtle">DNS lookups</span>
              <span class={cn('text-[10px] font-mono tnum font-semibold', over ? 'text-bad-400' : spfEval.lookups >= 8 ? 'text-warn-400' : 'text-ok-400')}>
                {spfEval.lookups} / {spfEval.limit}
              </span>
            </div>
            <div class="h-1 rounded-full bg-surface-3 overflow-hidden">
              <div
                class={cn('h-full rounded-full transition-all', over ? 'bg-bad-500' : spfEval.lookups >= 8 ? 'bg-warn-500' : 'bg-ok-500')}
                style={`width: ${Math.min(100, (spfEval.lookups / spfEval.limit) * 100)}%`}
              ></div>
            </div>
            {#if over}
              <p class="text-[10px] text-bad-400 mt-1 leading-relaxed">
                Over the RFC 7208 limit — receivers return <span class="font-mono">permerror</span> and SPF fails. Reduce nested includes.
              </p>
            {:else if spfEval.lookups >= 8}
              <p class="text-[10px] text-warn-400 mt-1 leading-relaxed">Close to the limit of {spfEval.limit}; adding another provider may break SPF.</p>
            {/if}
            {#if spfEval.voidExceeded}
              <p class="text-[10px] text-warn-400 mt-1 leading-relaxed">{spfEval.voidLookups} void lookups (limit {spfEval.voidLimit}) — some includes resolve to nothing.</p>
            {/if}
            {#if spfEval.loops.length > 0}
              <p class="text-[10px] text-bad-400 mt-1 leading-relaxed">Include loop via {spfEval.loops.join(', ')}.</p>
            {/if}
          </div>
        {/if}
        <div class="pt-2 border-t border-line">
          <p class="text-[10px] text-fg-subtle font-mono break-all leading-relaxed">{data.spfAnalysis.raw}</p>
        </div>
      </div>
    {/if}

    <!-- DMARC -->
    {#if data.dmarcAnalysis}
      <div class="card">
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="section-title">DMARC</h3>
          <span class={cn('px-1.5 py-0.5 text-[10px] rounded-md border', getPolicyBadgeClass(data.dmarcAnalysis.policy))}>
            {data.dmarcAnalysis.policy}
          </span>
        </div>
        <p class="text-[10px] text-fg-subtle mb-2">{getDMARCPolicyDescription(data.dmarcAnalysis.policy)}</p>
        <div class="grid grid-cols-2 gap-2 text-[10px] mb-2">
          <div>
            <span class="text-fg-subtle">Subdomain:</span>
            <span class="text-fg-muted ml-1">{data.dmarcAnalysis.subdomainPolicy}</span>
          </div>
          <div>
            <span class="text-fg-subtle">Percentage:</span>
            <span class="text-fg-muted ml-1 tnum">{data.dmarcAnalysis.percentage}%</span>
          </div>
        </div>
        {#if data.dmarcAnalysis.reportingAddresses.aggregate.length > 0}
          <div class="pt-2 border-t border-line">
            <p class="text-[10px] text-fg-subtle">Reports: {data.dmarcAnalysis.reportingAddresses.aggregate.join(', ')}</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- MTA-STS -->
    {#if data.mtaSts.length > 0}
      <div class="card">
        <div class="flex items-center gap-1.5 mb-1.5">
          <Lock class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="section-title">MTA-STS</h3>
        </div>
        {#each data.mtaSts as record}
          <p class="text-[10px] text-fg-muted font-mono break-all leading-relaxed">{record.data.replace(/^"(.+)"$/, '$1')}</p>
        {/each}
      </div>
    {/if}

    <!-- BIMI -->
    {#if data.bimi.length > 0}
      <div class="card">
        <div class="flex items-center gap-1.5 mb-1.5">
          <Image class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="section-title">BIMI</h3>
        </div>
        {#each data.bimi as record}
          {@const raw = record.data.replace(/^"(.+)"$/, '$1')}
          {@const logoMatch = raw.match(/\bl=([^;]+)/i)}
          {@const vmcMatch = raw.match(/\ba=([^;]+)/i)}
          <div class="space-y-1">
            {#if logoMatch}
              <div class="flex items-start gap-2 text-[10px]">
                <span class="text-fg-subtle uppercase tracking-wide">Logo</span>
                <a class="text-primary-400 hover:underline font-mono break-all" href={safeHttpUrl(logoMatch[1].trim())} target="_blank" rel="noopener noreferrer">{logoMatch[1].trim()}</a>
              </div>
            {/if}
            {#if vmcMatch}
              <div class="flex items-start gap-2 text-[10px]">
                <span class="text-fg-subtle uppercase tracking-wide">VMC</span>
                <a class="text-primary-400 hover:underline font-mono break-all" href={safeHttpUrl(vmcMatch[1].trim())} target="_blank" rel="noopener noreferrer">{vmcMatch[1].trim()}</a>
              </div>
            {/if}
            <p class="text-[10px] text-fg-muted font-mono break-all leading-relaxed pt-1 border-t border-line">{raw}</p>
          </div>
        {/each}
      </div>
    {/if}

    <!-- DKIM -->
    {#if extensionState.dkimState.loading}
      <div class="card">
        <div class="flex items-center gap-1.5 mb-1">
          <KeyRound class="w-3.5 h-3.5 text-primary-400" />
          <h3 class="section-title">DKIM</h3>
        </div>
        <p class="text-[10px] text-fg-subtle">Probing common selectors…</p>
      </div>
    {:else if dkim && dkim.found > 0}
      <div class="card">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <KeyRound class="w-3.5 h-3.5 text-primary-400" />
            <h3 class="section-title">DKIM</h3>
          </div>
          <span class="text-[10px] text-fg-muted tnum">{dkim.found}/{dkim.probed} selectors</span>
        </div>
        <div class="space-y-1.5">
          {#each dkim.selectors as sel}
            <div class="flex items-center justify-between gap-2 text-[10px]">
              <span class="font-mono text-fg">{sel.selector}._domainkey</span>
              <span class="flex items-center gap-2 text-fg-subtle">
                {#if sel.algorithm}
                  <span class="font-mono">{sel.algorithm}</span>
                {/if}
                {#if sel.keyLength}
                  <span class="font-mono tnum text-fg-muted">{sel.keyLength}-bit</span>
                {/if}
                {#if sel.policy === 'y'}
                  <span class="px-1 py-0.5 bg-warn-500/15 text-warn-400 rounded text-[9px]">testing</span>
                {/if}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <EmptyState title="Email security" hint="Look up a domain to see SPF, DMARC, DKIM and more." />
  {/if}

  {#if data}
    <QuickActions tab="email" />
  {/if}
</div>
