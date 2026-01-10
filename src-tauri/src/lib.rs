mod commands;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent, AppHandle,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSColor, NSWindow, NSApplication, NSApplicationActivationPolicy};
#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

static PREVENT_HIDE: AtomicBool = AtomicBool::new(false);
static CURRENT_SHORTCUT: Mutex<Option<String>> = Mutex::new(None);
static DOCK_VISIBLE: AtomicBool = AtomicBool::new(false);
static TRAY_ID: Mutex<Option<String>> = Mutex::new(None);
static WINDOW_SHOWN: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn set_prevent_hide(prevent: bool) {
    PREVENT_HIDE.store(prevent, Ordering::SeqCst);
}

fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if WINDOW_SHOWN.load(Ordering::SeqCst) {
            WINDOW_SHOWN.store(false, Ordering::SeqCst);
            let _ = window.hide();
        } else {
            PREVENT_HIDE.store(true, Ordering::SeqCst);
            WINDOW_SHOWN.store(true, Ordering::SeqCst);
            
            if let Some(tray_id) = TRAY_ID.lock().unwrap().as_ref() {
                if let Some(tray) = app.tray_by_id(tray_id) {
                    if let Ok(Some(tray_rect)) = tray.rect() {
                        position_window_with_rect(&window, &tray_rect);
                    }
                }
            }
            
            let _ = window.show();
            let _ = window.set_focus();
            
            std::thread::spawn(|| {
                std::thread::sleep(std::time::Duration::from_millis(300));
                PREVENT_HIDE.store(false, Ordering::SeqCst);
            });
        }
    }
}

#[tauri::command]
async fn register_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    unregister_current_shortcut(&app)?;
    
    let parsed: Shortcut = shortcut.parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;
    
    if app.global_shortcut().is_registered(parsed.clone()) {
        return Err("This shortcut is already in use by another application".to_string());
    }
    
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(parsed.clone(), move |_app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                toggle_window(&app_handle);
            }
        })
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;
    
    *CURRENT_SHORTCUT.lock().unwrap() = Some(shortcut);
    
    Ok(())
}

fn unregister_current_shortcut(app: &AppHandle) -> Result<(), String> {
    let mut current = CURRENT_SHORTCUT.lock().unwrap();
    if let Some(shortcut_str) = current.take() {
        if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(shortcut);
        }
    }
    Ok(())
}

#[tauri::command]
async fn unregister_shortcut(app: AppHandle) -> Result<(), String> {
    unregister_current_shortcut(&app)
}

#[tauri::command]
async fn is_shortcut_available(app: AppHandle, shortcut: String) -> Result<bool, String> {
    let parsed: Shortcut = shortcut.parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;
    
    let current = CURRENT_SHORTCUT.lock().unwrap();
    if let Some(current_shortcut) = &*current {
        if current_shortcut == &shortcut {
            return Ok(true);
        }
    }
    
    Ok(!app.global_shortcut().is_registered(parsed))
}

#[tauri::command]
async fn set_dock_visible(app_handle: AppHandle, visible: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        PREVENT_HIDE.store(true, Ordering::SeqCst);
        
        unsafe {
            let app = NSApplication::sharedApplication(nil);
            if visible {
                app.setActivationPolicy_(NSApplicationActivationPolicy::NSApplicationActivationPolicyRegular);
            } else {
                app.setActivationPolicy_(NSApplicationActivationPolicy::NSApplicationActivationPolicyAccessory);
            }
        }
        DOCK_VISIBLE.store(visible, Ordering::SeqCst);
        
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
        
        std::thread::spawn(|| {
            std::thread::sleep(std::time::Duration::from_millis(500));
            PREVENT_HIDE.store(false, Ordering::SeqCst);
        });
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        let _ = visible;
        let _ = app_handle;
        Ok(())
    }
}

