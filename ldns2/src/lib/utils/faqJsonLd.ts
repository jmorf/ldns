import type { DnsData, DnsRecordResult, EmailData, ParsedRdapData, ServerData, SecurityData } from '$lib/state.svelte';

export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqPage {
    "@context": "https://schema.org";
    "@type": "FAQPage";
    mainEntity: Array<{
        "@type": "Question";
        name: string;
        acceptedAnswer: {
            "@type": "Answer";
            text: string;
        };
    }>;
}

/** Build a FAQ JSON-LD schema from a list of Q&A items */
export function buildFaqSchema(items: FaqItem[]): FaqPage {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(item => ({
            "@type": "Question" as const,
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer" as const,
                text: item.answer
            }
        }))
    };
}

export function generateDnsFaqJsonLd(domainName: string, dnsData: DnsData | null): FaqPage | null {
    if (!dnsData || !domainName) return null;

    const faqItems: FaqItem[] = [];

    // A Records
    if (dnsData.A && Array.isArray(dnsData.A)) {
        const question = `What are ${domainName}'s A records?`;
        const answer = dnsData.A.length > 0
            ? `${domainName}'s A records are: ${dnsData.A.map(r => r.data).join(', ')}`
            : `${domainName} does not have any A records`;
        faqItems.push({ question, answer });
    }

    // AAAA Records
    if (dnsData.AAAA && Array.isArray(dnsData.AAAA)) {
        const question = `What are ${domainName}'s IPv6 (AAAA) records?`;
        const answer = dnsData.AAAA.length > 0
            ? `${domainName}'s IPv6 (AAAA) records are: ${dnsData.AAAA.map(r => r.data).join(', ')}`
            : `${domainName} does not have any IPv6 (AAAA) records`;
        faqItems.push({ question, answer });
    }

    // MX Records
    if (dnsData.MX && Array.isArray(dnsData.MX)) {
        const question = `What are ${domainName}'s MX records?`;
        const answer = dnsData.MX.length > 0
            ? `${domainName}'s MX records are: ${dnsData.MX.map(r => r.data).join(', ')}`
            : `${domainName} does not have any MX records`;
        faqItems.push({ question, answer });
    }

    // TXT Records
    if (dnsData.TXT && Array.isArray(dnsData.TXT)) {
        const question = `What are ${domainName}'s TXT records?`;
        const answer = dnsData.TXT.length > 0
            ? `${domainName} has ${dnsData.TXT.length} TXT record${dnsData.TXT.length > 1 ? 's' : ''}`
            : `${domainName} does not have any TXT records`;
        faqItems.push({ question, answer });
    }

    // NS Records
    if (dnsData.NS && Array.isArray(dnsData.NS)) {
        const question = `What are ${domainName}'s nameservers (NS records)?`;
        const answer = dnsData.NS.length > 0
            ? `${domainName}'s nameservers are: ${dnsData.NS.map(r => r.data).join(', ')}`
            : `${domainName} does not have any NS records`;
        faqItems.push({ question, answer });
    }

    // CNAME Records
    if (dnsData.CNAME && Array.isArray(dnsData.CNAME)) {
        const question = `Does ${domainName} have a CNAME record?`;
        const answer = dnsData.CNAME.length > 0
            ? `Yes, ${domainName} has a CNAME record pointing to: ${dnsData.CNAME[0].data}`
            : `No, ${domainName} does not have a CNAME record`;
        faqItems.push({ question, answer });
    }

    // SOA Records
    if (dnsData.SOA && Array.isArray(dnsData.SOA)) {
        const question = `What is ${domainName}'s SOA record?`;
        const answer = dnsData.SOA.length > 0
            ? `${domainName}'s SOA record is: ${dnsData.SOA[0].data}`
            : `${domainName} does not have an SOA record`;
        faqItems.push({ question, answer });
    }

    // CAA Records
    if (dnsData.CAA && Array.isArray(dnsData.CAA)) {
        const question = `What are ${domainName}'s CAA records?`;
        const answer = dnsData.CAA.length > 0
            ? `${domainName}'s CAA records are: ${dnsData.CAA.map(r => r.data).join(', ')}`
            : `${domainName} does not have any CAA records`;
        faqItems.push({ question, answer });
    }

    // SRV Records
    if (dnsData.SRV && Array.isArray(dnsData.SRV)) {
        const question = `Does ${domainName} have any SRV records?`;
        const answer = dnsData.SRV.length > 0
            ? `Yes, ${domainName} has ${dnsData.SRV.length} SRV record${dnsData.SRV.length > 1 ? 's' : ''}`
            : `No, ${domainName} does not have any SRV records`;
        faqItems.push({ question, answer });
    }

    // PTR Records
    if (dnsData.PTR && Array.isArray(dnsData.PTR)) {
        const question = `Does ${domainName} have any PTR records?`;
        const answer = dnsData.PTR.length > 0
            ? `Yes, ${domainName} has PTR records: ${dnsData.PTR.map(r => r.data).join(', ')}`
            : `No, ${domainName} does not have any PTR records`;
        faqItems.push({ question, answer });
    }

    // DNSKEY Records
    if (dnsData.DNSKEY && Array.isArray(dnsData.DNSKEY)) {
        const question = `Does ${domainName} have DNSSEC DNSKEY records?`;
        const answer = dnsData.DNSKEY.length > 0
            ? `Yes, ${domainName} has ${dnsData.DNSKEY.length} DNSKEY record${dnsData.DNSKEY.length > 1 ? 's' : ''}, indicating DNSSEC is configured`
            : `No, ${domainName} does not have any DNSKEY records`;
        faqItems.push({ question, answer });
    }

    // DS Records
    if (dnsData.DS && Array.isArray(dnsData.DS)) {
        const question = `Does ${domainName} have DS records for DNSSEC?`;
        const answer = dnsData.DS.length > 0
            ? `Yes, ${domainName} has ${dnsData.DS.length} DS record${dnsData.DS.length > 1 ? 's' : ''} for DNSSEC delegation`
            : `No, ${domainName} does not have any DS records`;
        faqItems.push({ question, answer });
    }

    // HTTPS Records
    if (dnsData.HTTPS && Array.isArray(dnsData.HTTPS)) {
        const question = `Does ${domainName} have HTTPS records?`;
        const answer = dnsData.HTTPS.length > 0
            ? `Yes, ${domainName} has ${dnsData.HTTPS.length} HTTPS record${dnsData.HTTPS.length > 1 ? 's' : ''}`
            : `No, ${domainName} does not have any HTTPS records`;
        faqItems.push({ question, answer });
    }

    // TLSA Records
    if (dnsData.TLSA && Array.isArray(dnsData.TLSA)) {
        const question = `Does ${domainName} have TLSA records for DANE?`;
        const answer = dnsData.TLSA.length > 0
            ? `Yes, ${domainName} has ${dnsData.TLSA.length} TLSA record${dnsData.TLSA.length > 1 ? 's' : ''} for DANE authentication`
            : `No, ${domainName} does not have any TLSA records`;
        faqItems.push({ question, answer });
    }

    // SSHFP Records
    if (dnsData.SSHFP && Array.isArray(dnsData.SSHFP)) {
        const question = `Does ${domainName} have SSH fingerprint (SSHFP) records?`;
        const answer = dnsData.SSHFP.length > 0
            ? `Yes, ${domainName} has ${dnsData.SSHFP.length} SSHFP record${dnsData.SSHFP.length > 1 ? 's' : ''}`
            : `No, ${domainName} does not have any SSHFP records`;
        faqItems.push({ question, answer });
    }

    // Only return FAQ JSON-LD if we have questions
    if (faqItems.length === 0) return null;

    return buildFaqSchema(faqItems);
}

