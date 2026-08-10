import { extensionState } from '$lib/state/extension-state.svelte';
import { RECORD_TYPE_ORDER } from '@ldns/core/constants';
import type { DnsData, DnsRecordResult } from '@ldns/core/types';

interface FullExport {
  domain: string;
  endpoint: string;
  exportedAt: string;
  appVersion: string;
  dns: unknown;
  rdap: unknown;
  email: unknown;
  server: unknown;
  propagation: unknown;
  subdomains: unknown;
  dkim: unknown;
  asn: unknown;
}

declare const __APP_VERSION__: string;

export function buildExport(): FullExport {
  return {
    domain: extensionState.domain,
    endpoint: extensionState.endpoint,
    exportedAt: new Date().toISOString(),
    appVersion: __APP_VERSION__,
    dns: extensionState.dnsState.data,
    rdap: extensionState.rdapState.data,
    email: extensionState.emailState.data,
    server: extensionState.serverState.data,
    propagation: extensionState.propagationState.data,
    subdomains: extensionState.subdomainState.data,
    dkim: extensionState.dkimState.data,
    asn: extensionState.asnState.data
  };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(): void {
  const data = buildExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `ldns-${extensionState.domain || 'lookup'}-${Date.now()}.json`);
}

export function csvCell(value: string): string {
  // Neutralise spreadsheet formula injection: Excel / Sheets execute a cell
  // that begins with = + - @ (or a leading tab / CR that some parsers strip).
  // DNS and TXT record values are attacker-controlled, so prefix those with a
  // single quote so they're treated as literal text when the CSV is opened.
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  // Quote if the value contains comma, quote, or newline; double up internal quotes.
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function dnsToCsv(data: DnsData): string {
  const header = ['type', 'data', 'ttl'];
  const rows: string[] = [header.join(',')];
  const orderedTypes = RECORD_TYPE_ORDER;
  const seen = new Set<string>();
  const emit = (type: string, records: DnsRecordResult[]) => {
    for (const r of records) {
      rows.push([csvCell(type), csvCell(r.data), csvCell(String(r.ttl))].join(','));
    }
  };
  for (const type of orderedTypes) {
    if (data[type]?.length) {
      emit(type, data[type]);
      seen.add(type);
    }
  }
  for (const [type, records] of Object.entries(data)) {
    if (!seen.has(type) && records.length) emit(type, records);
  }
  return rows.join('\n');
}

export function downloadDnsCsv(): void {
  const data = extensionState.dnsState.data;
  if (!data) return;
  const csv = dnsToCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `ldns-${extensionState.domain || 'lookup'}-dns-${Date.now()}.csv`);
}

export async function copyJson(): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(buildExport(), null, 2));
}
