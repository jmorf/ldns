/**
 * SEO Page Configuration Module
 *
 * Central registry of all programmatic SEO page configs.
 * Each config defines titles, descriptions, educational content, FAQ templates,
 * and internal linking for a specific /{domain}/{page} route.
 *
 * All text-generating properties are functions that take the domain name,
 * so every page renders domain-specific content for SEO.
 */

export interface SEOPageConfig {
    slug: string;
    recordType?: string;
    title: (domain: string) => string;
    description: (domain: string) => string;
    h1: (domain: string) => string;
    intro: (domain: string) => string;
    /** SEO-optimized meta description for the /tools/{slug} landing page (no domain references) */
    landingDescription: string;
    sections: (domain: string) => Array<{
        heading: string;
        paragraphs: string[];
    }>;
    /** Generic educational sections for tool landing pages (no domain references) */
    genericSections: Array<{
        heading: string;
        paragraphs: string[];
    }>;
    /** FAQ items for tool landing pages (rendered as accordion + JSON-LD) */
    genericFaqs?: Array<{
        question: string;
        answer: string;
    }>;
    relatedPages: string[];
    dataSource: 'dns' | 'rdap' | 'email' | 'server' | 'security';
}

// ─── Record-Type Pages ─────────────────────────────────────────────

export const MX_PAGE: SEOPageConfig = {
    slug: 'mx',
    recordType: 'MX',
    title: (d) => `${d} MX Lookup — Mail Server Records`,
    description: (d) => `MX lookup for ${d}. Find which mail servers handle email delivery for ${d}, their priorities, and which email provider ${d} uses.`,
    h1: (d) => `${d} MX Lookup`,
    intro: (d) => `Use this MX lookup tool to see where email for ${d} is delivered. MX (Mail Exchange) records specify which mail servers accept email for ${d} and in what priority order. Below are the current MX records for ${d} along with their priority values.`,
    landingDescription: 'Free MX lookup tool — find mail servers, check MX record priorities, and identify email providers for any domain. Instant results, no install required.',
    sections: (d) => [
        {
            heading: `What Are ${d}'s MX Records?`,
            paragraphs: [
                `MX records for ${d} specify which mail servers are responsible for accepting email messages sent to @${d} addresses. Each MX record contains a priority number and a mail server hostname. The priority determines which server is tried first — lower numbers indicate higher priority.`,
                `When you send an email to someone at ${d}, your mail server performs a DNS lookup for ${d}'s MX records. It then attempts delivery to the highest-priority (lowest-numbered) server first. If that server is unavailable, it falls back to servers with higher priority numbers, ensuring reliable email delivery for ${d}.`,
                `Examining ${d}'s MX records reveals which email provider handles mail for the domain. This is useful for verifying email configuration, troubleshooting delivery issues, or simply understanding ${d}'s email infrastructure.`,
            ],
        },
        {
            heading: 'How MX Priority Works',
            paragraphs: [
                `MX priority values determine the order in which mail servers are contacted. A domain with MX records at priority 10 and 20 will receive mail at the priority-10 server first. If that server is down or unreachable, the sending server automatically falls back to the priority-20 server.`,
                `Multiple MX records with the same priority value enable round-robin load balancing, distributing email traffic evenly across several servers. This is common with large email providers like Google Workspace and Microsoft 365, which use multiple servers at the same priority level to handle high volumes of mail.`,
                `If ${d} has multiple MX records, the priority values indicate which server is the primary mail handler and which ones serve as backups. A well-configured domain should have at least two MX records at different priorities for redundancy.`,
            ],
        },
        {
            heading: `How to Identify ${d}'s Email Provider`,
            paragraphs: [
                `You can determine which email service ${d} uses by examining the hostnames in its MX records. Google Workspace uses servers like aspmx.l.google.com, Microsoft 365 uses *.mail.protection.outlook.com, Amazon SES uses inbound-smtp.*.amazonaws.com, and Zoho Mail uses mx.zoho.com.`,
                `Knowing ${d}'s email provider is useful for IT administrators configuring email delivery, security researchers assessing a domain's infrastructure, or business analysts understanding a company's technology stack. The MX records provide a definitive answer to the question "who handles email for ${d}?"`,
            ],
        },
        {
            heading: `MX Lookup for ${d}`,
            paragraphs: [
                `This MX lookup tool automatically queries DNS for ${d}'s current MX records and displays them with their priority values. You can also look up MX records using command-line tools: "dig ${d} MX" on Linux/macOS or "nslookup -type=mx ${d}" on Windows.`,
                `MX records can change when a domain switches email providers or updates its mail infrastructure. If you're troubleshooting email delivery to ${d}, run a fresh MX lookup rather than relying on cached information.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `What mail server does ${d} use? — The MX records shown above reveal exactly which mail servers handle email for ${d}. The server with the lowest priority number is the primary mail handler.`,
                `How many MX records does ${d} have? — The number of MX records indicates how many mail servers are configured for ${d}. Multiple records provide redundancy and load balancing for incoming email.`,
                `Does ${d} use Google Workspace or Microsoft 365? — Check the MX record hostnames above. Google Workspace domains point to servers ending in google.com or googlemail.com, while Microsoft 365 domains point to *.mail.protection.outlook.com.`,
                `Why is email to ${d} bouncing? — If email delivery to ${d} is failing, start by verifying that valid MX records exist. Missing or misconfigured MX records are a common cause of email delivery failures.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Are MX Records?',
            paragraphs: [
                'MX (Mail Exchange) records are DNS records that specify which mail servers are responsible for accepting email for a domain. Each MX record contains a priority value and a mail server hostname.',
                'When an email is sent to an address at a domain, the sending server queries DNS for that domain\'s MX records and attempts delivery to the server with the lowest priority number first. If that server is unavailable, it falls back to higher-numbered servers.',
            ],
        },
        {
            heading: 'How MX Priority Works',
            paragraphs: [
                'MX priority values determine the order in which mail servers are contacted. A domain with records at priority 10 and 20 will receive mail at the priority-10 server first, with the priority-20 server acting as a backup.',
                'Multiple MX records with the same priority enable round-robin load balancing. This is common with large providers like Google Workspace and Microsoft 365, which distribute email across several servers at the same priority level.',
            ],
        },
        {
            heading: 'Identifying Email Providers from MX Records',
            paragraphs: [
                'You can determine which email service a domain uses by examining its MX record hostnames. Google Workspace uses aspmx.l.google.com, Microsoft 365 uses *.mail.protection.outlook.com, Amazon SES uses inbound-smtp.*.amazonaws.com, and Zoho Mail uses mx.zoho.com.',
                'This information is useful for IT administrators, security researchers, and anyone who needs to understand a domain\'s email infrastructure.',
            ],
        },
        {
            heading: 'Run a Free MX Lookup',
            paragraphs: [
                'Enter any domain above to instantly retrieve its MX records, priority values, and detected email provider. Results include TTL values and server reachability status — no command-line tools or software installation needed.',
                'Need more than MX? After running your lookup, explore related tools like the SPF Record Checker to verify email sender authorization, the DMARC Checker for authentication policy analysis, or the full Email Security Checker for a comprehensive audit.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is an MX record and why do I need it?',
            answer: 'An MX (Mail Exchange) record is a DNS record that directs email to the correct mail server for your domain. Without MX records, email sent to your domain cannot be delivered. Every domain that needs to receive email must have at least one MX record pointing to a valid mail server.',
        },
        {
            question: 'How many MX records can a domain have?',
            answer: 'A domain can have as many MX records as needed, though most domains use between 2 and 5. Multiple MX records provide redundancy — if the primary server is unavailable, email is routed to backup servers based on priority values. Lower priority numbers indicate preferred servers.',
        },
        {
            question: 'How do I know if my MX records are set up correctly?',
            answer: 'Correctly configured MX records should point to valid, reachable mail server hostnames (not IP addresses). Each record needs a priority value, and the target servers must accept email connections on port 25. Use this MX lookup tool to check your MX records and verify they resolve to working mail servers.',
        },
        {
            question: 'What happens if I don\'t have MX records?',
            answer: 'Without MX records, sending mail servers have no way to determine where to deliver email for your domain. Most email will bounce back to the sender with a "no MX record" or "host not found" error. Some older servers may fall back to the domain\'s A record, but this behavior is unreliable and not recommended.',
        },
        {
            question: 'How long does it take for MX record changes to take effect?',
            answer: 'MX record changes propagate based on the TTL (Time To Live) value set on the record. Most DNS providers set TTLs between 300 seconds (5 minutes) and 86400 seconds (24 hours). After updating MX records, full propagation across all DNS resolvers worldwide typically completes within 24–48 hours, though most resolvers see the change much sooner.',
        },
    ],
    relatedPages: ['ns', 'txt', 'spf', 'dmarc', 'a'],
    dataSource: 'dns',
};

export const NS_PAGE: SEOPageConfig = {
    slug: 'ns',
    recordType: 'NS',
    title: (d) => `${d} NS Lookup — Nameserver Records`,
    description: (d) => `NS lookup for ${d}. Find the authoritative nameservers for ${d} and which DNS hosting provider manages DNS resolution and delegation.`,
    h1: (d) => `${d} NS Lookup`,
    intro: (d) => `Use this NS lookup tool to find the authoritative nameservers for ${d}. NS records indicate which DNS servers respond to all queries for ${d}, including A records, MX records, TXT records, and every other record type. Below are the current nameservers for ${d}.`,
    landingDescription: 'Free NS lookup tool — find authoritative nameservers, identify DNS hosting providers, and check domain delegation for any domain.',
    sections: (d) => [
        {
            heading: `What Are ${d}'s Nameservers?`,
            paragraphs: [
                `NS (Name Server) records for ${d} identify the DNS servers that hold the authoritative DNS zone for this domain. When a recursive resolver needs to look up any record for ${d} — whether an IP address, mail server, or TXT record — it contacts these nameservers to get the definitive answer.`,
                `Every domain must have at least two nameservers for redundancy. If one nameserver for ${d} goes offline, the remaining nameservers continue answering queries so the domain stays reachable. Most DNS providers assign multiple nameservers spread across different networks and geographic locations.`,
                `The nameservers for ${d} are set at the domain registrar and are part of the delegation chain that makes DNS work. Changing these nameservers is how you switch ${d}'s DNS hosting from one provider to another.`,
            ],
        },
        {
            heading: 'How DNS Delegation Works',
            paragraphs: [
                `NS records create the hierarchical delegation chain that makes DNS work. The root DNS servers delegate to TLD servers (e.g., .com servers), which delegate to ${d}'s authoritative nameservers via NS records. Each level points to the next, allowing any device on the internet to resolve ${d} to its IP address.`,
                `When you update nameservers at your registrar for ${d}, you're changing the delegation at the TLD level. This tells the .com (or other TLD) servers to direct queries for ${d} to a new set of nameservers. This change can take up to 48 hours to fully propagate due to DNS caching.`,
            ],
        },
        {
            heading: `Who Hosts DNS for ${d}?`,
            paragraphs: [
                `An NS lookup reveals ${d}'s DNS provider from its nameserver hostnames. Cloudflare uses *.ns.cloudflare.com, AWS Route 53 uses *.awsdns-*.com, Google Cloud DNS uses ns-cloud-*.googledomains.com, DigitalOcean uses ns*.digitalocean.com, and many registrars like GoDaddy, Namecheap, and Google Domains provide their own nameservers.`,
                `Knowing the DNS provider for ${d} is useful for troubleshooting resolution issues, understanding the domain's infrastructure, or evaluating the reliability of its DNS hosting. Enterprise-grade DNS providers like Cloudflare and Route 53 offer features like DDoS protection, anycast routing, and sub-second propagation.`,
            ],
        },
        {
            heading: 'Why Nameserver Redundancy Matters',
            paragraphs: [
                `If all nameservers for ${d} become unreachable, the domain effectively disappears from the internet — websites won't load, email won't deliver, and all services depending on DNS will fail. This is why every domain should have nameservers on at least two separate networks.`,
                `Major DNS outages like the 2016 Dyn attack demonstrated what happens when nameserver infrastructure fails. Modern DNS providers mitigate this with anycast routing, where the same nameserver addresses are served from dozens of data centers worldwide. Check ${d}'s nameservers above to see how many are configured.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `Who hosts DNS for ${d}? — The nameservers shown above reveal ${d}'s DNS hosting provider. Look at the nameserver hostnames to identify the provider (e.g., cloudflare.com, awsdns, etc.).`,
                `How many nameservers does ${d} have? — The number of NS records indicates how many nameservers serve ${d}. Most domains have 2–4 nameservers for redundancy and performance.`,
                `What DNS provider does ${d} use? — The nameserver hostnames identify the provider. Compare them against known DNS provider naming patterns to determine who manages DNS for ${d}.`,
                `How do I change nameservers for a domain? — Nameserver changes are made at the domain registrar (not the DNS provider). Log into your registrar account, find the nameserver settings, and update them to the new provider's nameservers. Propagation takes up to 48 hours.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Are Nameservers?',
            paragraphs: [
                'NS (Name Server) records identify the DNS servers that hold the authoritative DNS zone for a domain. When a recursive resolver needs to look up any record — whether an IP address, mail server, or TXT record — it contacts these nameservers for the definitive answer.',
                'Every domain must have at least two nameservers for redundancy. Most DNS providers assign multiple nameservers across different networks and geographic locations to ensure availability.',
            ],
        },
        {
            heading: 'How DNS Delegation Works',
            paragraphs: [
                'NS records create the hierarchical delegation chain that makes DNS work. Root servers delegate to TLD servers (e.g., .com), which delegate to a domain\'s authoritative nameservers. Each level points to the next, enabling any device on the internet to resolve domain names.',
                'Nameserver changes are made at the domain registrar and can take up to 48 hours to fully propagate due to DNS caching throughout the resolver chain.',
            ],
        },
        {
            heading: 'Identifying DNS Providers',
            paragraphs: [
                'You can identify a domain\'s DNS provider from its nameserver hostnames. Cloudflare uses *.ns.cloudflare.com, AWS Route 53 uses *.awsdns-*.com, Google Cloud DNS uses ns-cloud-*.googledomains.com, and DigitalOcean uses ns*.digitalocean.com.',
                'Enterprise DNS providers offer features like DDoS protection, anycast routing, and sub-second propagation for improved reliability and performance.',
            ],
        },
        {
            heading: 'Run a Free NS Lookup',
            paragraphs: [
                'Enter any domain above to instantly find its authoritative nameservers and identify the DNS hosting provider. Results show nameserver hostnames, IP addresses, and provider detection — no command-line tools required.',
                'Want to dig deeper? Use the A Record Lookup to see where the domain\'s website is hosted, or try the WHOIS Lookup to view full registration details including registrar and expiration date.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What are nameserver (NS) records and what do they do?',
            answer: 'NS records identify the authoritative DNS servers for a domain. These servers hold the master copy of all DNS records for the domain and respond to queries from recursive resolvers. An NS lookup lets you find these nameservers for any domain. Without NS records, no DNS records for the domain can be found, making it entirely unreachable on the internet.',
        },
        {
            question: 'How many nameservers should my domain have?',
            answer: 'Every domain should have at least two nameservers for redundancy, and most DNS providers assign between 2 and 4. Having nameservers on separate networks and in different geographic locations ensures your domain remains resolvable even if one nameserver or network experiences an outage.',
        },
        {
            question: 'What\'s the difference between authoritative and recursive nameservers?',
            answer: 'Authoritative nameservers hold the actual DNS records for a domain and provide definitive answers to queries. Recursive nameservers (like 8.8.8.8 or 1.1.1.1) are used by end users — they don\'t hold records themselves but query authoritative servers on behalf of clients, caching responses to improve performance.',
        },
        {
            question: 'How do I change my domain\'s nameservers?',
            answer: 'Nameserver changes are made through your domain registrar\'s control panel, not your DNS hosting provider. Log into your registrar account, locate the nameserver or DNS settings for your domain, and replace the current nameservers with the ones provided by your new DNS host. Changes can take up to 48 hours to fully propagate.',
        },
        {
            question: 'What happens if my nameservers are down?',
            answer: 'If all nameservers for your domain are unreachable, DNS resolvers cannot look up any records for your domain. This means your website will be inaccessible, email delivery will fail, and all services depending on DNS will stop working. Cached records may continue to work for some users until their TTL expires, but new queries will fail.',
        },
    ],
    relatedPages: ['a', 'mx', 'txt', 'whois', 'ip'],
    dataSource: 'dns',
};

export const A_PAGE: SEOPageConfig = {
    slug: 'a',
    recordType: 'A',
    title: (d) => `${d} A Record Lookup — IPv4 Addresses`,
    description: (d) => `A record lookup for ${d}. Find the IPv4 addresses that ${d} resolves to and understand its hosting configuration.`,
    h1: (d) => `${d} A Record Lookup`,
    intro: (d) => `Use this A record lookup tool to find the IPv4 addresses for ${d}. A records map a domain name to its IP addresses — when your browser connects to ${d}, it retrieves these A records first. Below are the current IPv4 addresses for ${d}.`,
    landingDescription: 'Free A record lookup tool — find IPv4 addresses, check hosting configuration, and identify CDN or load balancer usage for any domain.',
    sections: (d) => [
        {
            heading: `What Is ${d}'s IP Address?`,
            paragraphs: [
                `An A (Address) record maps ${d} to a 32-bit IPv4 address. When you type ${d} into your browser, the first step is a DNS lookup that returns these A records — the IP addresses your browser connects to in order to load the website.`,
                `${d} may have one or multiple A records. A single A record means all traffic goes to one server, while multiple A records typically indicate load balancing or CDN usage, distributing visitors across several servers for better performance and reliability.`,
                `The A records shown above are the current IPv4 addresses that ${d} resolves to. These can change if ${d} switches hosting providers, adds a CDN, or updates its server infrastructure.`,
            ],
        },
        {
            heading: 'What Are A Records?',
            paragraphs: [
                `A records are the most fundamental DNS record type. They provide the direct mapping between a human-readable domain name like ${d} and the machine-readable IPv4 address that computers use to route network traffic. Without A records, browsers would have no way to find the server hosting ${d}'s website.`,
                `Each A record has a TTL (Time To Live) value that tells DNS resolvers how long to cache the result. A short TTL means changes propagate quickly but generate more DNS queries. A long TTL reduces DNS traffic but means changes take longer to take effect. Check the TTL values for ${d}'s A records above.`,
            ],
        },
        {
            heading: 'A Records vs AAAA Records',
            paragraphs: [
                `A records hold IPv4 addresses (32-bit, e.g., 192.0.2.1), while AAAA records hold IPv6 addresses (128-bit, e.g., 2001:db8::1). Both serve the same purpose — mapping ${d} to an IP address — but for different versions of the Internet Protocol.`,
                `IPv4 addresses are limited to about 4.3 billion unique addresses, which have been fully allocated. IPv6 provides a vastly larger address space. Modern domains like ${d} ideally support both protocols. Check ${d}'s IP address page to see if it has IPv6 support.`,
            ],
        },
        {
            heading: 'Multiple A Records and Load Balancing',
            paragraphs: [
                `When an A record lookup for ${d} returns multiple addresses, DNS resolvers typically rotate them in round-robin fashion. This distributes traffic across several servers without requiring a dedicated load balancer. CDN providers like Cloudflare, Fastly, and AWS CloudFront use this technique extensively.`,
                `If ${d} uses a CDN or cloud hosting, its A records may point to different IP addresses depending on the geographic location of the DNS resolver. This is called GeoDNS or anycast routing, and it ensures visitors connect to the nearest server for optimal performance.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `What IP address does ${d} resolve to? — The A records shown above list all IPv4 addresses that ${d} currently resolves to. Each address represents a server that can handle requests for ${d}.`,
                `Does ${d} use multiple IP addresses? — If more than one A record appears above, then yes — ${d} uses multiple IP addresses, likely for load balancing, redundancy, or CDN distribution.`,
                `What is a DNS A record? — An A record is a DNS entry that maps a domain name to an IPv4 address. It's the most basic DNS record type and is essential for any domain to be reachable on the web.`,
                `How do I find who hosts ${d}? — You can perform a reverse IP lookup on the addresses shown above, or check the WHOIS page for ${d} to find registration and hosting information.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Are A Records?',
            paragraphs: [
                'An A (Address) record maps a domain name to a 32-bit IPv4 address. When you type a domain into your browser, a DNS lookup retrieves its A records — the IP addresses your browser connects to in order to load the website.',
                'A records are the most fundamental DNS record type. Without them, browsers would have no way to find the server hosting a website. Each A record also has a TTL (Time To Live) value that controls how long resolvers cache the result.',
            ],
        },
        {
            heading: 'A Records vs AAAA Records',
            paragraphs: [
                'A records hold IPv4 addresses (32-bit, e.g., 192.0.2.1), while AAAA records hold IPv6 addresses (128-bit, e.g., 2001:db8::1). Both serve the same purpose — mapping a domain to an IP address — but for different versions of the Internet Protocol.',
                'IPv4 addresses are limited to about 4.3 billion unique addresses, which have been fully allocated. IPv6 provides a vastly larger address space. Modern domains ideally support both protocols for maximum accessibility.',
            ],
        },
        {
            heading: 'Multiple A Records and Load Balancing',
            paragraphs: [
                'When a domain has multiple A records, DNS resolvers typically return them in rotating order (round-robin), distributing traffic across several servers. CDN providers like Cloudflare, Fastly, and AWS CloudFront use this technique extensively.',
                'Some domains also use GeoDNS or anycast routing, where A records return different IP addresses depending on the geographic location of the resolver, ensuring visitors connect to the nearest server.',
            ],
        },
        {
            heading: 'Run a Free A Record Lookup',
            paragraphs: [
                'Enter any domain above to instantly retrieve its IPv4 addresses, TTL values, and hosting details. This A record lookup tool queries live DNS data — no software installation or command-line knowledge needed.',
                'For a complete picture, use the IP Lookup tool to see both IPv4 and IPv6 addresses, or try the NS Lookup to find the domain\'s authoritative nameservers and DNS hosting provider.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is an A record and what does it do?',
            answer: 'An A (Address) record is the most fundamental DNS record type. It maps a domain name to a 32-bit IPv4 address, which is the numerical address computers use to communicate over the internet. When you type a domain name into your browser, the browser performs a DNS lookup for the A record to find the server\'s IP address and connect to it.',
        },
        {
            question: 'Why would I have multiple A records for one domain?',
            answer: 'Multiple A records enable DNS-based load balancing, where traffic is distributed across several servers using round-robin rotation. CDN providers like Cloudflare and AWS CloudFront commonly use this technique. Multiple A records also provide redundancy — if one server goes down, traffic is routed to the remaining servers.',
        },
        {
            question: 'What\'s the difference between A records and AAAA records?',
            answer: 'A records map domains to IPv4 addresses (32-bit, like 192.0.2.1), while AAAA records map to IPv6 addresses (128-bit, like 2001:db8::1). IPv4 has roughly 4.3 billion possible addresses and is fully allocated, while IPv6 has a virtually unlimited address space. Modern domains should ideally have both record types.',
        },
        {
            question: 'Can subdomains have different A records than the main domain?',
            answer: 'Yes, subdomains can point to completely different IP addresses than the main domain. For example, www.example.com might point to a CDN server while api.example.com points to an application server and mail.example.com points to a mail server. Each subdomain\'s A record is independently configurable in your DNS settings.',
        },
        {
            question: 'What should I do if my A record points to the wrong IP address?',
            answer: 'Log into your DNS provider\'s control panel and update the A record with the correct IP address. After saving, the change will propagate based on the record\'s TTL value. If you need the change to take effect quickly, consider lowering the TTL before making the change. You can use this A record lookup tool to verify the update has propagated.',
        },
    ],
    relatedPages: ['ip', 'ns', 'mx', 'txt', 'whois'],
    dataSource: 'dns',
};

export const TXT_PAGE: SEOPageConfig = {
    slug: 'txt',
    recordType: 'TXT',
    title: (d) => `${d} TXT Record Lookup — DNS Text Records`,
    description: (d) => `TXT record lookup for ${d}. View SPF, DKIM, DMARC, domain verification, and other text-based DNS records for ${d}.`,
    h1: (d) => `${d} TXT Record Lookup`,
    intro: (d) => `Use this TXT record lookup tool to view all text-based DNS records for ${d}. TXT records are commonly used for email authentication (SPF, DKIM, DMARC), domain ownership verification, and other purposes. Below are all TXT records currently published for ${d}.`,
    landingDescription: 'Free TXT record lookup tool — view SPF, DKIM, DMARC, domain verification tokens, and all text-based DNS records for any domain.',
    sections: (d) => [
        {
            heading: `What Are ${d}'s TXT Records?`,
            paragraphs: [
                `TXT (Text) records for ${d} contain text strings published in DNS. While originally designed for human-readable notes, TXT records are now primarily used for machine-readable data like email authentication policies and domain verification tokens.`,
                `The TXT records for ${d} shown above reveal important information about the domain's email security configuration, which services have verified ownership of ${d}, and any other text-based DNS data the domain administrators have published.`,
                `Each TXT record can hold up to 255 characters per string, though a single record can contain multiple strings concatenated together. Large records like DKIM keys often use this multi-string format.`,
            ],
        },
        {
            heading: 'Common TXT Record Types',
            paragraphs: [
                `SPF (Sender Policy Framework) records start with "v=spf1" and specify which servers are authorized to send email on behalf of ${d}. These are critical for preventing email spoofing and improving deliverability.`,
                `DKIM (DomainKeys Identified Mail) public keys are stored as TXT records under selector subdomains (e.g., selector._domainkey.${d}). DMARC policies are published at _dmarc.${d} and control how receiving servers handle unauthenticated email.`,
                `Domain verification records are used by services like Google ("google-site-verification=..."), Microsoft ("MS=..."), Facebook ("facebook-domain-verification=..."), and Apple ("apple-domain-verification=...") to confirm that ${d}'s owner has authorized the service.`,
            ],
        },
        {
            heading: `Understanding ${d}'s TXT Records`,
            paragraphs: [
                `TXT records may appear cryptic at first, but most follow standard formats. Look for known prefixes to identify the type: "v=spf1" for SPF, "v=DMARC1" for DMARC, "v=DKIM1" for DKIM keys, and service-specific verification strings.`,
                `If ${d} has an SPF record, it defines which IP addresses and services are allowed to send email as ${d}. The presence of DMARC and DKIM records indicates stronger email authentication. Verification records confirm that ${d} is linked to specific third-party services.`,
            ],
        },
        {
            heading: `TXT Record Lookup for ${d}`,
            paragraphs: [
                `This TXT record lookup tool automatically queries DNS for all TXT records published at ${d}. You can also use command-line tools: "dig ${d} TXT" on Linux/macOS or "nslookup -type=txt ${d}" on Windows.`,
                `Note that some TXT records exist on subdomains rather than the root domain. DKIM keys, for example, are at selector._domainkey.${d}. DMARC policies are at _dmarc.${d}. Use the dedicated SPF and DMARC pages for deeper analysis of those specific records.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `Does ${d} have SPF? — Look for a TXT record starting with "v=spf1" in the records above. If present, ${d} has SPF configured to control which servers can send email on its behalf.`,
                `What TXT records does ${d} have? — All TXT records for ${d} are listed above, categorized by type (SPF, DMARC, DKIM, verification, or generic TXT).`,
                `What are TXT records used for? — TXT records serve multiple purposes: email authentication (SPF, DKIM, DMARC), domain ownership verification for services like Google and Microsoft, and storing arbitrary configuration data.`,
                `How do I add a TXT record to my domain? — TXT records are added through your DNS provider's control panel. Log into your DNS hosting dashboard, add a new TXT record with the required value, and save. Changes typically propagate within minutes to hours.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Are TXT Records?',
            paragraphs: [
                'TXT (Text) records store text strings in DNS. Originally designed for human-readable notes, they are now primarily used for machine-readable data like email authentication policies (SPF, DKIM, DMARC) and domain ownership verification tokens.',
                'Each TXT record can hold up to 255 characters per string, though a single record can contain multiple strings concatenated together. Large records like DKIM keys often use this multi-string format.',
            ],
        },
        {
            heading: 'Common TXT Record Types',
            paragraphs: [
                'SPF (Sender Policy Framework) records start with "v=spf1" and specify which servers are authorized to send email for a domain. DKIM public keys are stored as TXT records under selector subdomains. DMARC policies are published at _dmarc subdomains.',
                'Domain verification records are used by services like Google ("google-site-verification=..."), Microsoft ("MS=..."), Facebook ("facebook-domain-verification=..."), and Apple ("apple-domain-verification=...") to confirm domain ownership.',
            ],
        },
        {
            heading: 'Reading TXT Records',
            paragraphs: [
                'TXT records may appear cryptic at first, but most follow standard formats. Look for known prefixes to identify the type: "v=spf1" for SPF, "v=DMARC1" for DMARC, "v=DKIM1" for DKIM keys, and service-specific verification strings.',
                'You can look up TXT records using command-line tools: "dig example.com TXT" on Linux/macOS or "nslookup -type=txt example.com" on Windows. Some TXT records exist on subdomains rather than the root domain.',
            ],
        },
        {
            heading: 'Run a Free TXT Record Lookup',
            paragraphs: [
                'Enter any domain above to view all its TXT records instantly. This tool automatically categorizes records by type — SPF, DKIM, DMARC, verification tokens, and general-purpose entries — making it easy to audit a domain\'s DNS text configuration.',
                'For deeper email security analysis, use the SPF Record Checker to parse SPF mechanisms, the DMARC Checker to evaluate authentication policy, or the Email Security Checker for a comprehensive overview of all email-related DNS records.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is a TXT record and what is it used for?',
            answer: 'A TXT (Text) record stores arbitrary text data in DNS. While originally intended for human-readable notes, TXT records are now primarily used for machine-readable purposes: email authentication (SPF, DKIM, DMARC), domain ownership verification for services like Google and Microsoft, and application-specific configuration data.',
        },
        {
            question: 'What is the character limit for TXT records?',
            answer: 'A single TXT record string can hold up to 255 characters, but a TXT record can contain multiple strings that are concatenated together, allowing records well over 255 characters. DNS protocol limits the total size of all records for a name to about 65,535 bytes. In practice, most DNS providers support TXT records up to several thousand characters.',
        },
        {
            question: 'Can a domain have multiple TXT records?',
            answer: 'Yes, a domain can have many TXT records. It is common to have separate TXT records for SPF, domain verification tokens from multiple services (Google, Microsoft, Facebook), and other purposes. However, a domain should have only one SPF record — having multiple SPF records causes authentication failures.',
        },
        {
            question: 'What are SPF, DKIM, and DMARC TXT records?',
            answer: 'SPF (Sender Policy Framework) specifies which servers may send email for your domain. DKIM (DomainKeys Identified Mail) publishes a public key used to verify email signatures. DMARC (Domain-based Message Authentication, Reporting & Conformance) tells receivers how to handle email that fails SPF or DKIM checks. Together, these three TXT-based records form the foundation of email authentication.',
        },
        {
            question: 'How do I add or modify a TXT record?',
            answer: 'TXT records are managed through your DNS provider\'s control panel. Create a new TXT record, set the host/name field (use @ for the root domain or a subdomain name), and enter the text value. Changes typically propagate within minutes to hours depending on the TTL. Always verify new records using a TXT record lookup tool after making changes.',
        },
    ],
    relatedPages: ['spf', 'dmarc', 'mx', 'ns', 'a'],
    dataSource: 'dns',
};

export const SPF_PAGE: SEOPageConfig = {
    slug: 'spf',
    title: (d) => `${d} SPF Record Checker — Email Authentication`,
    description: (d) => `SPF record checker for ${d}. Parse SPF mechanisms, check authorized senders, and verify ${d}'s email authentication setup.`,
    h1: (d) => `${d} SPF Record Checker`,
    intro: (d) => `Use this SPF record checker to analyze the email authentication setup for ${d}. SPF (Sender Policy Framework) specifies which mail servers are authorized to send email on behalf of ${d}. Below is the parsed SPF record with a breakdown of each mechanism and its effect.`,
    landingDescription: 'Free SPF record checker — parse SPF mechanisms, verify authorized email senders, and check DNS lookup limits for any domain.',
    sections: (d) => [
        {
            heading: `SPF Record Check for ${d}`,
            paragraphs: [
                `The SPF record for ${d} defines exactly which IP addresses and mail services are permitted to send email using @${d} addresses. When a receiving mail server gets an email claiming to be from ${d}, it checks this SPF record to verify that the sending server is authorized.`,
                `If ${d}'s SPF record is configured correctly, it protects against email spoofing — preventing unauthorized parties from sending emails that appear to come from ${d}. A missing or misconfigured SPF record can lead to delivery problems and makes the domain vulnerable to phishing attacks.`,
                `This SPF record checker breaks down each component of ${d}'s SPF record, showing which IP ranges and services are included and whether the policy ends with a hard fail (-all), soft fail (~all), or neutral (?all) for unauthorized senders.`,
            ],
        },
        {
            heading: 'What Is SPF?',
            paragraphs: [
                `SPF (Sender Policy Framework), defined in RFC 7208, works by publishing a DNS TXT record that lists the IP addresses and domains allowed to send email for ${d}. Receiving mail servers check this record to verify that incoming email actually comes from an authorized source.`,
                `Without SPF, anyone on the internet can forge the "From" address in an email to impersonate ${d}. SPF helps prevent this by giving receiving servers a way to verify that the sending server's IP address is authorized by ${d}'s domain administrators.`,
            ],
        },
        {
            heading: 'SPF Syntax Explained',
            paragraphs: [
                `An SPF record starts with "v=spf1" and contains one or more mechanisms: "ip4:" and "ip6:" specify allowed IP ranges, "include:" references another domain's SPF record, "a" allows the domain's own A record IPs, "mx" allows IPs from MX records, and "all" is the catch-all at the end.`,
                `Qualifiers modify how each mechanism is evaluated: "+" means pass (default if omitted), "-" means hard fail, "~" means soft fail, and "?" means neutral. A record ending in "-all" strictly rejects unauthorized senders, while "~all" marks them as suspicious but doesn't outright reject them. Best practice for ${d} is to use "-all" once all legitimate sending sources are accounted for.`,
            ],
        },
        {
            heading: 'SPF Best Practices',
            paragraphs: [
                `Keep the SPF record under the 10 DNS lookup limit — each "include:", "a", "mx", and "redirect" mechanism counts toward this limit. Exceeding it causes a "permerror" that can result in all email from ${d} failing SPF checks.`,
                `Use "-all" instead of "~all" once you're confident all legitimate senders for ${d} are included. Regularly audit the "include:" entries to remove services ${d} no longer uses. If the record is approaching the 10-lookup limit, consider "flattening" includes into explicit IP ranges.`,
                `Monitor SPF alignment with DMARC reports. DMARC aggregate reports will show you if legitimate email from ${d} is failing SPF checks, which helps identify missing authorized senders.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `Does ${d} have SPF? — The analysis above shows whether ${d} has a published SPF record and details its contents. If no SPF record is found, ${d} has not configured email sender authorization.`,
                `What is ${d}'s SPF policy? — The SPF policy is determined by the final mechanism in the record. "-all" means hard fail (reject unauthorized senders), "~all" means soft fail (flag but don't reject), and "?all" means neutral (no policy).`,
                `Is ${d} protected from email spoofing? — SPF alone provides partial protection. Full email spoofing protection for ${d} requires SPF combined with DKIM and a DMARC policy set to "quarantine" or "reject". Check ${d}'s DMARC page for the full picture.`,
                `Why is email from ${d} going to spam? — If SPF checks are failing, email from ${d} may be flagged as suspicious. Verify that all sending servers and services are included in the SPF record.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is SPF?',
            paragraphs: [
                'SPF (Sender Policy Framework), defined in RFC 7208, is an email authentication protocol that specifies which mail servers are authorized to send email for a domain. It works by publishing a DNS TXT record listing allowed IP addresses and domains.',
                'Without SPF, anyone on the internet can forge the "From" address in an email to impersonate a domain. SPF gives receiving servers a way to verify that the sending server\'s IP address is actually authorized by the domain\'s administrators.',
            ],
        },
        {
            heading: 'SPF Syntax Explained',
            paragraphs: [
                'An SPF record starts with "v=spf1" and contains mechanisms: "ip4:" and "ip6:" specify allowed IP ranges, "include:" references another domain\'s SPF record, "a" allows the domain\'s own A record IPs, "mx" allows IPs from MX records, and "all" is the catch-all.',
                'Qualifiers modify evaluation: "+" means pass (default), "-" means hard fail, "~" means soft fail, and "?" means neutral. Best practice is to end with "-all" once all legitimate senders are accounted for.',
            ],
        },
        {
            heading: 'SPF Best Practices',
            paragraphs: [
                'Keep the SPF record under the 10 DNS lookup limit — each "include:", "a", "mx", and "redirect" mechanism counts. Exceeding it causes a "permerror" that can result in all email failing SPF checks.',
                'Use "-all" instead of "~all" once you\'re confident all legitimate senders are included. Regularly audit "include:" entries to remove unused services. If approaching the 10-lookup limit, consider flattening includes into explicit IP ranges.',
            ],
        },
        {
            heading: 'Check Your SPF Record Now',
            paragraphs: [
                'Enter any domain above to parse its SPF record and see every authorized sender, IP range, and include directive. This SPF record checker validates syntax, counts DNS lookups against the 10-lookup limit, and flags common misconfigurations.',
                'SPF works best alongside DMARC. After checking your SPF record, use the DMARC Checker to verify your authentication policy, or run a full Email Security Checker audit to assess SPF, DMARC, MTA-STS, and BIMI together.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is SPF and why is it important?',
            answer: 'SPF (Sender Policy Framework) is an email authentication protocol that prevents email spoofing by specifying which mail servers are authorized to send email for your domain. It works by publishing a TXT record in DNS that receiving servers check during email delivery. An SPF record checker verifies this configuration is correct. Without SPF, anyone can forge emails appearing to come from your domain.',
        },
        {
            question: 'What should my SPF record look like?',
            answer: 'An SPF record starts with "v=spf1" followed by mechanisms that authorize senders. A typical record looks like: "v=spf1 include:_spf.google.com include:sendgrid.net -all". The "include:" directives authorize third-party services, and "-all" means reject all other senders. Replace the includes with your actual email providers.',
        },
        {
            question: 'Can a domain have multiple SPF records?',
            answer: 'No. RFC 7208 specifies that a domain must have at most one SPF record. Having multiple SPF records causes a "permerror" result, which means receiving servers cannot determine your SPF policy and may reject or flag your email. If you need to authorize multiple services, combine them into a single SPF record using multiple "include:" mechanisms.',
        },
        {
            question: 'What does the DNS lookup limit in SPF mean?',
            answer: 'SPF allows a maximum of 10 DNS lookups when evaluating a record. Each "include:", "a", "mx", and "redirect" mechanism triggers a DNS lookup, and nested includes count toward the total. Exceeding 10 lookups causes a "permerror" that can result in all email failing SPF. To stay under the limit, consolidate includes or flatten them into explicit IP ranges.',
        },
        {
            question: 'What\'s the difference between "~all" and "-all" in SPF records?',
            answer: '"~all" (tilde) is a soft fail — it tells receiving servers that unauthorized senders should be treated with suspicion but not necessarily rejected. "-all" (hyphen) is a hard fail — it instructs receivers to reject email from unauthorized sources. Best practice is to start with "~all" during setup, then switch to "-all" once you\'ve confirmed all legitimate senders are included.',
        },
    ],
    relatedPages: ['dmarc', 'mx', 'txt', 'a', 'ns'],
    dataSource: 'email',
};

export const DMARC_PAGE: SEOPageConfig = {
    slug: 'dmarc',
    title: (d) => `${d} DMARC Checker — Email Policy Analysis`,
    description: (d) => `DMARC checker for ${d}. Check enforcement level, reporting configuration, SPF/DKIM alignment, and email authentication status for ${d}.`,
    h1: (d) => `${d} DMARC Checker`,
    intro: (d) => `Use this DMARC checker to analyze the email authentication policy for ${d}. DMARC builds on SPF and DKIM to control how receiving servers handle unauthenticated email claiming to come from ${d}. Below is ${d}'s DMARC policy analysis.`,
    landingDescription: 'Free DMARC checker — analyze DMARC policies, check enforcement levels, SPF/DKIM alignment, and reporting configuration for any domain.',
    sections: (d) => [
        {
            heading: `DMARC Check for ${d}`,
            paragraphs: [
                `The DMARC record for ${d} is published as a DNS TXT record at _dmarc.${d}. It tells receiving mail servers what to do when an email claiming to be from ${d} fails SPF and DKIM authentication checks — whether to deliver it normally, send it to spam, or reject it entirely.`,
                `DMARC also provides ${d}'s administrators with visibility into who is sending email using their domain. Through aggregate reports (rua) and forensic reports (ruf), domain owners can monitor authorized and unauthorized email activity.`,
                `This DMARC checker shows ${d}'s current DMARC policy, alignment settings, and reporting configuration. A well-configured DMARC policy is essential for protecting ${d} from email spoofing and phishing attacks.`,
            ],
        },
        {
            heading: 'What Is DMARC?',
            paragraphs: [
                `DMARC is an email authentication policy layer that sits on top of SPF and DKIM. While SPF verifies the sending server and DKIM verifies the message hasn't been altered, DMARC ties them together by requiring that at least one of these checks "aligns" with the From header domain.`,
                `Without DMARC, even if ${d} has SPF and DKIM configured, receiving servers have no instruction on what to do when authentication fails. DMARC fills this gap by providing an explicit policy (none, quarantine, or reject) and a feedback mechanism through reporting.`,
            ],
        },
        {
            heading: 'DMARC Policies Explained',
            paragraphs: [
                `DMARC has three policy levels. "p=none" is monitor-only mode — authentication failures are reported but email is delivered normally. This is the recommended starting point for ${d} when first implementing DMARC. "p=quarantine" sends failing emails to the spam/junk folder. "p=reject" blocks them entirely, providing the strongest protection.`,
                `The "pct" tag controls what percentage of failing messages the policy applies to, allowing a gradual rollout. For example, ${d} could start with "p=reject; pct=10" to reject only 10% of failing messages while monitoring the impact, then gradually increase to 100%.`,
                `Most organizations roll out DMARC in phases: start with "p=none" to gather data, analyze reports to identify all legitimate email sources, add them to SPF/DKIM, then move to "p=quarantine" and finally "p=reject". Check ${d}'s current policy level above.`,
            ],
        },
        {
            heading: 'DMARC Alignment',
            paragraphs: [
                `DMARC requires that either SPF or DKIM "aligns" with the From header domain. For ${d}, this means the SPF-authenticated domain or the DKIM signing domain must match ${d} (or a subdomain of ${d} in relaxed mode).`,
                `Alignment can be "strict" (exact domain match only) or "relaxed" (organizational domain match, allowing subdomains). The "aspf" tag controls SPF alignment and "adkim" controls DKIM alignment. Most domains use relaxed alignment (the default) because it's more flexible while still providing good protection.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `Does ${d} have DMARC? — The analysis above shows whether ${d} has a published DMARC record at _dmarc.${d}. If no record is found, ${d} has not configured a DMARC policy.`,
                `What is ${d}'s DMARC policy? — The policy level (none, quarantine, or reject) is shown in the analysis above. "reject" provides the strongest protection, while "none" is monitoring-only.`,
                `Does ${d} enforce email authentication? — A DMARC policy of "quarantine" or "reject" indicates that ${d} actively enforces email authentication. A policy of "none" means ${d} monitors but doesn't enforce.`,
                `How do I set up DMARC for my domain? — Start by creating a TXT record at _dmarc.yourdomain.com with the value "v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com". Monitor the reports, then gradually increase enforcement to quarantine and reject.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is DMARC?',
            paragraphs: [
                'DMARC (Domain-based Message Authentication, Reporting & Conformance) is an email authentication policy layer that builds on SPF and DKIM. While SPF verifies the sending server and DKIM verifies message integrity, DMARC ties them together by requiring alignment with the From header domain.',
                'Without DMARC, receiving servers have no instruction on what to do when SPF or DKIM checks fail. DMARC fills this gap with an explicit policy (none, quarantine, or reject) and a reporting mechanism for domain owners.',
            ],
        },
        {
            heading: 'DMARC Policies Explained',
            paragraphs: [
                'DMARC has three policy levels. "p=none" is monitor-only — failures are reported but email is delivered normally. "p=quarantine" sends failing emails to spam. "p=reject" blocks them entirely, providing the strongest protection against spoofing.',
                'Most organizations roll out DMARC in phases: start with "p=none" to gather data, analyze reports to identify all legitimate email sources, configure SPF/DKIM, then move to "p=quarantine" and finally "p=reject".',
            ],
        },
        {
            heading: 'DMARC Alignment and Reporting',
            paragraphs: [
                'DMARC requires that either SPF or DKIM "aligns" with the From header domain. Alignment can be "strict" (exact match) or "relaxed" (organizational domain match, allowing subdomains). Most domains use relaxed alignment for flexibility.',
                'DMARC aggregate reports (rua) provide visibility into who is sending email using a domain. Forensic reports (ruf) provide details on individual authentication failures. These reports help domain owners identify unauthorized use and fix configuration issues.',
            ],
        },
        {
            heading: 'Check Your DMARC Policy Now',
            paragraphs: [
                'Enter any domain above to instantly analyze its DMARC record. This DMARC checker parses the policy level, alignment mode, percentage enforcement, and reporting addresses — giving you a clear picture of a domain\'s email authentication posture.',
                'DMARC depends on SPF and DKIM. After reviewing your DMARC policy, use the SPF Record Checker to verify sender authorization, or run the Email Security Checker for a complete audit of MX, SPF, DMARC, MTA-STS, and BIMI records.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is DMARC and what does it protect?',
            answer: 'DMARC (Domain-based Message Authentication, Reporting & Conformance) is an email authentication protocol that protects your domain from being used in phishing and spoofing attacks. It builds on SPF and DKIM by adding a policy layer that tells receiving servers what to do when authentication fails. A DMARC checker verifies your policy is correctly configured and provides reporting so domain owners can monitor unauthorized use.',
        },
        {
            question: 'What should my DMARC record contain?',
            answer: 'A basic DMARC record looks like: "v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com". The "v" tag identifies the DMARC version, "p" sets the policy (none, quarantine, or reject), and "rua" specifies where to send aggregate reports. Start with "p=none" to gather data, then increase enforcement to "quarantine" and eventually "reject".',
        },
        {
            question: 'What\'s the difference between DMARC, SPF, and DKIM?',
            answer: 'SPF verifies that the sending server\'s IP is authorized for the domain. DKIM verifies that the email content hasn\'t been tampered with using cryptographic signatures. DMARC ties them together by requiring that at least one (SPF or DKIM) aligns with the From header domain, and provides a policy for handling failures. All three work together for comprehensive email authentication.',
        },
        {
            question: 'What does a DMARC policy of "none" mean?',
            answer: 'A DMARC policy of "p=none" is monitoring-only mode. Receiving servers will check SPF and DKIM alignment but will deliver email normally regardless of the result. Authentication results are sent to the reporting address (rua) so domain owners can analyze who is sending email on their behalf before enabling enforcement. This is the recommended starting point for DMARC deployment.',
        },
        {
            question: 'Why am I getting DMARC failures?',
            answer: 'DMARC failures occur when neither SPF nor DKIM aligns with the From header domain. Common causes include: sending through a service not listed in your SPF record, missing or misconfigured DKIM signing, email forwarding that breaks SPF alignment, and third-party services sending on your behalf without proper authentication setup. Review your DMARC aggregate reports to identify the specific sources of failure.',
        },
    ],
    relatedPages: ['spf', 'mx', 'txt', 'ns', 'whois'],
    dataSource: 'email',
};

export const WHOIS_PAGE: SEOPageConfig = {
    slug: 'whois',
    title: (d) => `${d} WHOIS Lookup — Domain Registration Info`,
    description: (d) => `WHOIS information for ${d}. View registration dates, registrar, expiration, nameservers, domain status, and DNSSEC status for ${d}.`,
    h1: (d) => `${d} WHOIS Lookup`,
    intro: (d) => `Use this WHOIS lookup tool to view public registration information for ${d}, including when the domain was registered, when it expires, which registrar manages it, and the current nameservers. Below is the current WHOIS data for ${d}.`,
    landingDescription: 'Free WHOIS lookup tool — check domain registration dates, registrar info, expiration, nameservers, and DNSSEC status for any domain.',
    sections: (d) => [
        {
            heading: `WHOIS Lookup Results for ${d}`,
            paragraphs: [
                `This WHOIS lookup shows key registration details for ${d}: the date it was first registered, when it was last updated, and when it's set to expire. This information is maintained by ${d}'s registrar and published through the WHOIS/RDAP protocol.`,
                `Registration dates for ${d} can indicate the domain's maturity and trustworthiness. Older domains that have been continuously registered tend to have more established reputations. The expiration date tells you when ${d}'s registration needs to be renewed to remain active.`,
                `LDNS retrieves this data using RDAP (Registration Data Access Protocol), the modern replacement for the legacy WHOIS protocol. RDAP provides structured JSON responses with better reliability and standardized access controls.`,
            ],
        },
        {
            heading: 'What Is WHOIS?',
            paragraphs: [
                `WHOIS is a query-and-response protocol used to look up information about registered domain names like ${d}. It reveals the registrar, registration and expiration dates, nameservers, and domain status codes. Originally created in the early days of the internet, WHOIS data is maintained by domain registrars and registries.`,
                `The traditional WHOIS protocol (port 43) is being replaced by RDAP, which provides structured JSON responses and better access controls. Both serve the same purpose: making domain registration data publicly accessible for transparency and accountability.`,
            ],
        },
        {
            heading: 'Understanding Domain Status Codes',
            paragraphs: [
                `Domain status codes for ${d} indicate its current state and any restrictions in place. Common statuses include "clientTransferProhibited" (transfer locked by the registrar), "clientDeleteProhibited" (deletion locked), and "ok" or "active" (normal operation with no restrictions).`,
                `Statuses prefixed with "client" are set by the registrar at the domain owner's request, while "server" prefixes indicate restrictions set by the registry. If ${d} shows "redemptionPeriod" or "pendingDelete", the domain is in the process of being released. "serverHold" means the registry has suspended the domain.`,
            ],
        },
        {
            heading: 'WHOIS Privacy and GDPR',
            paragraphs: [
                `Since GDPR took effect in 2018, many registrars redact personal information from WHOIS results for domains like ${d}. Contact details for registrants — especially European ones — are typically hidden behind privacy services, showing only the registrar's privacy proxy information.`,
                `Even without GDPR, many domain owners opt for WHOIS privacy protection to prevent spam, social engineering, and domain-related scams. If ${d}'s WHOIS data shows redacted contact information, this is standard practice and does not indicate anything unusual about the domain.`,
            ],
        },
        {
            heading: 'Domain Registration Lifecycle',
            paragraphs: [
                `Every domain like ${d} follows a lifecycle: registration, active use, renewal, and potentially expiration. After expiration, a domain enters a grace period (typically 30 days), then a redemption period (another 30 days at a higher recovery fee), and finally becomes available for anyone to register.`,
                `Monitoring ${d}'s expiration date is critical for domain owners. Letting a domain expire can result in loss of the domain, website downtime, email disruption, and potential acquisition by domain squatters. Many registrars offer auto-renewal to prevent accidental expiration.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `When was ${d} registered? — The registration date is shown in the WHOIS data above. This indicates when ${d} was first registered with a domain registrar.`,
                `When does ${d} expire? — The expiration date in the WHOIS data above shows when ${d}'s current registration period ends. The domain must be renewed before this date to remain active.`,
                `Who is the registrar for ${d}? — The registrar name is listed in the WHOIS data. The registrar is the company through which ${d}'s registration is managed (e.g., GoDaddy, Namecheap, Cloudflare, Google Domains).`,
                `Is ${d} available to register? — If this page shows WHOIS data, ${d} is already registered. If no registration data is found, the domain may be available for registration.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is WHOIS?',
            paragraphs: [
                'WHOIS is a query-and-response protocol used to look up registration information about domain names. It reveals the registrar, registration and expiration dates, nameservers, and domain status codes.',
                'The traditional WHOIS protocol (port 43) is being replaced by RDAP (Registration Data Access Protocol), which provides structured JSON responses and better access controls. Both serve the same purpose: making domain registration data publicly accessible.',
            ],
        },
        {
            heading: 'Understanding Domain Status Codes',
            paragraphs: [
                'Domain status codes indicate a domain\'s current state. Common statuses include "clientTransferProhibited" (transfer locked), "clientDeleteProhibited" (deletion locked), and "ok" or "active" (normal operation).',
                '"Client" prefixed statuses are set by the registrar, while "server" prefixes are set by the registry. Statuses like "redemptionPeriod" or "pendingDelete" indicate a domain is being released.',
            ],
        },
        {
            heading: 'WHOIS Privacy and Domain Lifecycle',
            paragraphs: [
                'Since GDPR took effect in 2018, many registrars redact personal information from WHOIS results. Contact details are typically hidden behind privacy services. This is standard practice and does not indicate anything unusual.',
                'Every domain follows a lifecycle: registration, active use, renewal, and potentially expiration. After expiration, a domain enters a grace period (~30 days), then a redemption period (~30 days at higher cost), and finally becomes available for public registration.',
            ],
        },
        {
            heading: 'Run a Free WHOIS Lookup',
            paragraphs: [
                'Enter any domain above to view its registration data via RDAP — the modern successor to legacy WHOIS. Results include registrar, registration and expiration dates, nameservers, domain status codes, and DNSSEC information.',
                'Want to investigate further? Use the NS Lookup to verify the domain\'s nameservers match its WHOIS data, or try the RDAP Lookup for the complete raw registration record with all available contact and event details.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is WHOIS and how is it different from RDAP?',
            answer: 'WHOIS is a legacy protocol (port 43) for querying domain registration data. RDAP (Registration Data Access Protocol) is its modern replacement, providing structured JSON responses, standardized access controls, and better internationalization support. RDAP is now the preferred method used by registries and registrars. This tool uses RDAP to retrieve registration data.',
        },
        {
            question: 'What information can I find with a WHOIS lookup?',
            answer: 'A WHOIS lookup reveals public registration information including: the domain registrar, registration and expiration dates, last update date, nameservers, domain status codes (like clientTransferProhibited), and DNSSEC status. Use this WHOIS lookup tool to check any domain. Depending on privacy settings, it may also show registrant contact information.',
        },
        {
            question: 'Can I hide my personal information in WHOIS/RDAP records?',
            answer: 'Yes. Most registrars offer WHOIS privacy protection services that replace your personal contact information with proxy details. Additionally, since GDPR took effect in 2018, registrars automatically redact personal data for European registrants. Many registrars now offer free privacy protection for all customers regardless of location.',
        },
        {
            question: 'Why is RDAP replacing WHOIS?',
            answer: 'RDAP replaces WHOIS because the original protocol had significant limitations: unstructured text responses that varied between registrars, no standardized access controls, no support for internationalized domain names, and no built-in authentication. RDAP addresses all of these issues with structured JSON, standardized queries, and secure access mechanisms.',
        },
        {
            question: 'What\'s the difference between registrant, admin, and technical contacts?',
            answer: 'The registrant is the legal owner of the domain. The admin contact has authority to make administrative decisions about the domain. The technical contact manages the domain\'s DNS and technical infrastructure. In practice, small organizations often use the same person for all three roles, while large organizations may assign different departments to each role.',
        },
    ],
    relatedPages: ['ns', 'a', 'mx', 'ip', 'txt'],
    dataSource: 'rdap',
};

export const IP_PAGE: SEOPageConfig = {
    slug: 'ip',
    recordType: 'A',
    title: (d) => `${d} IP Lookup — IPv4 & IPv6 Addresses`,
    description: (d) => `IP lookup for ${d}. View both IPv4 (A record) and IPv6 (AAAA record) addresses, and check whether ${d} supports IPv6.`,
    h1: (d) => `${d} IP Lookup`,
    intro: (d) => `Use this IP lookup tool to find the IPv4 and IPv6 addresses for ${d}. Every website on the internet is reachable via IP addresses, retrieved from DNS A and AAAA records. Below are the current addresses showing exactly which servers handle traffic for ${d}.`,
    landingDescription: 'Free IP lookup tool — find IPv4 and IPv6 addresses, check dual-stack support, and identify hosting infrastructure for any domain.',
    sections: (d) => [
        {
            heading: `${d}'s IP Address Information`,
            paragraphs: [
                `The IP addresses shown above are the servers that ${d} currently resolves to. IPv4 addresses come from A records and IPv6 addresses come from AAAA records. When your browser connects to ${d}, it uses one of these addresses to establish a connection.`,
                `If ${d} has multiple IP addresses, it typically means the domain uses load balancing or a CDN (Content Delivery Network) to distribute traffic across multiple servers. This improves performance and provides redundancy — if one server goes down, others continue serving ${d}'s content.`,
                `The presence of both IPv4 and IPv6 addresses indicates that ${d} supports dual-stack networking, making it accessible to users on both protocol versions. This is a best practice for modern internet services.`,
            ],
        },
        {
            heading: 'What Is an IP Address?',
            paragraphs: [
                `An IP (Internet Protocol) address is a numerical label assigned to every device connected to the internet. IPv4 addresses use 32 bits (e.g., 192.0.2.1) and IPv6 addresses use 128 bits (e.g., 2001:0db8::1). Domain names like ${d} are human-readable names that map to these addresses via DNS.`,
                `When you visit ${d}, your browser first performs a DNS lookup to translate the domain name into an IP address. It then establishes a TCP connection to that IP address on port 443 (HTTPS) or port 80 (HTTP) to load the website.`,
            ],
        },
        {
            heading: 'IPv4 vs IPv6',
            paragraphs: [
                `IPv4 supports approximately 4.3 billion unique addresses, which have been fully allocated since 2011. IPv6 was created to solve this exhaustion problem, providing a vastly larger address space of 340 undecillion addresses (3.4 × 10^38).`,
                `Check whether ${d} supports IPv6 by looking for AAAA records in the results above. If only A records exist, ${d} is IPv4-only and may be unreachable to users on IPv6-only networks. Modern websites should support both protocols for maximum accessibility.`,
                `Many CDN and cloud providers automatically provide IPv6 support. If ${d} uses Cloudflare, AWS CloudFront, or similar services, it likely supports IPv6 through the provider's infrastructure even if the origin server is IPv4-only.`,
            ],
        },
        {
            heading: 'Shared vs Dedicated IP Addresses',
            paragraphs: [
                `On shared hosting, multiple domains share the same IP address. The web server uses the HTTP Host header (or TLS SNI extension) to route requests to the correct website. If ${d} shares an IP with other domains, this is standard practice and does not affect performance or security.`,
                `Dedicated IP addresses give a single domain its own address. This can be important for certain SSL certificate configurations on legacy systems, email deliverability (dedicated IPs build their own reputation), and regulatory requirements. Check whether ${d}'s IP address is shared by performing a reverse DNS lookup.`,
            ],
        },
        {
            heading: `IP Lookup for ${d}`,
            paragraphs: [
                `This IP lookup tool automatically queries DNS for ${d}'s A and AAAA records. You can also use command-line tools: "dig ${d} A" and "dig ${d} AAAA" on Linux/macOS, "nslookup ${d}" on Windows, or "ping ${d}" to see the resolved IP address.`,
                `IP addresses for ${d} can change over time — especially if the domain uses a CDN, cloud hosting, or dynamic DNS. Always perform a fresh IP lookup rather than relying on cached results when troubleshooting connectivity issues.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `What is ${d}'s IP address? — The current IPv4 and IPv6 addresses for ${d} are shown above, retrieved from DNS A and AAAA records.`,
                `Does ${d} support IPv6? — If AAAA records appear in the results above, ${d} supports IPv6. If only A records are present, the domain is IPv4-only.`,
                `How many IP addresses does ${d} have? — The total count of A and AAAA records indicates how many IP addresses ${d} uses. Multiple addresses suggest load balancing or CDN usage.`,
                `Why does ${d}'s IP address keep changing? — Domains using CDNs or cloud services often return different IP addresses based on your geographic location or current server load. This is normal behavior designed to optimize performance.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is an IP Address?',
            paragraphs: [
                'An IP (Internet Protocol) address is a numerical label assigned to every device connected to the internet. IPv4 addresses use 32 bits (e.g., 192.0.2.1) and IPv6 addresses use 128 bits (e.g., 2001:0db8::1). Domain names are human-readable names that map to these addresses via DNS.',
                'When you visit a website, your browser first performs a DNS lookup to translate the domain name into an IP address, then establishes a TCP connection to that address to load the site.',
            ],
        },
        {
            heading: 'IPv4 vs IPv6',
            paragraphs: [
                'IPv4 supports approximately 4.3 billion unique addresses, which have been fully allocated since 2011. IPv6 was created to solve this exhaustion problem, providing 340 undecillion addresses (3.4 x 10^38).',
                'Modern websites should support both protocols. Many CDN and cloud providers automatically provide IPv6 support through their infrastructure, even if the origin server is IPv4-only.',
            ],
        },
        {
            heading: 'Shared vs Dedicated IP Addresses',
            paragraphs: [
                'On shared hosting, multiple domains share the same IP address. The web server uses the HTTP Host header or TLS SNI extension to route requests to the correct website. This is standard practice and does not affect performance.',
                'Dedicated IP addresses give a single domain its own address. This can matter for certain SSL configurations on legacy systems, email deliverability (dedicated IPs build their own reputation), and regulatory requirements.',
            ],
        },
        {
            heading: 'Run a Free IP Lookup',
            paragraphs: [
                'Enter any domain above to see its IPv4 and IPv6 addresses instantly. This IP lookup tool queries live DNS A and AAAA records and shows whether a domain supports dual-stack networking — no command-line tools or installations needed.',
                'For more DNS details, use the A Record Lookup for in-depth IPv4 analysis, the NS Lookup to find the domain\'s authoritative nameservers, or the WHOIS Lookup to check domain registration and expiration dates.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What\'s the difference between IPv4 and IPv6 addresses?',
            answer: 'IPv4 addresses are 32-bit numbers written as four decimal octets (e.g., 192.0.2.1), providing about 4.3 billion unique addresses. IPv6 addresses are 128-bit numbers written in hexadecimal groups (e.g., 2001:db8::1), providing a virtually unlimited address space. IPv4 addresses are fully allocated, which is why IPv6 was developed as its successor.',
        },
        {
            question: 'How accurate is IP geolocation?',
            answer: 'IP geolocation accuracy varies significantly. Country-level accuracy is typically above 95%. City-level accuracy ranges from 50% to 80% depending on the IP range and data provider. Street-level accuracy is generally unreliable. IP addresses assigned to CDNs, VPNs, or mobile networks may geolocate to the provider\'s data center rather than the actual user or server location.',
        },
        {
            question: 'Why would a domain have multiple IP addresses?',
            answer: 'Multiple IP addresses indicate that a domain uses load balancing, a CDN, or redundant hosting. DNS resolvers rotate through multiple A records (round-robin) to distribute traffic across servers. CDN providers like Cloudflare and AWS CloudFront return different IP addresses based on the user\'s geographic location to route traffic to the nearest edge server.',
        },
        {
            question: 'Can an IP lookup reveal my exact home address?',
            answer: 'No. An IP lookup cannot determine your exact physical address. It can typically identify your ISP, approximate city or region, and sometimes your organization. Use this IP lookup tool to check what information is publicly visible for any domain. Only your ISP has records linking your IP address to your physical address, and they are legally required to protect that information.',
        },
        {
            question: 'Does my domain need IPv6 support?',
            answer: 'While not strictly required today, IPv6 support is increasingly recommended. Some networks and regions are IPv6-only, meaning users on those networks cannot reach IPv4-only domains without translation services. Many cloud providers and CDNs offer automatic IPv6 support at no additional cost. Adding AAAA records to your domain future-proofs it for the ongoing IPv6 transition.',
        },
    ],
    relatedPages: ['a', 'ns', 'mx', 'whois', 'txt'],
    dataSource: 'dns',
};

export const RDAP_PAGE: SEOPageConfig = {
    slug: 'rdap',
    title: (d) => `${d} RDAP Lookup — Full Registration Data`,
    description: (d) => `RDAP lookup for ${d}. View complete domain registration data including registrar, status codes, nameservers, events, contacts, and DNSSEC via the modern RDAP protocol.`,
    h1: (d) => `${d} RDAP Lookup`,
    intro: (d) => `Use this RDAP lookup tool to retrieve the full registration record for ${d}. RDAP (Registration Data Access Protocol) is the modern successor to WHOIS, providing structured, machine-readable domain registration data. Below is the complete RDAP response for ${d}.`,
    landingDescription: 'Free RDAP lookup tool — view complete domain registration data including registrar, dates, status codes, nameservers, events, and DNSSEC via the modern RDAP protocol.',
    sections: (d) => [
        {
            heading: `RDAP Registration Data for ${d}`,
            paragraphs: [
                `This RDAP lookup retrieves the authoritative registration record for ${d} directly from the domain registry. Unlike legacy WHOIS, RDAP returns structured JSON data with standardized fields, making it easier to parse and process programmatically.`,
                `The RDAP response for ${d} includes the registrar of record, all registration events (created, updated, expires, transferred), domain status codes, nameserver delegation, and DNSSEC signing information. Contact details may be redacted for privacy compliance.`,
                `RDAP data for ${d} comes from the registry responsible for the domain's TLD. For .com and .net domains, this is Verisign. For ccTLDs like .uk or .de, it's the respective country's registry. The data shown below is the authoritative source of truth for ${d}'s registration.`,
            ],
        },
        {
            heading: 'What Is RDAP?',
            paragraphs: [
                `RDAP (Registration Data Access Protocol), defined in RFC 7480–7484, is the IETF-standardized replacement for the legacy WHOIS protocol. While WHOIS dates back to the 1980s and returns unstructured text, RDAP provides JSON responses with consistent field names, proper Unicode support, and built-in access controls.`,
                `RDAP queries for ${d} are made over HTTPS, providing encryption and authentication that legacy WHOIS (port 43, plaintext) cannot offer. This makes RDAP more secure and reliable, especially for automated queries and integration with other systems.`,
            ],
        },
        {
            heading: 'Understanding Domain Status Codes',
            paragraphs: [
                `The RDAP response for ${d} includes EPP (Extensible Provisioning Protocol) status codes that indicate the domain's current state. Common statuses include "clientTransferProhibited" (transfer locked by registrar), "clientDeleteProhibited" (deletion locked), "serverHold" (registry suspension), and "active" or "ok" (normal operation).`,
                `Status codes prefixed with "client" are set by ${d}'s registrar at the domain owner's request. Codes prefixed with "server" are set by the registry and typically indicate policy enforcement or legal holds. If ${d} shows "redemptionPeriod" or "pendingDelete", the domain is in the process of being released.`,
            ],
        },
        {
            heading: 'RDAP Events and Registration Timeline',
            paragraphs: [
                `RDAP provides a complete event history for ${d}, including when the domain was first registered, when it was last updated, when it expires, and when it was transferred between registrars. This timeline is more comprehensive than what legacy WHOIS typically provides.`,
                `The "registration" event shows when ${d} was originally created. The "expiration" event indicates when the current registration period ends. Domains must be renewed before expiration to remain active. The "last changed" or "last update" event reflects the most recent modification to ${d}'s registration data.`,
            ],
        },
        {
            heading: 'DNSSEC Information',
            paragraphs: [
                `RDAP responses include DNSSEC (Domain Name System Security Extensions) data for ${d}, showing whether the domain is signed and which cryptographic algorithms are in use. DNSSEC protects against DNS spoofing by enabling cryptographic verification of DNS responses.`,
                `If ${d} has DNSSEC enabled, the RDAP response will include DS (Delegation Signer) records that link the domain to its DNSSEC keys. A signed domain provides stronger security guarantees for visitors, as DNS responses can be verified as authentic.`,
            ],
        },
        {
            heading: 'Frequently Asked Questions',
            paragraphs: [
                `What registrar manages ${d}? — The registrar name and IANA ID are shown in the RDAP response above. The registrar is the company through which ${d}'s registration is maintained.`,
                `When does ${d} expire? — The expiration event in the RDAP data shows when ${d}'s current registration period ends. The domain must be renewed before this date.`,
                `Is ${d} DNSSEC signed? — Check the secureDNS section of the RDAP response. If delegation is signed and DS records are present, the domain has DNSSEC enabled.`,
                `Why is contact information redacted? — GDPR and other privacy regulations require registrars to redact personal data from public RDAP responses. Contact details may show "REDACTED FOR PRIVACY" or similar placeholder text.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is RDAP?',
            paragraphs: [
                'RDAP (Registration Data Access Protocol) is the modern, IETF-standardized replacement for the legacy WHOIS protocol. Defined in RFC 7480–7484, RDAP provides structured JSON responses over HTTPS with consistent field names, proper internationalization, and built-in access controls.',
                'Unlike WHOIS (which dates to the 1980s and uses plaintext on port 43), RDAP offers encryption, authentication, and machine-readable output. This makes it the preferred protocol for programmatic access to domain registration data.',
            ],
        },
        {
            heading: 'RDAP vs WHOIS',
            paragraphs: [
                'WHOIS returns unstructured text that varies between registrars, making parsing difficult. RDAP returns standardized JSON with defined schemas, ensuring consistent data across all registries and registrars.',
                'RDAP supports proper Unicode for internationalized domain names (IDNs), provides differentiated access levels for authenticated users, and includes links to related resources. WHOIS has none of these capabilities.',
            ],
        },
        {
            heading: 'Understanding RDAP Responses',
            paragraphs: [
                'An RDAP response includes: the domain handle and LDH (Letter-Digit-Hyphen) name, registration events (created, updated, expires, transferred), EPP status codes, nameserver references, DNSSEC information, and entity contacts (often redacted for privacy).',
                'Status codes like "clientTransferProhibited" and "serverDeleteProhibited" indicate locks on the domain. Events provide a timeline of registration activity. The secureDNS section shows DNSSEC signing status.',
            ],
        },
        {
            heading: 'Run a Free RDAP Lookup',
            paragraphs: [
                'Enter any domain above to retrieve its complete RDAP registration record. This tool queries the authoritative registry for the domain\'s TLD and returns the full JSON response with all available fields — registrar, events, status codes, nameservers, and DNSSEC data.',
                'For a simplified view of registration data, try the WHOIS Lookup tool. To check DNS configuration, use the NS Lookup for nameservers or the DNS Lookup for a complete record overview.',
            ],
        },
    ],
    genericFaqs: [
        {
            question: 'What is RDAP and how is it different from WHOIS?',
            answer: 'RDAP (Registration Data Access Protocol) is the modern replacement for WHOIS, standardized by the IETF in RFCs 7480–7484. While WHOIS returns unstructured text over plaintext port 43, RDAP provides structured JSON responses over HTTPS. RDAP offers consistent field names across all registries, proper Unicode support for internationalized domains, differentiated access levels, and machine-readable output that\'s easy to parse programmatically.',
        },
        {
            question: 'What information does an RDAP lookup return?',
            answer: 'An RDAP lookup returns comprehensive domain registration data including: the registrar of record, registration and expiration dates, last update timestamp, EPP status codes (like clientTransferProhibited), nameserver delegation, DNSSEC signing information, and entity contacts. Contact details are often redacted for privacy compliance under GDPR and similar regulations.',
        },
        {
            question: 'Why should I use RDAP instead of WHOIS?',
            answer: 'RDAP is more reliable, secure, and easier to work with than WHOIS. It uses HTTPS for encrypted queries, returns standardized JSON that\'s consistent across registries, supports internationalized domain names properly, and is actively maintained by ICANN and the IETF. Legacy WHOIS is being phased out by many registries in favor of RDAP.',
        },
        {
            question: 'What do the domain status codes in RDAP mean?',
            answer: 'EPP status codes indicate a domain\'s current state. "clientTransferProhibited" means the registrar has locked transfers at the owner\'s request. "serverHold" means the registry has suspended the domain. "active" or "ok" indicates normal operation. "redemptionPeriod" means the domain expired and is in a recovery window. "pendingDelete" means it will soon be released for public registration.',
        },
        {
            question: 'Does RDAP show who owns a domain?',
            answer: 'RDAP can include registrant contact information, but this data is often redacted for privacy. Since GDPR took effect in 2018, most registrars display "REDACTED FOR PRIVACY" or proxy contact details instead of the actual registrant\'s personal information. The registrar name and technical data (dates, status, nameservers) are always visible.',
        },
    ],
    relatedPages: ['whois', 'ns', 'a', 'mx', 'ip'],
    dataSource: 'rdap',
};

// ─── Propagation Page ─────────────────────────────────────────────

export const PROPAGATION_PAGE: SEOPageConfig = {
    slug: 'propagation',
    title: (d) => `${d} DNS Propagation Check — Compare Providers`,
    description: (d) => `Check DNS propagation for ${d} across Cloudflare, Google, and DNS.SB. Compare results to verify DNS changes have propagated globally.`,
    h1: (d) => `${d} DNS Propagation`,
    intro: (d) => `Compare DNS records for ${d} across multiple DNS-over-HTTPS providers to check if changes have propagated. Mismatches indicate records are still propagating.`,
    landingDescription: 'Free DNS propagation checker — compare DNS records across Cloudflare, Google, and DNS.SB to verify your DNS changes have propagated globally.',
    sections: (d) => [
        {
            heading: `${d} DNS Propagation Status`,
            paragraphs: [
                `This tool queries ${d}'s DNS records from three independent DNS-over-HTTPS providers simultaneously: Cloudflare (1.1.1.1), Google (8.8.8.8), and DNS.SB. By comparing the results, you can determine whether DNS changes have propagated across major resolvers.`,
                `Records that match across all providers are fully propagated. Yellow-highlighted mismatches indicate records that differ between providers, which typically resolves within the TTL (Time to Live) period.`,
            ],
        },
        {
            heading: 'How DNS Propagation Works',
            paragraphs: [
                `When you update a DNS record for ${d}, the change first appears on the authoritative nameservers. Recursive resolvers around the world continue serving cached copies of the old record until their TTL expires.`,
                `Different resolvers may cache records for different durations, which is why ${d} may appear to have different records depending on which DNS server you query. This tool checks three major public resolvers simultaneously.`,
            ],
        },
        {
            heading: `Interpreting ${d}'s Propagation Results`,
            paragraphs: [
                `If all three providers return identical results for ${d}, your DNS changes have fully propagated to major resolvers. Mismatches highlighted in yellow indicate that some providers still have cached old records.`,
                `To speed up propagation, lower the TTL of ${d}'s records before making changes. A TTL of 300 seconds (5 minutes) ensures most resolvers pick up changes within minutes rather than hours.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is DNS Propagation?',
            paragraphs: [
                'DNS propagation is the time it takes for DNS changes to spread across all DNS servers worldwide. When you update a DNS record, the change starts at your authoritative nameserver and gradually reaches recursive resolvers as their cached entries expire.',
                'Propagation typically takes 1-48 hours depending on the TTL values of the previous records. Checking multiple providers gives you a quick view of propagation status.',
            ],
        },
    ],
    relatedPages: ['a', 'ns', 'mx', 'txt'],
    dataSource: 'dns',
};

// ─── Reverse DNS Page ─────────────────────────────────────────────

export const REVERSE_DNS_PAGE: SEOPageConfig = {
    slug: 'reverse-dns',
    title: (d) => `${d} Reverse DNS Lookup — PTR Records`,
    description: (d) => `Reverse DNS (PTR) lookup for ${d}. Find the hostnames associated with ${d}'s IP addresses.`,
    h1: (d) => `${d} Reverse DNS Lookup`,
    intro: (d) => `Look up PTR (pointer) records for ${d}'s IP addresses. Reverse DNS maps IP addresses back to hostnames, useful for verifying server identity and email deliverability.`,
    landingDescription: 'Free reverse DNS lookup tool — find PTR records for any domain\'s IP addresses. Verify server hostnames and check email deliverability configuration.',
    sections: (d) => [
        {
            heading: `Reverse DNS for ${d}`,
            paragraphs: [
                `This tool first resolves ${d}'s A records to find its IPv4 addresses, then performs a reverse DNS lookup (PTR query) for each IP. The PTR record reveals the hostname the IP address is configured to resolve back to.`,
                `Matching forward and reverse DNS (where the PTR hostname matches the original domain) is important for email delivery, as many mail servers reject messages from IPs without valid reverse DNS.`,
            ],
        },
        {
            heading: `How Reverse DNS Works for ${d}`,
            paragraphs: [
                `For each of ${d}'s IPv4 addresses, the IP is reversed (e.g., 1.2.3.4 becomes 4.3.2.1) and appended with .in-addr.arpa. A PTR query is then made for this reversed address to find the associated hostname.`,
                `The PTR record is typically configured by the IP address owner (hosting provider or ISP), not the domain owner. If ${d}'s IPs lack PTR records, it may indicate the hosting provider hasn't configured reverse DNS.`,
            ],
        },
        {
            heading: `Why Reverse DNS Matters for ${d}`,
            paragraphs: [
                `Reverse DNS is critical for email deliverability. Mail servers often reject email from IPs without valid PTR records. If ${d} sends email, its sending IPs should have PTR records that match the server hostname.`,
                `Reverse DNS also helps with security auditing and network troubleshooting. Security teams use PTR lookups to identify the organization behind an IP address that appears in server logs.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Is Reverse DNS?',
            paragraphs: [
                'Reverse DNS (rDNS) uses PTR records to map IP addresses to hostnames — the opposite of a standard A record lookup. For IPv4, reverse lookups query the in-addr.arpa zone.',
                'Properly configured reverse DNS is critical for email deliverability. Most spam filters check that the sending server\'s IP has a valid PTR record matching the server\'s hostname.',
            ],
        },
    ],
    relatedPages: ['a', 'ip', 'mx', 'ns'],
    dataSource: 'dns',
};

// ─── Subdomains Page ──────────────────────────────────────────────

export const SUBDOMAINS_PAGE: SEOPageConfig = {
    slug: 'subdomains',
    title: (d) => `${d} Subdomain Discovery — CT Log Scanner`,
    description: (d) => `Discover subdomains of ${d} using Certificate Transparency logs. Find all SSL certificates issued for ${d} subdomains.`,
    h1: (d) => `${d} Subdomain Discovery`,
    intro: (d) => `Discover subdomains of ${d} by searching Certificate Transparency (CT) logs. This passive reconnaissance technique finds subdomains that have had SSL/TLS certificates issued for them.`,
    landingDescription: 'Free subdomain discovery tool — find subdomains for any domain using Certificate Transparency logs. Passive reconnaissance with no direct scanning required.',
    sections: (d) => [
        {
            heading: `${d} Subdomains from CT Logs`,
            paragraphs: [
                `Certificate Transparency logs are public, append-only databases of all SSL/TLS certificates issued by participating Certificate Authorities. By searching these logs for ${d}, we can discover subdomains that have had certificates issued for them.`,
                `This approach is passive — it doesn't send any traffic to ${d}'s servers. It only queries the public crt.sh database, making it safe and non-intrusive.`,
            ],
        },
        {
            heading: `How Subdomain Discovery Works for ${d}`,
            paragraphs: [
                `When a Certificate Authority issues an SSL/TLS certificate for any subdomain of ${d}, the certificate details are recorded in Certificate Transparency logs. These logs are publicly searchable.`,
                `By querying crt.sh for %.${d}, we find all certificates ever issued for ${d} and its subdomains. The name_value fields from these certificates reveal subdomain names that may not be discoverable through other means.`,
            ],
        },
        {
            heading: `Using ${d}'s Subdomain Data`,
            paragraphs: [
                `Discovered subdomains of ${d} can help identify forgotten services, development environments, or unauthorized infrastructure. Domain administrators should regularly audit their subdomain footprint.`,
                `Note that CT log discovery only finds subdomains that have had SSL/TLS certificates issued. Subdomains using only HTTP or internal DNS records without certificates will not appear in these results.`,
            ],
        },
    ],
    genericSections: [
        {
            heading: 'What Are Certificate Transparency Logs?',
            paragraphs: [
                'Certificate Transparency (CT) is a framework for monitoring and auditing SSL/TLS certificates. All major CAs are required to log certificates they issue to public CT logs.',
                'Security researchers and domain owners use CT logs to detect unauthorized certificates, discover forgotten subdomains, and map an organization\'s web infrastructure.',
            ],
        },
    ],
    relatedPages: ['a', 'ns', 'mx', 'txt', 'ip'],
    dataSource: 'dns',
};

// ─── New v2 routes — minimal SEO stubs (long-form copy can grow later) ─

function stub(slug: string, name: string, blurb: string, dataSource: SEOPageConfig['dataSource'] = 'dns', record?: string): SEOPageConfig {
    return {
        slug,
        recordType: record,
        title: (d) => `${d} ${name} Lookup`,
        description: (d) => `${name} for ${d}. ${blurb}`,
        h1: (d) => `${d} ${name}`,
        intro: (d) => `${name} for ${d}. ${blurb}`,
        landingDescription: `Free ${name} lookup — ${blurb.toLowerCase()}`,
        sections: (d) => [
            {
                heading: `${d} ${name}`,
                paragraphs: [
                    `${blurb} Below are the live results for ${d}.`,
                    `Use this tool to inspect the current state of ${d}'s configuration. The data is fetched live and reflects what every DNS resolver and web client sees right now.`
                ]
            },
            {
                heading: `Why ${name} Matters`,
                paragraphs: [
                    `Understanding ${name.toLowerCase()} for ${d} helps with debugging email deliverability, diagnosing connectivity issues, auditing security posture, or simply confirming a recent configuration change has propagated.`,
                    `If you're seeing unexpected results below, double-check the DNS provider that serves ${d} and any recent zone-file edits.`
                ]
            },
            {
                heading: `How LDNS Looks This Up`,
                paragraphs: [
                    `LDNS queries are issued live against authoritative public sources at the moment you load the page. There is no caching of historical results — what you see is what was returned just now.`,
                    `Server-side calls (where applicable) are proxied through Cloudflare with edge caching, but every cache entry is invalidated frequently so the picture stays current.`
                ]
            }
        ],
        genericSections: [],
        relatedPages: ['a', 'mx', 'ns'],
        dataSource
    };
}

export const AAAA_PAGE = stub('aaaa', 'AAAA Records', 'Lists every IPv6 address the domain resolves to.', 'dns', 'AAAA');
export const CNAME_PAGE = stub('cname', 'CNAME Records', 'Reveals what the domain aliases to (canonical name).', 'dns', 'CNAME');
export const CAA_PAGE = stub('caa', 'CAA Records', 'Specifies which Certificate Authorities are allowed to issue certificates for the domain.', 'dns', 'CAA');
export const SOA_PAGE = stub('soa', 'SOA Record', 'Start of Authority — primary nameserver, admin contact, and zone refresh values.', 'dns', 'SOA');
export const DKIM_PAGE = stub('dkim', 'DKIM Selectors', 'Probes 22 common DKIM selectors and shows discovered keys with algorithm and key length.', 'email');
export const HEADERS_PAGE = stub('headers', 'HTTP Headers', 'Every response header returned by the domain, fetched server-side.', 'server');
export const SECURITY_HEADERS_PAGE = stub('security-headers', 'Security Headers', 'Audits HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.', 'security');
export const TLS_PAGE = stub('tls', 'TLS Certificate', 'Certificate details — issuer, validity, SANs — from public Certificate Transparency logs.', 'security');
export const ASN_PAGE = stub('asn', 'ASN / Origin', 'Origin AS number, AS name, country, and announced prefix for every IP.', 'server');
export const GEO_PAGE = stub('geo', 'IP Geolocation', 'Approximate geolocation, ISP, and ASN for every IP.', 'server');
export const SECURITY_PAGE = stub('security', 'Security Analysis', 'Overall security grade — TLS, headers, HSTS preload, and well-known files.', 'security');
export const SERVER_PAGE = stub('server', 'Server Information', 'Headers, redirect chain, response time, technology stack, and security signals.', 'server');

// ─── Master Registry ───────────────────────────────────────────────

export const SEO_PAGES: Record<string, SEOPageConfig> = {
    mx: MX_PAGE,
    ns: NS_PAGE,
    a: A_PAGE,
    aaaa: AAAA_PAGE,
    cname: CNAME_PAGE,
    caa: CAA_PAGE,
    soa: SOA_PAGE,
    txt: TXT_PAGE,
    spf: SPF_PAGE,
    dmarc: DMARC_PAGE,
    dkim: DKIM_PAGE,
    whois: WHOIS_PAGE,
    ip: IP_PAGE,
    asn: ASN_PAGE,
    geo: GEO_PAGE,
    rdap: RDAP_PAGE,
    propagation: PROPAGATION_PAGE,
    'reverse-dns': REVERSE_DNS_PAGE,
    subdomains: SUBDOMAINS_PAGE,
    headers: HEADERS_PAGE,
    'security-headers': SECURITY_HEADERS_PAGE,
    tls: TLS_PAGE,
    server: SERVER_PAGE,
    security: SECURITY_PAGE
};

/** All available page slugs for internal linking */
export const ALL_PAGE_SLUGS = Object.keys(SEO_PAGES);

/** Labels for display in internal links */
export const PAGE_LABELS: Record<string, { label: string; shortDescription: string }> = {
    mx: { label: 'MX Lookup', shortDescription: 'Mail servers & email delivery' },
    ns: { label: 'NS Lookup', shortDescription: 'DNS hosting & delegation' },
    a: { label: 'A Record Lookup', shortDescription: 'IPv4 addresses' },
    aaaa: { label: 'AAAA Records', shortDescription: 'IPv6 addresses' },
    cname: { label: 'CNAME Records', shortDescription: 'Canonical aliases' },
    caa: { label: 'CAA Records', shortDescription: 'Certificate authority restrictions' },
    soa: { label: 'SOA Record', shortDescription: 'Start of Authority' },
    txt: { label: 'TXT Record Lookup', shortDescription: 'SPF, verification & more' },
    spf: { label: 'SPF Record Checker', shortDescription: 'Email sender authorization' },
    dmarc: { label: 'DMARC Checker', shortDescription: 'Email authentication policy' },
    dkim: { label: 'DKIM Selectors', shortDescription: '22-selector probe' },
    whois: { label: 'WHOIS Lookup', shortDescription: 'Registration & ownership info' },
    ip: { label: 'IP Lookup', shortDescription: 'IPv4 & IPv6 addresses' },
    asn: { label: 'ASN / Origin', shortDescription: 'AS number, name, country' },
    geo: { label: 'IP Geolocation', shortDescription: 'Country, region, ISP' },
    rdap: { label: 'RDAP Lookup', shortDescription: 'Full registration data via RDAP' },
    propagation: { label: 'Propagation Check', shortDescription: 'Compare DNS across providers' },
    'reverse-dns': { label: 'Reverse DNS', shortDescription: 'PTR record lookup' },
    subdomains: { label: 'Subdomain Discovery', shortDescription: 'CT log subdomain scanner' },
    headers: { label: 'HTTP Headers', shortDescription: 'Response headers, server-side' },
    'security-headers': { label: 'Security Headers', shortDescription: 'HSTS, CSP, X-Frame-Options audit' },
    tls: { label: 'TLS Certificate', shortDescription: 'Cert details from CT logs' },
    server: { label: 'Server Information', shortDescription: 'Headers, redirects, tech stack' },
    security: { label: 'Security Analysis', shortDescription: 'Overall grade + audit' }
};

/** Existing tool pages (for cross-linking from SEO pages) */
export const EXISTING_PAGES: Record<string, { label: string; shortDescription: string; landingDescription: string; path: string }> = {
    dns: {
        label: 'DNS Lookup',
        shortDescription: 'Complete DNS record lookup',
        landingDescription: 'Free DNS lookup tool — check A, AAAA, MX, NS, TXT, CNAME, SOA, and all DNS record types for any domain. Instant, comprehensive results.',
        path: '',
    },
    email: {
        label: 'Email Security Checker',
        shortDescription: 'Full email security analysis',
        landingDescription: 'Free email security checker — analyze SPF, DMARC, MTA-STS, BIMI, and MX records to assess email authentication and deliverability for any domain.',
        path: '/email',
    },
};