export function generateEmailFaqJsonLd(domainName: string, emailData: EmailData | null): FaqPage | null {
    if (!emailData || !domainName) return null;

    const faqItems: FaqItem[] = [];

    // Email enabled status
    const emailEnabledQuestion = `Is email enabled for ${domainName}?`;
    const emailEnabledAnswer = emailData.isEmailEnabled
        ? `Yes, email is enabled for ${domainName}${emailData.mx?.length > 0 ? ` with ${emailData.mx.length} mail server${emailData.mx.length > 1 ? 's' : ''}` : ''}`
        : `No, email is not enabled for ${domainName}`;
    faqItems.push({ question: emailEnabledQuestion, answer: emailEnabledAnswer });

    // MX Records
    if (emailData.mx !== undefined) {
        const question = `What mail servers handle email for ${domainName}?`;
        const answer = emailData.mx && emailData.mx.length > 0
            ? `${domainName} uses the following mail servers: ${emailData.mx.map(r => r.data).join(', ')}`
            : `${domainName} does not have any mail servers configured (no MX records)`;
        faqItems.push({ question, answer });
    }

    // Email Provider
    if (emailData.provider) {
        const question = `What email provider does ${domainName} use?`;
        const answer = `${domainName} uses ${emailData.provider} for email services`;
        faqItems.push({ question, answer });
    }

    // SPF Records
    if (emailData.spf !== undefined) {
        const question = `Does ${domainName} have SPF records configured?`;
        const answer = emailData.spf && emailData.spf.length > 0
            ? `Yes, ${domainName} has SPF (Sender Policy Framework) records configured to prevent email spoofing`
            : `No, ${domainName} does not have SPF records configured`;
        faqItems.push({ question, answer });
    }

    // DMARC Records
    if (emailData.dmarc !== undefined) {
        const question = `Does ${domainName} have DMARC policy configured?`;
        const answer = emailData.dmarc && emailData.dmarc.length > 0
            ? `Yes, ${domainName} has a DMARC (Domain-based Message Authentication) policy configured`
            : `No, ${domainName} does not have a DMARC policy configured`;
        faqItems.push({ question, answer });
    }

    // MTA-STS Records
    if (emailData.mtaSts !== undefined) {
        const question = `Does ${domainName} support MTA-STS for secure email transport?`;
        const answer = emailData.mtaSts && emailData.mtaSts.length > 0
            ? `Yes, ${domainName} has MTA-STS (Mail Transfer Agent Strict Transport Security) configured for secure email transport`
            : `No, ${domainName} does not have MTA-STS configured`;
        faqItems.push({ question, answer });
    }

    // BIMI Records
    if (emailData.bimi !== undefined) {
        const question = `Does ${domainName} have BIMI configured for brand indicators?`;
        const answer = emailData.bimi && emailData.bimi.length > 0
            ? `Yes, ${domainName} has BIMI (Brand Indicators for Message Identification) configured`
            : `No, ${domainName} does not have BIMI configured`;
        faqItems.push({ question, answer });
    }

    // TLSRPT Records
    if (emailData.tlsrpt !== undefined) {
        const question = `Does ${domainName} have TLS reporting configured?`;
        const answer = emailData.tlsrpt && emailData.tlsrpt.length > 0
            ? `Yes, ${domainName} has TLS-RPT (TLS Reporting) configured for monitoring email encryption`
            : `No, ${domainName} does not have TLS-RPT configured`;
        faqItems.push({ question, answer });
    }

    // Only return FAQ JSON-LD if we have questions
    if (faqItems.length === 0) return null;

    return buildFaqSchema(faqItems);
}

