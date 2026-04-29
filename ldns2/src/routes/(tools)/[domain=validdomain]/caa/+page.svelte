<script lang="ts">
  import { domain } from '$lib/state.svelte';
  import RecordTypePage from '$lib/components/RecordTypePage.svelte';
</script>

<RecordTypePage
  recordType="CAA"
  title="CAA Records"
  description={`CAA record lookup for ${domain.name}. Specifies which Certificate Authorities are allowed to issue certificates for ${domain.name}.`}
  emptyMessage="No CAA records found. Any Certificate Authority may issue certificates for this domain."
/>
