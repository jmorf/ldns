<script lang="ts">
    import { page } from "$app/stores";
    import { browser } from "$app/environment";

    interface Props {
        title?: string;
        description?: string;
        image?: string;
        type?: "website" | "article";
        siteName?: string;
        domain?: string;
    }

    let {
        title = "DNS Tools",
        description = "Comprehensive DNS analysis and security tools for domain management.",
        image,
        type = "website",
        siteName = "LDNS.com",
        domain = "ldns.com",
    }: Props = $props();

    // If no image is supplied, derive a per-page OG from the dynamic generator.
    // Strip the leading slash; everything after `/` becomes the OG path so the
    // route shows the same domain + tool the page is showing.
    const ogPath = $derived($page.url.pathname.replace(/^\//, ''));
    const computedImage = $derived(image ?? `/og/${ogPath || 'ldns.com'}`);

    // Make sure we react to page changes using Svelte 5 effects
    $effect(() => {
        if (browser) {
            // Force update document title on navigation
            document.title = `${title} | ${siteName}`;
            
            // Force update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
            
            // Force update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) {
                ogTitle.setAttribute('content', `${title} | ${siteName}`);
            }
            
            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) {
                ogDescription.setAttribute('content', description);
            }
            
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) {
                ogUrl.setAttribute('content', `https://${domain}${$page.url.pathname}`);
            }
        }
    });

    // Construct full URLs using Svelte 5 runes
    const fullUrl = $derived(`https://${domain}${$page.url.pathname}`);
    const fullImageUrl = $derived(
        computedImage.startsWith("http") ? computedImage : `https://${domain}${computedImage}`,
    );
    const fullTitle = $derived(`${title} | ${siteName}`);

    // JSON-LD structured data
    const jsonLd = $derived({
        "@context": "https://schema.org",
        "@type": type === "article" ? "Article" : "Website",
        name: fullTitle,
        url: fullUrl,
        description: description,
        image: fullImageUrl,
        ...(type === "website" && { logo: fullImageUrl }),
    });
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={fullUrl} />

    <!-- Open Graph / Facebook -->
    <meta property="og:site_name" content={siteName} />
    <meta property="og:url" content={fullUrl} />
    <meta property="og:type" content={type} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={fullImageUrl} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta property="twitter:domain" content={domain} />
    <meta property="twitter:url" content={fullUrl} />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={fullImageUrl} />

    <!-- JSON-LD structured data -->
    {@html `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
</svelte:head>
