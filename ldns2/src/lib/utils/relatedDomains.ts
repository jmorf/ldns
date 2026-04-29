import psl from 'psl';

export interface RelatedDomain {
    domain: string;
    type: 'parent' | 'subdomain' | 'tld_variant' | 'service' | 'variant';
    label: string;
    description: string;
}

// Common subdomains to suggest - always include these
const COMMON_SUBDOMAINS = ['www', 'mail', 'app'];

// Common TLD variations to try - prioritized by popularity
const COMMON_TLDS = ['com', 'net', 'org', 'co', 'io', 'co.uk', 'ca', 'au', 'de', 'fr', 'eu', 'us', 'info', 'biz', 'app', 'dev', 'ai', 'me', 'tv', 'cc', 'ws', 'xyz', 'online', 'site', 'store', 'shop', 'blog', 'tech', 'pro', 'edu', 'gov'];

// Related services mapping
const RELATED_SERVICES: Record<string, string[]> = {
    // Code repositories
    'github.com': ['gitlab.com', 'bitbucket.org', 'sourceforge.net', 'gitea.io'],
    'gitlab.com': ['github.com', 'bitbucket.org', 'codeberg.org'],
    'bitbucket.org': ['github.com', 'gitlab.com'],
    
    // Email providers
    'gmail.com': ['outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'],
    'outlook.com': ['gmail.com', 'yahoo.com', 'hotmail.com', 'live.com'],
    'yahoo.com': ['gmail.com', 'outlook.com', 'aol.com'],
    'protonmail.com': ['gmail.com', 'tutanota.com', 'fastmail.com'],
    
    // Search engines
    'google.com': ['bing.com', 'duckduckgo.com', 'yahoo.com', 'yandex.com'],
    'bing.com': ['google.com', 'duckduckgo.com', 'yahoo.com'],
    'duckduckgo.com': ['google.com', 'bing.com', 'startpage.com', 'qwant.com'],
    
    // Social media
    'facebook.com': ['instagram.com', 'twitter.com', 'linkedin.com', 'tiktok.com'],
    'instagram.com': ['facebook.com', 'twitter.com', 'tiktok.com', 'pinterest.com'],
    'twitter.com': ['facebook.com', 'instagram.com', 'mastodon.social', 'threads.net'],
    'linkedin.com': ['facebook.com', 'twitter.com', 'indeed.com', 'glassdoor.com'],
    'tiktok.com': ['instagram.com', 'youtube.com', 'snapchat.com'],
    'x.com': ['twitter.com', 'mastodon.social', 'threads.net'],
    
    // Video platforms
    'youtube.com': ['vimeo.com', 'dailymotion.com', 'twitch.tv', 'rumble.com'],
    'vimeo.com': ['youtube.com', 'dailymotion.com', 'wistia.com'],
    'twitch.tv': ['youtube.com', 'kick.com', 'dlive.tv'],
    
    // E-commerce
    'amazon.com': ['ebay.com', 'alibaba.com', 'walmart.com', 'target.com'],
    'ebay.com': ['amazon.com', 'etsy.com', 'mercari.com', 'depop.com'],
    'alibaba.com': ['amazon.com', 'aliexpress.com', 'dhgate.com'],
    'shopify.com': ['woocommerce.com', 'bigcommerce.com', 'squarespace.com'],
    
    // Streaming services
    'netflix.com': ['hulu.com', 'disneyplus.com', 'max.com', 'primevideo.com'],
    'hulu.com': ['netflix.com', 'disneyplus.com', 'peacocktv.com', 'paramountplus.com'],
    'spotify.com': ['applemusic.apple.com', 'youtube.com', 'pandora.com', 'tidal.com'],
    
    // Forums & Communities
    'reddit.com': ['digg.com', 'news.ycombinator.com', 'lobste.rs', 'lemmy.world'],
    'stackoverflow.com': ['reddit.com', 'news.ycombinator.com', 'dev.to', 'hashnode.com'],
    'quora.com': ['reddit.com', 'stackoverflow.com', 'answers.com'],
    
    // Cloud & CDN providers
    'cloudflare.com': ['akamai.com', 'fastly.com', 'bunny.net', 'cloudfront.net'],
    'aws.amazon.com': ['cloud.google.com', 'azure.microsoft.com', 'digitalocean.com'],
    'cloud.google.com': ['aws.amazon.com', 'azure.microsoft.com', 'cloud.ibm.com'],
    'azure.microsoft.com': ['aws.amazon.com', 'cloud.google.com', 'oracle.com'],
    
    // Domain registrars
    'godaddy.com': ['namecheap.com', 'domains.google', 'porkbun.com', 'name.com'],
    'namecheap.com': ['godaddy.com', 'domains.google', 'porkbun.com', 'hover.com'],
    'gandi.net': ['namecheap.com', 'porkbun.com', 'iwantmyname.com'],
    
    // Development tools
    'vercel.com': ['netlify.com', 'render.com', 'railway.app', 'fly.io'],
    'netlify.com': ['vercel.com', 'render.com', 'surge.sh', 'pages.github.com'],
    'heroku.com': ['render.com', 'railway.app', 'fly.io', 'cyclic.sh'],
    
    // Communication tools
    'slack.com': ['discord.com', 'teams.microsoft.com', 'telegram.org', 'mattermost.com'],
    'discord.com': ['slack.com', 'telegram.org', 'element.io', 'guilded.gg'],
    'zoom.us': ['meet.google.com', 'teams.microsoft.com', 'whereby.com', 'jitsi.org'],
    
    // Payment processors
    'paypal.com': ['stripe.com', 'square.com', 'venmo.com', 'cashapp.com'],
    'stripe.com': ['paypal.com', 'square.com', 'adyen.com', 'braintreepayments.com'],
};