export function generateRdapFaqJsonLd(domainName: string, rdapData: ParsedRdapData | null): FaqPage | null {
    if (!rdapData || !domainName) return null;

    const faqItems: FaqItem[] = [];

    // Domain Registration
    const registrationQuestion = `When was ${domainName} registered?`;
    const registrationAnswer = rdapData.created
        ? `${domainName} was registered on ${new Date(rdapData.created).toLocaleDateString()}`
        : `The registration date for ${domainName} is not available in the RDAP data`;
    faqItems.push({ question: registrationQuestion, answer: registrationAnswer });

    // Domain Expiration
    if (rdapData.expires) {
        const question = `When does ${domainName} expire?`;
        const expirationDate = new Date(rdapData.expires);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let answer;
        if (daysUntilExpiration < 0) {
            answer = `${domainName} expired on ${expirationDate.toLocaleDateString()}`;
        } else if (daysUntilExpiration <= 30) {
            answer = `${domainName} expires in ${daysUntilExpiration} days on ${expirationDate.toLocaleDateString()}`;
        } else {
            answer = `${domainName} expires on ${expirationDate.toLocaleDateString()}`;
        }
        faqItems.push({ question, answer });
    }

    // Domain Status
    if (rdapData.status && rdapData.status.length > 0) {
        const question = `What is the current status of ${domainName}?`;
        const answer = `${domainName} has the following status: ${rdapData.status.join(', ')}`;
        faqItems.push({ question, answer });
    }

    // Registrar Information
    if (rdapData.registrar) {
        const question = `Who is the registrar for ${domainName}?`;
        const answer = `${domainName} is registered with ${rdapData.registrar}`;
        faqItems.push({ question, answer });
    }

    // Nameservers
    if (rdapData.nameservers && rdapData.nameservers.length > 0) {
        const question = `What nameservers does ${domainName} use?`;
        const answer = `${domainName} uses the following nameservers: ${rdapData.nameservers.join(', ')}`;
        faqItems.push({ question, answer });
    }

    // DNSSEC
    {
        const question = `Is DNSSEC enabled for ${domainName}?`;
        const answer = rdapData.dnssecEnabled
            ? `Yes, DNSSEC is enabled for ${domainName}`
            : `No, DNSSEC is not enabled for ${domainName}`;
        faqItems.push({ question, answer });
    }

    // Last Update
    if (rdapData.updated) {
        const question = `When was ${domainName} last updated?`;
        const answer = `${domainName} was last updated on ${new Date(rdapData.updated).toLocaleDateString()}`;
        faqItems.push({ question, answer });
    }

    // Only return FAQ JSON-LD if we have questions
    if (faqItems.length === 0) return null;

    return buildFaqSchema(faqItems);
}

