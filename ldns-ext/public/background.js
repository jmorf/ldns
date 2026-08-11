/**
 * Cross-browser action-click bridge.
 *
 * On Firefox, when "Side panel mode" is on we clear the action's default
 * popup so the click reaches this listener; we then toggle the native
 * sidebar via `chrome.sidebarAction.toggle()`. The toggle call only works
 * inside a user-gesture context, which `action.onClicked` provides.
 *
 * On Chrome the toggle path doesn't run: Chrome handles action click →
 * panel directly via `chrome.sidePanel.setPanelBehavior({
 *   openPanelOnActionClick: true })`, set from sidepanel.ts. The listener
 * still registers but is a no-op there because `chrome.sidebarAction` is
 * undefined on Chrome.
 */

chrome.action.onClicked.addListener(async () => {
  // Firefox path
  if (typeof chrome.sidebarAction?.toggle === 'function') {
    try {
      await chrome.sidebarAction.toggle();
    } catch (e) {
      console.error('[LDNS] sidebar toggle failed:', e);
    }
  }
});