export function generateRelatedDomains(domain: string): RelatedDomain[] {
    const related: RelatedDomain[] = [];
    const seenDomains = new Set<string>();
    const categoryDomains: Record<string, RelatedDomain[]> = {
        parent: [],
        tld_variant: [],
        subdomain: [],
        variant: [],
        service: []
    };
    
    // Helper to add unique domains
    const addDomain = (d: RelatedDomain) => {
        if (!seenDomains.has(d.domain) && d.domain !== domain) {
            seenDomains.add(d.domain);
            related.push(d);
            // Also track by category
            if (categoryDomains[d.type]) {
                categoryDomains[d.type].push(d);
            }
        }
    };
    
    try {
        const parsed = psl.parse(domain);
        if (!parsed || parsed.error) return related;
        
        const { sld, tld, subdomain } = parsed as psl.ParsedDomain;
        
        // 1. Parent domain (if current is subdomain)
        if (subdomain) {
            const parentDomain = `${sld}.${tld}`;
            addDomain({
                domain: parentDomain,
                type: 'parent',
                label: 'Parent Domain',
                description: `Root domain of ${domain}`
            });
            
            // Also check for intermediate subdomains
            const subParts = subdomain.split('.');
            if (subParts.length > 1) {
                // For deep subdomains like api.v2.example.com, also show v2.example.com
                for (let i = 1; i < subParts.length; i++) {
                    const intermediateDomain = `${subParts.slice(i).join('.')}.${sld}.${tld}`;
                    addDomain({
                        domain: intermediateDomain,
                        type: 'parent',
                        label: 'Parent Subdomain',
                        description: `Parent subdomain of ${domain}`
                    });
                }
            }
        }
        
        // 2. Common typos and misspellings
        const rootDomain = `${sld}.${tld}`;
        
        // Add common typos first (only for root domain, not subdomains)
        if (sld && sld.length > 3 && !subdomain) {
            // Missing last letter (common typo)
            const missingLast = sld.slice(0, -1);
            addDomain({
                domain: `${missingLast}.${tld}`,
                type: 'variant',
                label: 'Common Typo',
                description: `Missing last letter`
            });
            
            // First letter typo (adjacent key)
            const firstCharTypos: Record<string, string> = {
                'g': 'f', 'f': 'g', 'h': 'j', 'j': 'h',
                'n': 'm', 'm': 'n', 'b': 'v', 'v': 'b',
                'c': 'x', 'x': 'c', 'd': 's', 's': 'd'
            };
            const firstChar = sld[0].toLowerCase();
            if (firstCharTypos[firstChar]) {
                const typo = firstCharTypos[firstChar] + sld.slice(1);
                addDomain({
                    domain: `${typo}.${tld}`,
                    type: 'variant',
                    label: 'Keyboard Typo',
                    description: `Adjacent key typo`
                });
            }
            
            // Transposed characters (adjacent swap)
            if (sld.length >= 4) {
                const midPoint = Math.floor(sld.length / 2);
                const typo = sld.slice(0, midPoint) + sld[midPoint + 1] + sld[midPoint] + sld.slice(midPoint + 2);
                if (typo !== sld) {
                    addDomain({
                        domain: `${typo}.${tld}`,
                        type: 'variant',
                        label: 'Common Typo',
                        description: `Swapped letters`
                    });
                }
            }
            
            // www prefix without dot (common typo)
            if (!sld.startsWith('www')) {
                addDomain({
                    domain: `www${sld}.${tld}`,
                    type: 'variant',
                    label: 'Common Typo',
                    description: 'www prefix without dot'
                });
            }
        }
        
        // 3. TLD variations - prioritize most common
        const priorityTlds = ['com', 'net', 'org', 'co', 'io'];
        const currentTldIsCommon = tld ? priorityTlds.includes(tld) : false;
        
        // First add priority TLDs
        priorityTlds.forEach(newTld => {
            if (newTld !== tld) {
                const tldVariant = subdomain 
                    ? `${subdomain}.${sld}.${newTld}`
                    : `${sld}.${newTld}`;
                    
                addDomain({
                    domain: tldVariant,
                    type: 'tld_variant',
                    label: 'Popular TLD',
                    description: `.${newTld} version`
                });
            }
        });
        
        // Then add some other TLDs if we have room
        const otherTlds = COMMON_TLDS.filter(t => !priorityTlds.includes(t));
        otherTlds.slice(0, 5).forEach(newTld => {
            if (newTld !== tld && related.length < 10) {
                const tldVariant = subdomain 
                    ? `${subdomain}.${sld}.${newTld}`
                    : `${sld}.${newTld}`;
                    
                addDomain({
                    domain: tldVariant,
                    type: 'tld_variant',
                    label: 'Alternative TLD',
                    description: `.${newTld} version`
                });
            }
        });
        
        // 4. Common subdomains - always include the top 3
        if (!subdomain) {
            // For root domains, always suggest www, mail, app first
            ['www', 'mail', 'app'].forEach(sub => {
                addDomain({
                    domain: `${sub}.${domain}`,
                    type: 'subdomain',
                    label: 'Common Subdomain',
                    description: `${sub.charAt(0).toUpperCase() + sub.slice(1)} subdomain`
                });
            });
        } else {
            // For subdomains, suggest the top 3 as siblings
            const currentSub = subdomain.split('.').pop(); // Get last part if nested
            ['www', 'mail', 'app'].forEach(sub => {
                if (sub !== currentSub) {
                    addDomain({
                        domain: `${sub}.${rootDomain}`,
                        type: 'subdomain',
                        label: 'Sibling Subdomain',
                        description: `${sub.charAt(0).toUpperCase() + sub.slice(1)} subdomain`
                    });
                }
            });
        }
        
        // 5. Related services
        if (RELATED_SERVICES[domain]) {
            RELATED_SERVICES[domain].forEach(relatedService => {
                addDomain({
                    domain: relatedService,
                    type: 'service',
                    label: 'Related Service',
                    description: 'Similar or competing service'
                });
            });
        }
        
        // 6. Common variations
        // Remove 'www' if present, add if not
        if (subdomain === 'www') {
            addDomain({
                domain: rootDomain,
                type: 'variant',
                label: 'Without www',
                description: 'Domain without www prefix'
            });
        } else if (!subdomain) {
            addDomain({
                domain: `www.${domain}`,
                type: 'variant',
                label: 'With www',
                description: 'Domain with www prefix'
            });
        }
        
        // Hyphenated variations
        if (sld && sld.includes('-')) {
            const unhyphenated = sld.replace(/-/g, '');
            const variant = subdomain 
                ? `${subdomain}.${unhyphenated}.${tld}`
                : `${unhyphenated}.${tld}`;
                
            addDomain({
                domain: variant,
                type: 'variant',
                label: 'Without Hyphens',
                description: 'Domain without hyphens'
            });
        }
        
        // Common misspellings for specific patterns (only for root domains)
        if (sld && !subdomain) {
            // Double letters to single
            const doubleLetterMatch = sld.match(/(.)\1/);
            if (doubleLetterMatch) {
                const singleLetter = sld.replace(/(.)\1/, '$1');
                addDomain({
                    domain: `${singleLetter}.${tld}`,
                    type: 'variant',
                    label: 'Common Typo',
                    description: 'Single letter instead of double'
                });
            }
            
            // Single to double letters for common patterns
            if (sld.includes('o') && !sld.includes('oo') && sld.length < 10) {
                const doubled = sld.replace('o', 'oo');
                addDomain({
                    domain: `${doubled}.${tld}`,
                    type: 'variant',
                    label: 'Common Typo',
                    description: 'Double "o" typo'
                });
            }
            
            // Missing 'e' at the end (common typo)
            if (sld.endsWith('e') && sld.length > 4) {
                addDomain({
                    domain: `${sld.slice(0, -1)}.${tld}`,
                    type: 'variant',
                    label: 'Common Typo',
                    description: 'Missing final "e"'
                });
            }
        }
        
    } catch (error) {
        console.error('Error generating related domains:', error);
    }
    
    // Ensure we have at least one from each category (where available)
    const finalDomains: RelatedDomain[] = [];
    const categoriesWithItems = Object.entries(categoryDomains)
        .filter(([_, items]) => items.length > 0)
        .map(([category, _]) => category);
    
    // First, add at least one from each category that has items
    for (const category of ['parent', 'tld_variant', 'subdomain', 'variant', 'service']) {
        if (categoryDomains[category].length > 0) {
            finalDomains.push(categoryDomains[category][0]);
        }
    }
    
    // Then add remaining domains in priority order until we reach the limit
    const typePriority: Record<string, number> = {
        'parent': 1,
        'tld_variant': 2,
        'subdomain': 3,
        'variant': 4,
        'service': 5
    };
    
    // Sort remaining domains with stable sort
    const remainingDomains = related.filter(d => !finalDomains.includes(d));
    remainingDomains.sort((a, b) => {
        const priorityDiff = typePriority[a.type] - typePriority[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        return a.domain.localeCompare(b.domain);
    });
    
    // Add remaining domains up to limit of 16 (4x4 grid)
    const limit = 16;
    for (const domain of remainingDomains) {
        if (finalDomains.length >= limit) break;
        finalDomains.push(domain);
    }
    
    // Stable sort by priority, then by domain name to ensure consistent ordering
    finalDomains.sort((a, b) => {
        const priorityDiff = typePriority[a.type] - typePriority[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        // Secondary sort by domain name for stability
        return a.domain.localeCompare(b.domain);
    });
    
    return finalDomains;
}