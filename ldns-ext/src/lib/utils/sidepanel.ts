/**
 * Cross-browser side-panel toggle.
 *
 * Chrome ships `chrome.sidePanel` (MV3) which natively wires the action button
 * to open the panel via `setPanelBehavior({ openPanelOnActionClick: true })`.
 * Firefox doesn't implement that API; instead it has the older
 * `chrome.sidebarAction` (a.k.a. `browser.sidebarAction`). The bridge in
 * `public/background.js` listens for `action.onClicked` and calls
 * `sidebarAction.toggle()` so a single click on the toolbar icon opens or
 * closes the side panel, matching the Chrome UX.
 *
 * For both browsers, "side-panel mode on" means clearing the action's
 * default popup so the click reaches its respective panel-opening path.
 *
 * NOTE: `chrome.action.setPopup({ popup })` interprets a relative path
 * differently on Chrome vs Firefox. Chrome resolves relative to the
 * extension root; Firefox resolves relative to the *calling page*. So
 * passing a bare `'src/popup/popup.html'` from inside the popup itself
 * produced `moz-extension://uuid/src/popup/src/popup/popup.html` on
 * Firefox, a 404. Use `chrome.runtime.getURL()` to construct an absolute
 * extension URL that both browsers accept unambiguously.
 */

const POPUP_REL_PATH = 'src/popup/popup.html';
function popupUrl(): string {
  return chrome.runtime.getURL(POPUP_REL_PATH);
}

interface ChromeSidePanelApi {
  setPanelBehavior(opts: { openPanelOnActionClick: boolean }): Promise<void>;
}
interface FirefoxSidebarApi {
  toggle?: () => Promise<void>;
  open?: () => Promise<void>;
  close?: () => Promise<void>;
}

function chromeSidePanel(): ChromeSidePanelApi | null {
  return (chrome as { sidePanel?: ChromeSidePanelApi }).sidePanel ?? null;
}
function firefoxSidebar(): FirefoxSidebarApi | null {
  return (chrome as { sidebarAction?: FirefoxSidebarApi }).sidebarAction ?? null;
}

export function sidePanelSupported(): boolean {
  return chromeSidePanel() !== null || firefoxSidebar() !== null;
}

export async function applySidePanelMode(enabled: boolean): Promise<void> {
  const sp = chromeSidePanel();
  const sb = firefoxSidebar();

  // Neither API present, silently no-op so the action keeps its popup.
  if (!sp && !sb) return;

  try {
    if (enabled) {
      // Clearing the popup is the same on both browsers, it's how the
      // click reaches the side-panel-opening path.
      await chrome.action.setPopup({ popup: '' });
      if (sp) await sp.setPanelBehavior({ openPanelOnActionClick: true });
      // Firefox: the background.js click listener calls sidebarAction.toggle()
      // on user-gesture; nothing else to do here.
    } else {
      await chrome.action.setPopup({ popup: popupUrl() });
      if (sp) await sp.setPanelBehavior({ openPanelOnActionClick: false });
      // Firefox: closing the sidebar isn't strictly required when restoring
      // the popup, but tidies up if it was open.
      if (sb?.close) {
        try {
          await sb.close();
        } catch {
          /* user may not have it open; ignore */
        }
      }
    }
  } catch (e) {
    console.error('[LDNS] applySidePanelMode failed:', e);
  }
}
