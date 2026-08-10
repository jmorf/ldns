/**
 * Shared tone → class maps for status coloring, keyed by the
 * green/yellow/red/gray tones that the core helpers (getStatusColor,
 * getResponseTimeColor, getPolicyColor) return.
 */

export type Tone = 'green' | 'yellow' | 'red' | 'gray';

/** Text-only status classes. */
export const toneText: Record<Tone, string> = {
  green: 'text-ok-400',
  yellow: 'text-warn-400',
  red: 'text-bad-400',
  gray: 'text-fg-muted'
};

/** Badge (bg + border + text) status classes. */
export const toneBadge: Record<Tone, string> = {
  green: 'bg-ok-500/15 border-ok-500/30 text-ok-400',
  yellow: 'bg-warn-500/15 border-warn-500/30 text-warn-400',
  red: 'bg-bad-500/15 border-bad-500/30 text-bad-400',
  gray: 'bg-surface-3 border-line text-fg-muted'
};

/** Map a security-header audit level to its tone. */
export const levelTone: Record<'ok' | 'warn' | 'bad', Tone> = {
  ok: 'green',
  warn: 'yellow',
  bad: 'red'
};