#[tauri::command]
async fn get_dock_visible() -> Result<bool, String> {
    Ok(DOCK_VISIBLE.load(Ordering::SeqCst))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let tray_icon_path = app.path().resource_dir()
                .map(|p| p.join("icons/tray.png"))
                .ok()
                .and_then(|p| if p.exists() { Some(p) } else { None });
            
            let tray_icon = if let Some(path) = tray_icon_path {
                tauri::image::Image::from_path(path).unwrap_or_else(|_| app.default_window_icon().unwrap().clone())
            } else {
                app.default_window_icon().unwrap().clone()
            };
            
            let quit_item = MenuItem::with_id(app, "quit", "Quit Skiller", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&quit_item])?;
            
            let tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("Skiller - Claude Plugins & Skills")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    }
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
                            if WINDOW_SHOWN.load(Ordering::SeqCst) {
                                WINDOW_SHOWN.store(false, Ordering::SeqCst);
                                let _ = window.hide();
                            } else {
                                PREVENT_HIDE.store(true, Ordering::SeqCst);
                                WINDOW_SHOWN.store(true, Ordering::SeqCst);
                                
                                #[cfg(target_os = "macos")]
                                {
                                    unsafe {
                                        let ns_app = NSApplication::sharedApplication(nil);
                                        let _: () = objc::msg_send![ns_app, activateIgnoringOtherApps: cocoa::base::YES];
                                    }
                                }
                                
                                if let Ok(Some(tray_rect)) = tray.rect() {
                                    position_window_with_rect(&window, &tray_rect);
                                }
                                let _ = window.show();
                                let _ = window.set_focus();
                                
                                std::thread::spawn(|| {
                                    std::thread::sleep(std::time::Duration::from_millis(300));
                                    PREVENT_HIDE.store(false, Ordering::SeqCst);
                                });
                            }
                        }
                    }
                })
                .build(app)?;
            
            *TRAY_ID.lock().unwrap() = Some(tray.id().0.clone());

            let window = app.get_webview_window("main").unwrap();
            
            if let Ok(Some(tray_rect)) = tray.rect() {
                position_window_with_rect(&window, &tray_rect);
            }
            
            let window_clone = window.clone();
            
            #[cfg(target_os = "macos")]
            {
                use tauri::window::Color;
                use cocoa::appkit::NSView;
                use objc::{msg_send, sel, sel_impl};
                
                let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
                
                if let Ok(ns_window) = window.ns_window() {
                    unsafe {
                        let ns_window = ns_window as id;
                        let clear_color = NSColor::clearColor(nil);
                        ns_window.setBackgroundColor_(clear_color);
                        ns_window.setOpaque_(cocoa::base::NO);
                        
                        let content_view: id = ns_window.contentView();
                        content_view.setWantsLayer(cocoa::base::YES);
                        let layer: id = content_view.layer();
                        let _: () = msg_send![layer, setCornerRadius: 16.0_f64];
                        let _: () = msg_send![layer, setMasksToBounds: cocoa::base::YES];
                    }
                }
            }
            
            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    if !PREVENT_HIDE.load(Ordering::SeqCst) {
                        WINDOW_SHOWN.store(false, Ordering::SeqCst);
                        let _ = window_clone.hide();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::execute_in_terminal,
            commands::open_in_explorer,
            commands::get_installed_terminals,
            commands::get_default_download_path,
            commands::download_skill,
            set_prevent_hide,
            register_shortcut,
            unregister_shortcut,
            is_shortcut_available,
            set_dock_visible,
            get_dock_visible,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn position_window_with_rect(window: &tauri::WebviewWindow, tray_rect: &tauri::Rect) {
    let tray_position = tray_rect.position.to_physical::<i32>(1.0);
    let tray_size = tray_rect.size.to_physical::<u32>(1.0);
    
    if let Ok(window_size) = window.outer_size() {
        #[cfg(target_os = "macos")]
        let y = tray_position.y + tray_size.height as i32;
        
        #[cfg(not(target_os = "macos"))]
        let y = tray_position.y - window_size.height as i32;
        
        let x = tray_position.x + (tray_size.width as i32 / 2) - (window_size.width as i32 / 2);
        
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x,
            y,
        }));
    }
}
