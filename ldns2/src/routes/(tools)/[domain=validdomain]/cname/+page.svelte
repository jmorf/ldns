<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import RecordTypePage from '$lib/components/RecordTypePage.svelte';
</script>

<RecordTypePage
  recordType="CNAME"
  title="CNAME Records"
  description={`CNAME record lookup for ${domain.name}. Shows what ${domain.name} aliases to.`}
  emptyMessage="No CNAME records found. This domain likely uses A or AAAA records directly."
/>
