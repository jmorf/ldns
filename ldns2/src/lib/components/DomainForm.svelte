<script lang="ts">
    import { Search } from "lucide-svelte";
    import psl from "psl";

    interface Props {
        targetPath?: string;
    }

    let { targetPath = '' }: Props = $props();

    let domain = $state("");

    const cleanedDomain = $derived(cleanDomain(domain));
    const isValidDomain = $derived(cleanedDomain ? validDomain(cleanedDomain) : false);

    function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        let clean_domain = cleanDomain(domain);
        let valid_domain = validDomain(clean_domain);
        if (valid_domain) {
            window.location.href = `/${clean_domain}${targetPath}`;
        }
    }

    function cleanDomain(d: string): string {
        if (!d) return "";
        d = d.trim();
        d = d.replace(/^(?:https?:\/\/|ftp:\/\/)/i, "");
        d = d.split(/[/?#:]/)[0];
        return d.toLowerCase();
    }

    function validDomain(d: string): boolean {
        if (!d || d.length < 3) return false;
        return psl.isValid(d);
    }
</script>

<div class="w-full max-w-xl mx-auto">
    <form
        class={`flex rounded-lg focus-within:ring-2 ${
            isValidDomain
                ? "ring-2 ring-green-500 focus-within:ring-green-500"
                : "ring-0 focus-within:ring-primary-500"
        }`}
        onsubmit={handleSubmit}
    >
        <input
            type="search"
            bind:value={domain}
            placeholder="Example.com, domain.net, name.org…"
            title="Enter a domain name to query"
            required
            class={`flex-1 py-4 px-6 text-lg rounded-s-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0 ${
                isValidDomain
                    ? "border-green-500 focus:border-green-500"
                    : "focus:border-gray-300"
            }`}
        />
        <button
            class={`rounded-e-lg py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white transition-colors border-l-0 ${
                isValidDomain ? "border-green-500" : ""
            }`}
            type="submit"
        >
            <Search class="h-6 w-6" />
        </button>
    </form>
</div>
