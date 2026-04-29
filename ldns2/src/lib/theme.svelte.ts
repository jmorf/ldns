/**
 * Theme handling — system / light / dark with localStorage override.
 * Mirrors the extension's behaviour so the visual experience is identical.
 */

import { browser } from '$app/environment';

export type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ldns_theme';

function readStored(): Theme {
  if (!browser) return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function systemPrefersDark(): boolean {
  if (!browser) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

export function applyTheme(theme: Theme): void {
  if (!browser) return;
  const resolved = resolvedTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.classList.toggle('light', resolved === 'light');
}

class ThemeStore {
  current = $state<Theme>('system');
  resolved = $state<'light' | 'dark'>('dark');

  init() {
    this.current = readStored();
    this.resolved = resolvedTheme(this.current);
    applyTheme(this.current);

    if (!browser) return;
    // React to OS-level changes so `system` mode follows the user's setting live.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      this.resolved = resolvedTheme(this.current);
      applyTheme(this.current);
    });
  }

  set(next: Theme) {
    this.current = next;
    this.resolved = resolvedTheme(next);
    if (browser) localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  cycle() {
    const order: Theme[] = ['system', 'light', 'dark'];
    const idx = order.indexOf(this.current);
    this.set(order[(idx + 1) % order.length]);
  }
}

export const theme = new ThemeStore();
