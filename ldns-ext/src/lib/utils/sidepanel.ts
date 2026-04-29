/**
 * Toggle between popup-on-click and side-panel-on-click for the extension
 * action button. When side-panel mode is on, clear the action's popup so the
 * click reaches the side-panel API; when off, restore the popup path.
 */

const POPUP_PATH = 'src/popup/popup.html';

interface SidePanelApi {
  setPanelBehavior(opts: { openPanelOnActionClick: boolean }): Promise<void>;
}

function sidePanel(): SidePanelApi | null {
  return (chrome as { sidePanel?: SidePanelApi }).sidePanel ?? null;
}

export function sidePanelSupported(): boolean {
  return sidePanel() !== null;
}

export async function applySidePanelMode(enabled: boolean): Promise<void> {
  const sp = sidePanel();
  // Firefox / older Chrome lack chrome.sidePanel — silently no-op so we don't
  // leave the action without a popup target.
  if (!sp) return;
  try {
    if (enabled) {
      await chrome.action.setPopup({ popup: '' });
      await sp.setPanelBehavior({ openPanelOnActionClick: true });
    } else {
      await chrome.action.setPopup({ popup: POPUP_PATH });
      await sp.setPanelBehavior({ openPanelOnActionClick: false });
    }
  } catch (e) {
    console.error('[LDNS] applySidePanelMode failed:', e);
  }
}
