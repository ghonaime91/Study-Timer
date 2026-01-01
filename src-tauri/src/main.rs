
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_notification::NotificationExt;

#[tauri::command]
fn show_notification(app: tauri::AppHandle, title: String, body: String) {
    let _ = app.notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

fn main() {
    tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        None,
    ))
    .plugin(tauri_plugin_notification::init())
    .invoke_handler(tauri::generate_handler![show_notification])
        .setup(|app| {
            let show_i = MenuItemBuilder::with_id("show", "Show").build(app)?;
            let quit_i = MenuItemBuilder::with_id("quit", "Exit").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show_i, &quit_i])
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => { app.exit(0); }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // الجزء الذي كان يسبب الخطأ:
            let window = app.get_webview_window("main").expect("failed to get main window");
            let window_clone = window.clone(); 
            
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let _ = window_clone.hide(); 
                    api.prevent_close();   
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}