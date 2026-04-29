<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Chrome Extension Privacy Policy | LDNS</title>
  <meta name="description" content="Privacy policy for the LDNS Chrome Extension - DNS & Domain Tools" />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
  <a href="/" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
    <ArrowLeft class="w-4 h-4" />
    Back to LDNS
  </a>

  <h1 class="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
  <p class="text-gray-400 mb-8">LDNS - DNS & Domain Tools (Chrome Extension)</p>
  <p class="text-sm text-gray-500 mb-8">Last Updated: January 2025</p>

  <div class="prose prose-invert prose-gray max-w-none space-y-6">
    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Overview</h2>
      <p class="text-gray-300">
        LDNS is a browser extension that provides DNS, WHOIS/RDAP, email security, and server information lookups.
        We are committed to protecting your privacy and being transparent about our practices.
      </p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Data Collection</h2>
      <h3 class="text-lg font-medium text-gray-200 mb-2">What We DO NOT Collect</h3>
      <ul class="list-disc list-inside text-gray-300 space-y-1">
        <li>We do NOT collect any personal information</li>
        <li>We do NOT track your browsing history</li>
        <li>We do NOT send any data to our servers</li>
        <li>We do NOT use analytics or tracking services</li>
        <li>We do NOT sell or share any data with third parties</li>
      </ul>

      <h3 class="text-lg font-medium text-gray-200 mt-4 mb-2">What Stays on Your Device</h3>
      <p class="text-gray-300">The following data is stored locally in your browser using Chrome's storage API:</p>
      <ul class="list-disc list-inside text-gray-300 space-y-1">
        <li><strong>Recent Searches:</strong> The last 10 domains you've looked up (stored locally for convenience)</li>
        <li><strong>Preferences:</strong> Your selected DNS provider and theme preference</li>
      </ul>
      <p class="text-gray-300 mt-2">This data never leaves your browser and can be cleared at any time.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
      <p class="text-gray-300 mb-3">LDNS queries the following third-party DNS and WHOIS services to retrieve domain information:</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-gray-300">
          <thead class="text-left text-gray-400 border-b border-gray-700">
            <tr>
              <th class="py-2 pr-4">Service</th>
              <th class="py-2 pr-4">Purpose</th>
              <th class="py-2">Privacy Policy</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr>
              <td class="py-2 pr-4">Cloudflare DNS</td>
              <td class="py-2 pr-4">DNS-over-HTTPS queries</td>
              <td class="py-2"><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener" class="text-primary-400 hover:underline">cloudflare.com/privacypolicy</a></td>
            </tr>
            <tr>
              <td class="py-2 pr-4">Google DNS</td>
              <td class="py-2 pr-4">DNS-over-HTTPS queries</td>
              <td class="py-2"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener" class="text-primary-400 hover:underline">policies.google.com/privacy</a></td>
            </tr>
            <tr>
              <td class="py-2 pr-4">RDAP.org</td>
              <td class="py-2 pr-4">WHOIS/RDAP lookups</td>
              <td class="py-2">Public RDAP bootstrap service</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-gray-300 mt-3">When you look up a domain, only the domain name is sent to these services - no personal information is transmitted.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Host Permissions</h2>
      <p class="text-gray-300 mb-3">This extension requests broad host permissions for the following specific purpose:</p>
      <ul class="list-disc list-inside text-gray-300 space-y-1">
        <li><strong>Server Info Tab:</strong> To fetch HTTP headers and trace redirects for any domain you look up</li>
      </ul>
      <p class="text-gray-300 mt-2">This permission is only used when you actively perform a lookup. The extension does not access websites in the background or monitor your browsing.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Permissions Explained</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-gray-300">
          <thead class="text-left text-gray-400 border-b border-gray-700">
            <tr>
              <th class="py-2 pr-4">Permission</th>
              <th class="py-2">Why We Need It</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr>
              <td class="py-2 pr-4 font-mono text-xs">activeTab</td>
              <td class="py-2">To read the current tab's URL and auto-populate the domain field</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-xs">storage</td>
              <td class="py-2">To save your preferences and recent searches locally</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono text-xs">host_permissions</td>
              <td class="py-2">To query DNS providers and fetch server information</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Data Security</h2>
      <ul class="list-disc list-inside text-gray-300 space-y-1">
        <li>All DNS queries use encrypted DNS-over-HTTPS (DoH)</li>
        <li>No data is transmitted to LDNS servers</li>
        <li>All preferences are stored locally using Chrome's secure storage API</li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Your Rights</h2>
      <p class="text-gray-300">You can:</p>
      <ul class="list-disc list-inside text-gray-300 space-y-1">
        <li>Clear your recent searches at any time within the extension</li>
        <li>Uninstall the extension to remove all locally stored data</li>
        <li>Use the extension without any account or registration</li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Changes to This Policy</h2>
      <p class="text-gray-300">We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above.</p>
    </section>

    <section>
      <h2 class="text-xl font-semibold text-white mb-3">Contact</h2>
      <p class="text-gray-300">For privacy concerns or questions, please visit <a href="/" class="text-primary-400 hover:underline">ldns.com</a>.</p>
    </section>

    <div class="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <p class="text-gray-300 text-sm">
        <strong class="text-white">Summary:</strong> LDNS is a privacy-focused tool. We don't collect, store, or transmit your personal data.
        All lookups are performed directly between your browser and public DNS/WHOIS services.
      </p>
    </div>
  </div>
</div>
