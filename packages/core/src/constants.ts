import type { DnsEndpoint } from './types';

export const DNS_ENDPOINTS: Record<DnsEndpoint, { url: string; name: string }> = {
  cloudflare: {
    url: 'https://cloudflare-dns.com/dns-query',
    name: 'Cloudflare'
  },
  google: {
    url: 'https://dns.google/resolve',
    name: 'Google'
  },
  'dns-sb': {
    url: 'https://doh.dns.sb/dns-query',
    name: 'DNS.SB'
  }
};

export const DEFAULT_RECORD_TYPES = ['A', 'AAAA', 'NS', 'MX', 'TXT', 'SOA', 'CAA'];

export const RDAP_BOOTSTRAP_URL = 'https://rdap.org/domain/';

export const MAX_RECENT_SEARCHES = 10;

/** Common email provider patterns for MX record detection */
export const EMAIL_PROVIDERS: Record<string, string[]> = {
  'Google Workspace': ['google', 'gmail', 'aspmx'],
  'Microsoft 365': ['outlook', 'microsoft', 'hotmail'],
  'ProtonMail': ['protonmail', 'proton'],
  'Mailgun': ['mailgun'],
  'SendGrid': ['sendgrid'],
  'FastMail': ['fastmail'],
  'Zoho Mail': ['zoho'],
  'Yandex Mail': ['yandex'],
  'Mimecast': ['mimecast'],
  'Barracuda': ['barracuda'],
  'Symantec': ['messagelabs', 'symantec']
};

/** SPF include domain to provider mapping */
export const SPF_PROVIDER_MAP: Record<string, string> = {
  // Google Workspace
  '_spf.google.com': 'Google Workspace',
  '_netblocks.google.com': 'Google Workspace',
  '_netblocks2.google.com': 'Google Workspace',
  '_netblocks3.google.com': 'Google Workspace',

  // Microsoft 365
  'spf.protection.outlook.com': 'Microsoft 365',
  '_spf-ssg-a.microsoft.com': 'Microsoft',
  '_spf-ssg-b.microsoft.com': 'Microsoft',

  // Transactional Email Services
  'sendgrid.net': 'SendGrid',
  'mailgun.org': 'Mailgun',
  'amazonses.com': 'Amazon SES',
  'spf.mtasv.net': 'Postmark',
  '_spf.sparkpost.com': 'SparkPost',
  'sparkpost.com': 'SparkPost',
  'spf.mandrillapp.com': 'Mandrill',
  'servers.mcsv.net': 'Mailchimp',
  'spf.mailjet.com': 'Mailjet',
  'mailjet.com': 'Mailjet',
  'spf.smtp2go.com': 'SMTP2GO',
  'spf.brevo.com': 'Brevo',
  'spf.sendinblue.com': 'Brevo',
  'spf.elasticemail.com': 'Elastic Email',
  'spf.socketlabs.com': 'SocketLabs',
  '_spf.mailersend.net': 'MailerSend',

  // Email Marketing Platforms
  'ctct1.net': 'Constant Contact',
  'ctct2.net': 'Constant Contact',
  'mktomail.com': 'Marketo',
  'cmail1.com': 'Campaign Monitor',
  'cmail2.com': 'Campaign Monitor',
  'spf.klaviyo.com': 'Klaviyo',
  'mail.klaviyo.com': 'Klaviyo',
  'spf.getresponse.com': 'GetResponse',
  'bluehornet.com': 'Oracle Eloqua',
  'spf.salesforce.com': 'Salesforce',
  'spf.exacttarget.com': 'Salesforce Marketing Cloud',

  // CRM/Support Platforms
  'mail.zendesk.com': 'Zendesk',
  'helpscoutemail.com': 'Help Scout',
  'mail.intercom.io': 'Intercom',
  '_spf.freshdesk.com': 'Freshdesk',
  'mail.hubspot.com': 'HubSpot',
  '_spf.hubspot.com': 'HubSpot',

  // E-commerce Platforms
  'spf.shopify.com': 'Shopify',
  'shops.shopify.com': 'Shopify',
  'spf.bigcommerce.com': 'BigCommerce',
  'spf.wix.com': 'Wix',
  'mail.squarespace.com': 'Squarespace',

  // Other Services
  'zohomail.com': 'Zoho Mail',
  'spf.zoho.com': 'Zoho Mail',
  'spf.protection.office365.us': 'Microsoft 365 GCC',
  'spf.godaddy.com': 'GoDaddy',
  'secureserver.net': 'GoDaddy',
  'ghs.google.com': 'Google Workspace Legacy',
  'aspmx.googlemail.com': 'Google Workspace',
  'bluehost.com': 'Bluehost',
  'spf.dreamhost.com': 'DreamHost',
  'mail.ovh.net': 'OVH',
  'spf.infomaniak.ch': 'Infomaniak'
};
