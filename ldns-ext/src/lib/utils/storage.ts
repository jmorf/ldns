import type { RecentSearch, DnsEndpoint, Theme, Settings } from '@ldns/core/types';
import { MAX_RECENT_SEARCHES } from '@ldns/core/constants';

const STORAGE_KEYS = {
  RECENT_SEARCHES: 'ldns_recent_searches',
  ENDPOINT: 'ldns_endpoint',
  THEME: 'ldns_theme',
  SETTINGS: 'ldns_settings',
  // First-run banner shown in the popup nudging users to try side-panel mode.
  // Set to true when the user explicitly dismisses the banner — never reshown.
  SIDEBAR_TIP_SEEN: 'ldns_sidebar_tip_seen'
} as const;

export const DEFAULT_SETTINGS: Settings = {
  // Privacy-impacting features default to OFF — the user must opt in.
  forSaleEnabled: false,
  // Cosmetic / UX preferences default to ON.
  funMessages: true,
  grain: true,
  sidePanelMode: false
};

export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT_SEARCHES);
    const stored = result[STORAGE_KEYS.RECENT_SEARCHES];
    // Validate the stored shape — corrupt data must not reach the UI, where a
    // non-string domain would blow up click handlers.
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (s): s is RecentSearch =>
        !!s && typeof s === 'object' && typeof s.domain === 'string' && typeof s.timestamp === 'number'
    );
  } catch {
    return [];
  }
}

export async function addRecentSearch(domain: string): Promise<void> {
  try {
    const searches = await getRecentSearches();
    const filtered = searches.filter((s) => s.domain !== domain);
    const updated = [{ domain, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    await chrome.storage.local.set({ [STORAGE_KEYS.RECENT_SEARCHES]: updated });
  } catch {
    /* noop */
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.RECENT_SEARCHES);
  } catch {
    /* noop */
  }
}

export async function getEndpointPreference(): Promise<DnsEndpoint> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ENDPOINT);
    const endpoint = result[STORAGE_KEYS.ENDPOINT];
    if (endpoint === 'cloudflare' || endpoint === 'google' || endpoint === 'dns-sb') {
      return endpoint;
    }
    return 'cloudflare';
  } catch {
    return 'cloudflare';
  }
}

export async function setEndpointPreference(endpoint: DnsEndpoint): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.ENDPOINT]: endpoint });
  } catch {
    /* noop */
  }
}

export async function getThemePreference(): Promise<Theme> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
    const value = result[STORAGE_KEYS.THEME];
    if (value === 'dark' || value === 'light' || value === 'system') return value;
    return 'system';
  } catch {
    return 'system';
  }
}

export async function setThemePreference(theme: Theme): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
  } catch {
    /* noop */
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function setSettings(settings: Settings): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  } catch {
    /* noop */
  }
}

// ─── Sidebar-tip dismissal flag ─────────────────────────────────────

export async function getSidebarTipSeen(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SIDEBAR_TIP_SEEN);
    return result[STORAGE_KEYS.SIDEBAR_TIP_SEEN] === true;
  } catch {
    return false;
  }
}

export async function setSidebarTipSeen(): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SIDEBAR_TIP_SEEN]: true });
  } catch {
    /* noop */
  }
}

// ─── In-memory query cache (popup-session only) ─────────────────────

interface CacheEntry<T> {
  value: T;
  at: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string, ttlMs: number): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) {
    memCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  memCache.set(key, { value, at: Date.now() });
}

// ─── Session cache (chrome.storage.session) ─────────────────────────
// Survives popup close/reopen within the same browser session. Falls back
// to no-op if the runtime doesn't expose `session` (rare).

const SESSION_KEY = 'ldns_session_cache';

interface SessionCache {
  domain: string;
  endpoint: DnsEndpoint;
  at: number;
}

function sessionStorage(): chrome.storage.StorageArea | null {
  // chrome.storage.session is MV3-only; guard for older Firefox builds.
  return (chrome.storage as { session?: chrome.storage.StorageArea }).session ?? null;
}

export async function rememberSession(domain: string, endpoint: DnsEndpoint): Promise<void> {
  const area = sessionStorage();
  if (!area) return;
  try {
    await area.set({ [SESSION_KEY]: { domain, endpoint, at: Date.now() } satisfies SessionCache });
  } catch {
    /* noop */
  }
}

export async function recallSession(maxAgeMs: number): Promise<SessionCache | null> {
  const area = sessionStorage();
  if (!area) return null;
  try {
    const result = await area.get(SESSION_KEY);
    const cached = result[SESSION_KEY] as SessionCache | undefined;
    if (!cached) return null;
    if (Date.now() - cached.at > maxAgeMs) return null;
    return cached;
  } catch {
    return null;
  }
}
