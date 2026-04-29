<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import RecordTypePage from '$lib/components/RecordTypePage.svelte';
  import { SOA_PAGE } from '$lib/utils/seoContent';
</script>

<RecordTypePage
  recordType="SOA"
  title="SOA Record"
  description={`SOA (Start of Authority) record for ${domain.name}. Contains primary nameserver, admin contact, and zone refresh values.`}
  emptyMessage="No SOA record found for this domain."
  config={SOA_PAGE}
/>