export function generateServerFaqJsonLd(domainName: string, serverData: ServerData | null): FaqPage | null {
    if (!serverData || !domainName) return null;

    const faqItems: FaqItem[] = [];

    // Server Status
    const statusQuestion = `Is ${domainName} online?`;
    const statusAnswer = serverData.response?.status
        ? `Yes, ${domainName} is online and responding with HTTP status ${serverData.response.status}`
        : `${domainName} is not responding or is offline`;
    faqItems.push({ question: statusQuestion, answer: statusAnswer });

    // Response Time
    if (serverData.response?.time) {
        const question = `How fast does ${domainName} respond?`;
        const answer = `${domainName} responds in ${serverData.response.time}ms`;
        faqItems.push({ question, answer });
    }

    // Server Software
    if (serverData.info?.server) {
        const question = `What web server does ${domainName} use?`;
        const answer = `${domainName} uses ${serverData.info.server}`;
        faqItems.push({ question, answer });
    }

    // SSL Certificate
    const sslQuestion = `Does ${domainName} have SSL/TLS encryption?`;
    const sslAnswer = serverData.ssl
        ? `Yes, ${domainName} has a valid SSL certificate and supports HTTPS`
        : `No SSL certificate information is available for ${domainName}`;
    faqItems.push({ question: sslQuestion, answer: sslAnswer });

    // IP Address
    if (serverData.info?.ip) {
        const question = `What is the IP address of ${domainName}?`;
        const answer = `${domainName} resolves to IP address ${serverData.info.ip}`;
        faqItems.push({ question, answer });
    }

    // Server Location
    if (serverData.info?.location) {
        const question = `Where is ${domainName} hosted?`;
        const answer = `${domainName} is hosted in ${serverData.info.location}`;
        faqItems.push({ question, answer });
    }

    // Security Headers
    if (serverData.headers) {
        const hasSecurityHeaders = serverData.headers['strict-transport-security'] || 
                                 serverData.headers['x-frame-options'] || 
                                 serverData.headers['x-content-type-options'] ||
                                 serverData.headers['content-security-policy'];
        
        const question = `Does ${domainName} implement security headers?`;
        const answer = hasSecurityHeaders
            ? `Yes, ${domainName} implements security headers for enhanced protection`
            : `${domainName} does not implement common security headers`;
        faqItems.push({ question, answer });
    }

    // HTTP/2 Support
    if (serverData.info?.httpVersion) {
        const question = `Does ${domainName} support HTTP/2?`;
        const answer = serverData.info.httpVersion.includes('2')
            ? `Yes, ${domainName} supports HTTP/2 for improved performance`
            : `${domainName} uses ${serverData.info.httpVersion}`;
        faqItems.push({ question, answer });
    }

    // Only return FAQ JSON-LD if we have questions
    if (faqItems.length === 0) return null;

    return buildFaqSchema(faqItems);
}


// ─── Per-Record-Type FAQ Generators (for SEO pages) ────────────────

