import { appWindow } from '@tauri-apps/api/window';
import { SystemTray, SystemTrayMenuItem, SystemTrayEvent } from '@tauri-apps/api/tray';

/* ===== Initialize System Tray ===== */
const tray = new SystemTray('icon.ico', [
  { id: 'show', title: 'Show' },
  { id: 'exit', title: 'Exit' }
]);

/* ===== Minimize to Tray on Close ===== */
appWindow.onCloseRequested(async (event) => {
  event.preventDefault(); 
  appWindow.hide();       
});

/* ===== Handle Tray Menu Events ===== */
tray.listen(async (event) => {
  if (event === 'show') {
    appWindow.show();    
    appWindow.setFocus();
  }
  if (event === 'exit') {
    appWindow.close();   
  }
});
