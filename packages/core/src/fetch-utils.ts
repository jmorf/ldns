/**
 * The single fetch wrapper used by every network call in core.
 *
 * Guarantees a timeout on every request — a hung DoH/RDAP/crt.sh connection
 * must never stall a caller forever — and composes an optional caller
 * AbortSignal so UI-driven cancellation actually reaches the socket.
 */

export const DEFAULT_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const outer = init.signal;
  const onAbort = () => controller.abort(outer?.reason);
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason);
    else outer.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(
    () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    timeoutMs
  );
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onAbort);
  }
}

/** True if the error is an abort or timeout from fetchWithTimeout. */
export function isAbortOrTimeout(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === 'TimeoutError' || err.name === 'AbortError';
  }
  if (err instanceof Error) {
    return err.message.includes('aborted') || err.message.includes('timed out');
  }
  return false;
}
