<script lang="ts">
    import FaqJsonLd from './FaqJsonLd.svelte';
    import { buildFaqSchema } from '$lib/utils/faqJsonLd';
    import type { FaqItem } from '$lib/utils/faqJsonLd';
    import { ChevronDown } from 'lucide-svelte';

    interface Props {
        faqs: FaqItem[];
        heading?: string;
    }

    let { faqs, heading = 'Frequently Asked Questions' }: Props = $props();

    const faqSchema = $derived(faqs.length > 0 ? buildFaqSchema(faqs) : null);
</script>

<FaqJsonLd faqData={faqSchema} />

<section class="mt-10 border-t border-gray-700 pt-8">
    <h2 class="text-xl font-semibold text-white mb-6">{heading}</h2>
    <div class="space-y-3">
        {#each faqs as faq}
            <details class="group bg-gray-800 border border-gray-700 rounded-lg">
                <summary class="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-medium text-sm hover:text-primary-400 transition-colors [&::-webkit-details-marker]:hidden list-none">
                    <span>{faq.question}</span>
                    <ChevronDown class="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <div class="px-5 pb-4 pt-1">
                    <p class="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                </div>
            </details>
        {/each}
    </div>
</section>
