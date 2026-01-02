import { app, dom, texts } from './globals.js';
import { showModal } from './timer.js';

/* ===== Autostart Toggle (UI + Plugin Integration) ===== */
async function initAutostartUI() {
  const saved = localStorage.getItem('autostart');
  dom.autostartToggle.checked = saved === 'true';
  if (window.__TAURI__) {
    try {
      const invoke = window.__TAURI__.core.invoke;
      const isEnabled = await invoke('plugin:autostart|is_enabled');
      dom.autostartToggle.checked = !!isEnabled;
      const savedPref = saved === 'true';
      if (savedPref !== !!isEnabled) {
        if (savedPref) await invoke('plugin:autostart|enable');
        else await invoke('plugin:autostart|disable');
        dom.autostartToggle.checked = savedPref;
      }
    } catch (error) {
      console.error('Autostart state check failed:', error);
    }
  }
}

dom.autostartToggle.addEventListener('change', async () => {
  const wantEnable = dom.autostartToggle.checked;
  localStorage.setItem('autostart', wantEnable ? 'true' : 'false');
  if (window.__TAURI__) {
    try {
      const invoke = window.__TAURI__.core.invoke;
      if (wantEnable) {
        await invoke('plugin:autostart|enable');
        // Verify if it was actually enabled
        const isEnabled = await invoke('plugin:autostart|is_enabled');
        if (!isEnabled) throw new Error('Verification failed');
      } else await invoke('plugin:autostart|disable');
    } catch (error) {
      console.error('Failed to toggle autostart:', error);
      dom.autostartToggle.checked = !wantEnable; // Revert UI
      showModal(
        texts[app.currentLang].autostartError ||
          'Failed to update startup settings: ' + error
      );
    }
  }
});

// Initialize on load
window.addEventListener('load', initAutostartUI);
