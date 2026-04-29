<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import RecordTypePage from '$lib/components/RecordTypePage.svelte';
</script>

<RecordTypePage
  recordType="AAAA"
  title="AAAA Records"
  description={`AAAA record lookup for ${domain.name}. Lists every IPv6 address ${domain.name} resolves to.`}
  emptyMessage="No AAAA records found. This domain may not support IPv6."
/>
