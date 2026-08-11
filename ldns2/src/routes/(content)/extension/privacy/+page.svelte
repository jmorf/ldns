<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import Eyebrow from '$lib/components/Eyebrow.svelte';
  import SEO from '$lib/components/SEO.svelte';
</script>

<SEO
  title="Extension Privacy Policy"
  description="Privacy policy for the LDNS browser extension. No data collection, no tracking, no analytics."
/>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <a href="/extension" class="inline-flex items-center gap-2 text-fg-subtle hover:text-fg mb-8 text-sm transition-colors">
    <ArrowLeft class="w-4 h-4" />
    Back to extension
  </a>

  <Eyebrow text="legal" />
  <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-2">Privacy Policy</h1>
  <p class="text-fg-muted">LDNS browser extension. Chrome & Firefox</p>
  <p class="text-sm text-fg-subtle mt-1">Last updated: August 2026</p>

  <div class="mt-10 space-y-10">
    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Overview</h2>
      <p class="text-fg-muted leading-relaxed">
        LDNS is a browser extension that provides DNS, WHOIS/RDAP, email security, and server
        information lookups. It is built to protect your privacy and to be transparent about
        exactly where data goes.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-4">Data collection</h2>
      <h3 class="text-base font-medium text-fg mb-2">What LDNS does not collect</h3>
      <ul class="list-disc list-inside text-fg-muted space-y-1 leading-relaxed">
        <li>Does NOT collect any personal information</li>
        <li>Does NOT track your browsing history or read page content</li>
        <li>Does NOT send your lookups to LDNS servers. The extension has no backend</li>
        <li>Does NOT use analytics or tracking services in the extension</li>
        <li>Does NOT sell or share any data with third parties</li>
      </ul>

      <h3 class="text-base font-medium text-fg mt-6 mb-2">What stays on your device</h3>
      <p class="text-fg-muted leading-relaxed">The following data is stored locally in your browser using the extension storage API:</p>
      <ul class="list-disc list-inside text-fg-muted space-y-1 leading-relaxed mt-2">
        <li><strong class="text-fg">Recent searches:</strong> the last 10 domains you've looked up</li>
        <li><strong class="text-fg">Preferences:</strong> your selected DNS provider and theme preference</li>
      </ul>
      <p class="text-fg-muted leading-relaxed mt-2">This data never leaves your browser and can be cleared at any time.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-4">Third-party services</h2>
      <p class="text-fg-muted leading-relaxed mb-3">When you perform a lookup, the queried <strong class="text-fg">domain name</strong> (or, for ASN/geo, an <strong class="text-fg">IP address</strong>), and nothing else, is sent to one or more of the following public services:</p>
      <div class="overflow-x-auto bg-surface-2 border border-line rounded-xl">
        <table class="w-full text-sm">
          <thead class="text-left text-fg-subtle border-b border-line">
            <tr>
              <th class="py-2 px-4 font-mono text-xs uppercase tracking-wider">Service</th>
              <th class="py-2 px-4 font-mono text-xs uppercase tracking-wider">Purpose</th>
              <th class="py-2 px-4 font-mono text-xs uppercase tracking-wider">Privacy policy</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr>
              <td class="py-2 px-4 text-fg">Cloudflare DNS</td>
              <td class="py-2 px-4 text-fg-muted">DNS-over-HTTPS queries (default resolver)</td>
              <td class="py-2 px-4"><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener" class="text-primary-400 hover:underline">cloudflare.com/privacypolicy</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">Google DNS</td>
              <td class="py-2 px-4 text-fg-muted">DNS-over-HTTPS queries (when selected)</td>
              <td class="py-2 px-4"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener" class="text-primary-400 hover:underline">policies.google.com/privacy</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">DNS.SB</td>
              <td class="py-2 px-4 text-fg-muted">DNS-over-HTTPS queries (when selected)</td>
              <td class="py-2 px-4"><a href="https://dns.sb/privacy/" target="_blank" rel="noopener" class="text-primary-400 hover:underline">dns.sb/privacy</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">RDAP.org</td>
              <td class="py-2 px-4 text-fg-muted">WHOIS/RDAP registration lookups</td>
              <td class="py-2 px-4 text-fg-muted">Public RDAP bootstrap service</td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">crt.sh</td>
              <td class="py-2 px-4 text-fg-muted">Certificate Transparency search (subdomains, TLS cert)</td>
              <td class="py-2 px-4"><a href="https://crt.sh" target="_blank" rel="noopener" class="text-primary-400 hover:underline">crt.sh</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">Team Cymru</td>
              <td class="py-2 px-4 text-fg-muted">IP-to-ASN mapping (via DNS, for the ASN/origin view)</td>
              <td class="py-2 px-4"><a href="https://www.team-cymru.com" target="_blank" rel="noopener" class="text-primary-400 hover:underline">team-cymru.com</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">hstspreload.org</td>
              <td class="py-2 px-4 text-fg-muted">HSTS preload-list status</td>
              <td class="py-2 px-4"><a href="https://hstspreload.org" target="_blank" rel="noopener" class="text-primary-400 hover:underline">hstspreload.org</a></td>
            </tr>
            <tr>
              <td class="py-2 px-4 text-fg">The domain you look up</td>
              <td class="py-2 px-4 text-fg-muted">Server-info tab issues an HTTP request to read response headers</td>
              <td class="py-2 px-4 text-fg-muted">: </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-fg-muted leading-relaxed mt-3">When you look up a domain, only the domain name (or IP) is sent to these services. No personal information is transmitted.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">LDNS servers are never contacted</h2>
      <p class="text-fg-muted leading-relaxed">
        The extension makes <strong class="text-fg">no requests to ldns.com</strong> or any other
        LDNS-owned server. Every lookup goes directly from your browser to the public services listed
        above. There is no backend, no telemetry, and no account.
      </p>
      <p class="text-fg-muted leading-relaxed mt-2">
        The extension does contain links to ldns.com (the header logo and the per-tab "view full
        report" chips). Those are ordinary links: nothing is sent unless you click one, which opens
        the site in a new tab like any other link.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Host permissions</h2>
      <p class="text-fg-muted leading-relaxed mb-3">This extension requests broad host permissions for the following specific purpose:</p>
      <ul class="list-disc list-inside text-fg-muted space-y-1 leading-relaxed">
        <li><strong class="text-fg">Server info tab:</strong> to fetch HTTP headers and trace redirects for any domain you look up</li>
      </ul>
      <p class="text-fg-muted leading-relaxed mt-2">This permission is only used when you actively perform a lookup. The extension does not access websites in the background or monitor your browsing.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-4">Permissions explained</h2>
      <div class="overflow-x-auto bg-surface-2 border border-line rounded-xl">
        <table class="w-full text-sm">
          <thead class="text-left text-fg-subtle border-b border-line">
            <tr>
              <th class="py-2 px-4 font-mono text-xs uppercase tracking-wider">Permission</th>
              <th class="py-2 px-4 font-mono text-xs uppercase tracking-wider">Why it is needed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr>
              <td class="py-2 px-4 font-mono text-xs text-fg">activeTab</td>
              <td class="py-2 px-4 text-fg-muted">Read the current tab's URL to auto-populate the domain field</td>
            </tr>
            <tr>
              <td class="py-2 px-4 font-mono text-xs text-fg">storage</td>
              <td class="py-2 px-4 text-fg-muted">Save your preferences and recent searches locally</td>
            </tr>
            <tr>
              <td class="py-2 px-4 font-mono text-xs text-fg">sidePanel</td>
              <td class="py-2 px-4 text-fg-muted">Open LDNS in the browser side panel when you enable side-panel mode (Chrome)</td>
            </tr>
            <tr>
              <td class="py-2 px-4 font-mono text-xs text-fg">host_permissions</td>
              <td class="py-2 px-4 text-fg-muted">Query DNS providers and fetch server information</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Data security</h2>
      <ul class="list-disc list-inside text-fg-muted space-y-1 leading-relaxed">
        <li>All DNS queries use encrypted DNS-over-HTTPS (DoH)</li>
        <li>No data is transmitted to LDNS servers, ever. There is no backend to send it to</li>
        <li>All preferences are stored locally using the browser's secure storage API</li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Your rights</h2>
      <p class="text-fg-muted leading-relaxed">You can:</p>
      <ul class="list-disc list-inside text-fg-muted space-y-1 leading-relaxed mt-2">
        <li>Clear your recent searches at any time within the extension</li>
        <li>Uninstall the extension to remove all locally stored data</li>
        <li>Use the extension without any account or registration</li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Changes to this policy</h2>
      <p class="text-fg-muted leading-relaxed">This privacy policy may be updated from time to time. Any changes will be reflected in the "Last updated" date above.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-fg mb-3">Contact</h2>
      <p class="text-fg-muted leading-relaxed">For privacy concerns or questions, please visit <a href="/" class="text-primary-400 hover:underline">ldns.com</a>.</p>
    </section>

    <div class="bg-surface-2 border border-line rounded-xl p-5">
      <p class="text-fg-muted text-sm leading-relaxed">
        <strong class="text-fg">Summary:</strong> LDNS is a privacy-focused tool. It does not collect,
        store, or transmit your personal data. All lookups are performed directly between your
        browser and public DNS / WHOIS services, the extension never contacts ldns.com.
      </p>
    </div>
  </div>
</div>
