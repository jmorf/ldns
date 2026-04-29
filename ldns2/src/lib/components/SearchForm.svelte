<script lang="ts">
    export const onSubmit: (domain: string) => void = () => {};
    let domain = "";
    let selected_ep: string = "cloudflare";

    function handleSubmit(e: Event) {
        e.preventDefault();
        const clean_domain = cleanDomain(domain);
        const valid_domain = validDomain(clean_domain);
        if (valid_domain) {
            window.location.href = `/${clean_domain}?ep=${selected_ep}`;
        }
    }

    function cleanDomain(d: string): string {
        // Remove any leading/trailing whitespace and convert to lowercase
        return d.trim().toLowerCase();
    }
    function validDomain(d: string): boolean {
        return d.length > 0; // Simple validation for now
    }
</script>

<form
    on:submit={handleSubmit}
    class="w-full max-w-xl flex flex-col sm:flex-row items-center gap-2"
>
    <input
        type="text"
        bind:value={domain}
        placeholder="Example.com, domain.net, name.org..."
        class="w-full bg-surface text-fg border border-line rounded-md px-4 py-2 placeholder-fg-subtle focus:outline-none focus:ring-2 focus:primary"
    />

    <button
        type="submit"
        class="w-full sm:w-auto bg-primary hover:primary text-fg font-semibold py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:primary focus:ring-offset-2"
    >
        DNS Lookup
    </button>
</form>
