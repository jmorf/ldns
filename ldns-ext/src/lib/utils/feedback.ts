/**
 * Bug-report / feedback deep link.
 *
 * LDNS is open source, so issues live alongside the code. The URL prefills
 * environment details the user can review and edit before submitting,
 * nothing is sent until they do.
 */

export const FEEDBACK_REPO_URL = 'https://github.com/jmorf/ldns';

/** Maintainer's X profile, an informal channel for feedback and bug reports. */
export const X_PROFILE_URL = 'https://x.com/jmorf';
export const X_HANDLE = '@jmorf';

function browserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return `Firefox ${ua.split('Firefox/')[1]?.split(' ')[0] ?? ''}`.trim();
  if (ua.includes('Edg/')) return `Edge ${ua.split('Edg/')[1]?.split(' ')[0] ?? ''}`.trim();
  if (ua.includes('Chrome/')) return `Chrome ${ua.split('Chrome/')[1]?.split(' ')[0] ?? ''}`.trim();
  return 'Unknown';
}

export function feedbackUrl(): string {
  const body = [
    '### What happened?',
    '',
    '<!-- Describe the bug or the feedback you have. Screenshots welcome. -->',
    '',
    '### Environment',
    '',
    `- LDNS extension: v${__APP_VERSION__}`,
    `- Browser: ${browserName()}`,
    ''
  ].join('\n');

  const params = new URLSearchParams({
    title: '[Extension] ',
    body
  });
  return `${FEEDBACK_REPO_URL}/issues/new?${params}`;
}