export function generateMxFaqJsonLd(domainName: string, mxRecords: DnsRecordResult[]): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];

    faqItems.push({
        question: `What are ${domainName}'s mail servers?`,
        answer: mxRecords.length > 0
            ? `${domainName} uses ${mxRecords.length} mail server${mxRecords.length > 1 ? 's' : ''}: ${mxRecords.map(r => r.data).join(', ')}`
            : `${domainName} does not have any MX records configured, meaning it may not receive email.`
    });

    if (mxRecords.length > 0) {
        faqItems.push({
            question: `What email provider does ${domainName} use?`,
            answer: (() => {
                const firstServer = mxRecords[0]?.data?.toLowerCase() || '';
                if (firstServer.includes('google') || firstServer.includes('aspmx')) return `${domainName} appears to use Google Workspace for email, based on its MX records.`;
                if (firstServer.includes('outlook') || firstServer.includes('microsoft')) return `${domainName} appears to use Microsoft 365 for email, based on its MX records.`;
                if (firstServer.includes('zoho')) return `${domainName} appears to use Zoho Mail, based on its MX records.`;
                if (firstServer.includes('protonmail')) return `${domainName} appears to use ProtonMail, based on its MX records.`;
                return `${domainName}'s primary mail server is ${mxRecords[0]?.data}.`;
            })()
        });
        faqItems.push({
            question: `How many MX records does ${domainName} have?`,
            answer: `${domainName} has ${mxRecords.length} MX record${mxRecords.length > 1 ? 's' : ''}, providing ${mxRecords.length > 1 ? 'redundancy for email delivery' : 'a single mail server for email delivery'}.`
        });
    }

    faqItems.push({
        question: 'What is an MX record?',
        answer: 'An MX (Mail Exchange) record is a DNS record that specifies the mail server responsible for accepting email on behalf of a domain. MX records include a priority value: lower numbers indicate higher priority.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateNsFaqJsonLd(domainName: string, nsRecords: DnsRecordResult[]): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];

    faqItems.push({
        question: `What nameservers does ${domainName} use?`,
        answer: nsRecords.length > 0
            ? `${domainName}'s nameservers are: ${nsRecords.map(r => r.data).join(', ')}`
            : `No NS records were found for ${domainName}.`
    });

    if (nsRecords.length > 0) {
        const firstNs = nsRecords[0]?.data?.toLowerCase() || '';
        let provider = 'an unknown provider';
        if (firstNs.includes('cloudflare')) provider = 'Cloudflare';
        else if (firstNs.includes('awsdns')) provider = 'Amazon Route 53';
        else if (firstNs.includes('googledomains') || firstNs.includes('google')) provider = 'Google Cloud DNS';
        else if (firstNs.includes('domaincontrol')) provider = 'GoDaddy';

        faqItems.push({
            question: `Who hosts ${domainName}'s DNS?`,
            answer: `Based on its nameservers, ${domainName}'s DNS is hosted by ${provider}.`
        });
        faqItems.push({
            question: `How many nameservers does ${domainName} have?`,
            answer: `${domainName} has ${nsRecords.length} nameserver${nsRecords.length > 1 ? 's' : ''}, providing ${nsRecords.length >= 2 ? 'redundancy' : 'a single point of resolution'}.`
        });
    }

    faqItems.push({
        question: 'What are nameservers?',
        answer: 'Nameservers are DNS servers that hold the authoritative DNS records for a domain. They respond to queries from recursive resolvers, providing the IP addresses and other records needed to reach the domain.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateARecordFaqJsonLd(domainName: string, aRecords: DnsRecordResult[]): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];

    faqItems.push({
        question: `What is ${domainName}'s IP address?`,
        answer: aRecords.length > 0
            ? `${domainName} resolves to ${aRecords.length > 1 ? 'multiple IPv4 addresses' : 'the IPv4 address'}: ${aRecords.map(r => r.data).join(', ')}`
            : `No A records were found for ${domainName}, meaning it does not have an IPv4 address configured.`
    });

    if (aRecords.length > 1) {
        faqItems.push({
            question: `Does ${domainName} use multiple IP addresses?`,
            answer: `Yes, ${domainName} has ${aRecords.length} A records, which can be used for load balancing or failover across multiple servers.`
        });
    }

    faqItems.push({
        question: 'What is an A record?',
        answer: 'An A (Address) record maps a domain name to an IPv4 address. It is the most fundamental DNS record type and is used every time a browser connects to a website.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateTxtFaqJsonLd(domainName: string, txtRecords: DnsRecordResult[]): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];

    faqItems.push({
        question: `What TXT records does ${domainName} have?`,
        answer: txtRecords.length > 0
            ? `${domainName} has ${txtRecords.length} TXT record${txtRecords.length > 1 ? 's' : ''}.`
            : `No TXT records were found for ${domainName}.`
    });

    if (txtRecords.length > 0) {
        const hasSPF = txtRecords.some(r => r.data?.includes('v=spf1'));
        faqItems.push({
            question: `Does ${domainName} have an SPF record?`,
            answer: hasSPF
                ? `Yes, ${domainName} has an SPF (Sender Policy Framework) record configured in its TXT records for email authentication.`
                : `No SPF record was found in ${domainName}'s TXT records.`
        });
    }

    faqItems.push({
        question: 'What are TXT records used for?',
        answer: 'TXT records store text data in DNS and are used for email authentication (SPF, DKIM, DMARC), domain ownership verification (Google, Microsoft, Facebook), and other application-specific purposes.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateSpfFaqJsonLd(domainName: string, emailData: EmailData | null): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];
    const spfRecords = emailData?.spf ?? [];

    faqItems.push({
        question: `Does ${domainName} have an SPF record?`,
        answer: spfRecords.length > 0
            ? `Yes, ${domainName} has an SPF record configured: ${spfRecords[0]?.data}`
            : `No, ${domainName} does not have an SPF record. Without SPF, the domain is vulnerable to email spoofing.`
    });

    if (spfRecords.length > 0) {
        const spfData = spfRecords[0]?.data || '';
        const hasHardFail = spfData.includes('-all');
        faqItems.push({
            question: `What is ${domainName}'s SPF policy?`,
            answer: hasHardFail
                ? `${domainName} uses a strict SPF policy (-all), which instructs receiving servers to reject email from unauthorized sources.`
                : `${domainName}'s SPF policy uses a soft fail (~all), which flags unauthorized email rather than rejecting it outright.`
        });
    }

    faqItems.push({
        question: 'What is SPF?',
        answer: 'SPF (Sender Policy Framework) is an email authentication standard that lets domain owners specify which mail servers are authorized to send email on their behalf. It is published as a TXT record in DNS.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateDmarcFaqJsonLd(domainName: string, emailData: EmailData | null): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];
    const dmarcRecords = emailData?.dmarc ?? [];

    faqItems.push({
        question: `Does ${domainName} have a DMARC policy?`,
        answer: dmarcRecords.length > 0
            ? `Yes, ${domainName} has a DMARC policy configured: ${dmarcRecords[0]?.data}`
            : `No, ${domainName} does not have a DMARC policy. Without DMARC, the domain lacks a way to instruct receivers on handling unauthenticated email.`
    });

    if (dmarcRecords.length > 0) {
        const dmarcData = dmarcRecords[0]?.data || '';
        let policy = 'none';
        if (dmarcData.includes('p=reject')) policy = 'reject';
        else if (dmarcData.includes('p=quarantine')) policy = 'quarantine';

        faqItems.push({
            question: `What is ${domainName}'s DMARC enforcement level?`,
            answer: policy === 'reject'
                ? `${domainName} uses DMARC p=reject, the strictest policy, which blocks unauthenticated email.`
                : policy === 'quarantine'
                ? `${domainName} uses DMARC p=quarantine, which sends unauthenticated email to spam.`
                : `${domainName} uses DMARC p=none, which monitors without enforcement. This is typically used during initial DMARC rollout.`
        });
    }

    faqItems.push({
        question: 'What is DMARC?',
        answer: 'DMARC (Domain-based Message Authentication, Reporting & Conformance) is an email authentication protocol that builds on SPF and DKIM. It lets domain owners specify how receiving servers should handle messages that fail authentication checks.'
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

export function generateIpFaqJsonLd(domainName: string, aRecords: DnsRecordResult[], aaaaRecords: DnsRecordResult[]): FaqPage | null {
    if (!domainName) return null;
    const faqItems: FaqItem[] = [];

    faqItems.push({
        question: `What is ${domainName}'s IP address?`,
        answer: aRecords.length > 0
            ? `${domainName}'s IPv4 address${aRecords.length > 1 ? 'es are' : ' is'}: ${aRecords.map(r => r.data).join(', ')}`
            : `No IPv4 address was found for ${domainName}.`
    });

    faqItems.push({
        question: `Does ${domainName} support IPv6?`,
        answer: aaaaRecords.length > 0
            ? `Yes, ${domainName} supports IPv6 with ${aaaaRecords.length} AAAA record${aaaaRecords.length > 1 ? 's' : ''}: ${aaaaRecords.map(r => r.data).join(', ')}`
            : `No, ${domainName} does not have any AAAA records and does not support IPv6.`
    });

    faqItems.push({
        question: `How many IP addresses does ${domainName} have?`,
        answer: `${domainName} has ${aRecords.length} IPv4 address${aRecords.length !== 1 ? 'es' : ''} and ${aaaaRecords.length} IPv6 address${aaaaRecords.length !== 1 ? 'es' : ''}.`
    });

    if (faqItems.length === 0) return null;
    return buildFaqSchema(faqItems);
}

// ─── Existing FAQ Generators ───────────────────────────────────────

export function generateSecurityFaqJsonLd(domainName: string, securityData: SecurityData | null): FaqPage | null {
    if (!securityData || !domainName) return null;

    const faqItems: FaqItem[] = [];

    // Overall Security Grade
    if (securityData.overall?.grade) {
        const question = `What is the security grade for ${domainName}?`;
        const answer = `${domainName} has a security grade of ${securityData.overall.grade}`;
        faqItems.push({ question, answer });
    }

    // SSL/TLS Security
    if (securityData.ssl) {
        const sslQuestion = `Does ${domainName} have SSL/TLS security configured?`;
        const sslAnswer = securityData.ssl.enabled
            ? `Yes, ${domainName} has SSL/TLS security enabled${securityData.ssl.hasCAA ? ' with CAA records for certificate control' : ''}`
            : `SSL/TLS security indicators were not detected for ${domainName}`;
        faqItems.push({ question: sslQuestion, answer: sslAnswer });
    }

    // Email Security
    if (securityData.email) {
        const emailQuestion = `Is email security configured for ${domainName}?`;
        let emailAnswer = "Email security configuration for " + domainName + ":";
        if (securityData.email.mx) emailAnswer += " MX records present.";
        if (securityData.email.spf) emailAnswer += " SPF configured.";
        if (securityData.email.dmarc) emailAnswer += " DMARC configured.";
        if (!securityData.email.mx && !securityData.email.spf && !securityData.email.dmarc) {
            emailAnswer = `Email security is not fully configured for ${domainName}`;
        }
        faqItems.push({ question: emailQuestion, answer: emailAnswer });
    }

    // Domain Reputation
    if (securityData.reputation) {
        const reputationQuestion = `Is ${domainName} safe to visit?`;
        const reputationAnswer = securityData.reputation.overall.status === 'clean'
            ? `${domainName} has a clean reputation with no known security threats`
            : securityData.reputation.overall.status === 'malicious'
            ? `Warning: ${domainName} has been flagged as potentially malicious`
            : `The reputation status of ${domainName} could not be fully determined`;
        faqItems.push({ question: reputationQuestion, answer: reputationAnswer });
    }

    // Security Recommendations
    if (securityData.recommendations && securityData.recommendations.length > 0) {
        const recommendationsQuestion = `What security improvements are recommended for ${domainName}?`;
        const recommendationsAnswer = `${domainName} has ${securityData.recommendations.length} security recommendation${securityData.recommendations.length > 1 ? 's' : ''} to improve its security posture`;
        faqItems.push({ question: recommendationsQuestion, answer: recommendationsAnswer });
    }

    // Subdomain Discovery
    if (securityData.subdomainDiscovery) {
        const subdomainQuestion = `What subdomains have been discovered for ${domainName}?`;
        let subdomainAnswer;
        
        if (securityData.subdomainDiscovery.error) {
            subdomainAnswer = `Subdomain discovery could not be completed: ${securityData.subdomainDiscovery.error}`;
        } else if (securityData.subdomainDiscovery.subdomains && securityData.subdomainDiscovery.subdomains.length > 0) {
            const count = securityData.subdomainDiscovery.subdomains.length;
            subdomainAnswer = `${count} subdomain${count === 1 ? ' has' : 's have'} been discovered for ${domainName} through Certificate Transparency logs`;
        } else {
            subdomainAnswer = `No additional subdomains were discovered for ${domainName} in Certificate Transparency logs`;
        }
        
        faqItems.push({ question: subdomainQuestion, answer: subdomainAnswer });
    }

    // Only return FAQ JSON-LD if we have questions
    if (faqItems.length === 0) return null;

    return buildFaqSchema(faqItems);
}
