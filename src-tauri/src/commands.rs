use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
use std::io::Write;
use serde::Serialize;

#[derive(Serialize)]
pub struct TerminalApp {
    pub name: String,
    pub path: String,
    pub bundle_id: String,
}

#[tauri::command]
pub async fn get_installed_terminals() -> Result<Vec<TerminalApp>, String> {
    let mut terminals = Vec::new();
    
    #[cfg(target_os = "macos")]
    {
        let known_terminals = [
            ("Terminal", "/System/Applications/Utilities/Terminal.app", "com.apple.Terminal"),
            ("iTerm", "/Applications/iTerm.app", "com.googlecode.iterm2"),
            ("Warp", "/Applications/Warp.app", "dev.warp.Warp-Stable"),
            ("Alacritty", "/Applications/Alacritty.app", "org.alacritty"),
            ("kitty", "/Applications/kitty.app", "net.kovidgoyal.kitty"),
            ("Hyper", "/Applications/Hyper.app", "co.zeit.hyper"),
            ("WezTerm", "/Applications/WezTerm.app", "com.github.wez.wezterm"),
            ("Tabby", "/Applications/Tabby.app", "org.tabby"),
            ("Rio", "/Applications/Rio.app", "com.raphaelamorim.rio"),
            ("Ghostty", "/Applications/Ghostty.app", "com.mitchellh.ghostty"),
        ];
        
        for (name, path, bundle_id) in known_terminals {
            if Path::new(path).exists() {
                terminals.push(TerminalApp {
                    name: name.to_string(),
                    path: path.to_string(),
                    bundle_id: bundle_id.to_string(),
                });
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let known_terminals = [
            ("Windows Terminal", "wt.exe", "Microsoft.WindowsTerminal"),
            ("Command Prompt", "cmd.exe", "cmd"),
            ("PowerShell", "powershell.exe", "powershell"),
        ];
        
        for (name, path, id) in known_terminals {
            terminals.push(TerminalApp {
                name: name.to_string(),
                path: path.to_string(),
                bundle_id: id.to_string(),
            });
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        let known_terminals = [
            ("GNOME Terminal", "gnome-terminal", "gnome-terminal"),
            ("Konsole", "konsole", "konsole"),
            ("xterm", "xterm", "xterm"),
            ("Alacritty", "alacritty", "alacritty"),
            ("kitty", "kitty", "kitty"),
            ("Tilix", "tilix", "tilix"),
        ];
        
        for (name, cmd, id) in known_terminals {
            if Command::new("which")
                .arg(cmd)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
            {
                terminals.push(TerminalApp {
                    name: name.to_string(),
                    path: cmd.to_string(),
                    bundle_id: id.to_string(),
                });
            }
        }
    }
    
    Ok(terminals)
}

#[tauri::command]
pub async fn execute_in_terminal(command: String, terminal: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let terminal_app = terminal.unwrap_or_else(|| "Terminal".to_string());
        
        let shell_cmd_for_cli = |cmd: &str| -> String {
            format!(
                r#"cd "$HOME" && [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"; {}; exec zsh"#,
                cmd
            )
        };
        
        let script = match terminal_app.as_str() {
            "iTerm" => format!(
                r#"tell application "iTerm"
                    activate
                    try
                        set newWindow to (create window with default profile)
                        tell current session of newWindow
                            write text "{}"
                        end tell
                    on error
                        tell current window
                            create tab with default profile
                            tell current session
                                write text "{}"
                            end tell
                        end tell
                    end try
                end tell"#,
                command.replace("\"", "\\\""),
                command.replace("\"", "\\\"")
            ),
            "Warp" => format!(
                r#"tell application "Warp"
                    activate
                    delay 0.5
                    tell application "System Events"
                        keystroke "t" using command down
                        delay 0.3
                        keystroke "{}"
                        keystroke return
                    end tell
                end tell"#,
                command.replace("\"", "\\\"")
            ),
            "Hyper" => format!(
                r#"tell application "Hyper"
                    activate
                end tell
                delay 0.5
                tell application "System Events"
                    keystroke "{}"
                    keystroke return
                end tell"#,
                command.replace("\"", "\\\"")
            ),
            "Alacritty" => {
                let shell_cmd = shell_cmd_for_cli(&command);
                let output = Command::new("open")
                    .args(["-na", "/Applications/Alacritty.app", "--args", "-e", "zsh", "-c", &shell_cmd])
                    .output()
                    .map_err(|e| format!("Failed to execute open command: {}", e))?;
                
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(format!("Failed to open Alacritty: {}", stderr.trim()));
                }
                return Ok(());
            },
            "kitty" => {
                let shell_cmd = shell_cmd_for_cli(&command);
                let output = Command::new("open")
                    .args(["-na", "/Applications/kitty.app", "--args", "zsh", "-c", &shell_cmd])
                    .output()
                    .map_err(|e| format!("Failed to execute open command: {}", e))?;
                
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(format!("Failed to open kitty: {}", stderr.trim()));
                }
                return Ok(());
            },
            "WezTerm" => {
                let shell_cmd = shell_cmd_for_cli(&command);
                let output = Command::new("open")
                    .args(["-na", "/Applications/WezTerm.app", "--args", "start", "--", "zsh", "-c", &shell_cmd])
                    .output()
                    .map_err(|e| format!("Failed to execute open command: {}", e))?;
                
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(format!("Failed to open WezTerm: {}", stderr.trim()));
                }
                return Ok(());
            },
            "Rio" => {
                let shell_cmd = shell_cmd_for_cli(&command);
                let output = Command::new("open")
                    .args(["-na", "/Applications/Rio.app", "--args", "-e", "zsh", "-c", &shell_cmd])
                    .output()
                    .map_err(|e| format!("Failed to execute open command: {}", e))?;
                
                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(format!("Failed to open Rio: {}", stderr.trim()));
                }
                return Ok(());
            },
            "Ghostty" => {
                let shell_cmd = shell_cmd_for_cli(&command);
                
                let ghostty_paths = [
                    "/Applications/Ghostty.app/Contents/MacOS/ghostty",
                    "/opt/homebrew/bin/ghostty",
                    "/usr/local/bin/ghostty",
                ];
                
                let mut launched = false;
                let mut last_error: Option<String> = None;
                for ghostty_path in ghostty_paths {
                    if Path::new(ghostty_path).exists() {
                        match Command::new(ghostty_path)
                            .args(["-e", "zsh", "-c", &shell_cmd])
                            .spawn()
                        {
                            Ok(_) => {
                                launched = true;
                                break;
                            }
                            Err(e) => {
                                last_error = Some(format!("Failed to execute ghostty: {}", e));
                            }
                        }
                    }
                }
                
                if !launched {
                    let applescript = format!(
                        r#"tell application "Ghostty"
                            activate
                        end tell
                        delay 0.5
                        tell application "System Events"
                            keystroke "{}"
                            keystroke return
                        end tell"#,
                        command.replace("\"", "\\\"")
                    );
                    let output = Command::new("osascript")
                        .arg("-e")
                        .arg(&applescript)
                        .output()
                        .map_err(|e| format!("Failed to execute osascript: {}", e))?;
                    
                    if !output.status.success() {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        if stderr.contains("not allowed") || 
                           stderr.contains("not permitted") || 
                           stderr.contains("assistive access") ||
                           stderr.contains("System Events") ||
                           stderr.contains("-1743") ||
                           stderr.contains("-10004") {
                            let cli_error = last_error.map(|e| format!(" CLI error: {}", e)).unwrap_or_default();
                            return Err(format!(
                                "Permission denied. Please go to System Settings → Privacy & Security → Automation, \
                                and allow Skiller to control Ghostty.{}",
                                cli_error
                            ));
                        }
                        return Err(format!("AppleScript error: {}", stderr.trim()));
                    }
                }
                return Ok(());
            },
            _ => format!(
                r#"tell application "Terminal"
                    activate
                    do script "{}"
                end tell"#,
                command.replace("\"", "\\\"")
            ),
        };
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("not allowed") || 
               stderr.contains("not permitted") || 
               stderr.contains("assistive access") ||
               stderr.contains("System Events") ||
               stderr.contains("-1743") ||
               stderr.contains("-10004") {
                return Err(format!(
                    "Permission denied. Please go to System Settings → Privacy & Security → Automation, \
                    and allow Skiller to control {}. Error: {}",
                    terminal_app, stderr.trim()
                ));
            }
            return Err(format!("AppleScript error: {}", stderr.trim()));
        }
    }

    #[cfg(target_os = "windows")]
    {
        let terminal_app = terminal.unwrap_or_else(|| "cmd".to_string());
        
        match terminal_app.as_str() {
            "Microsoft.WindowsTerminal" => {
                Command::new("wt")
                    .args(["cmd", "/k", &command])
                    .spawn()
                    .map_err(|e| format!("Failed to open Windows Terminal: {}", e))?;
            },
            "powershell" => {
                Command::new("powershell")
                    .args(["-NoExit", "-Command", &command])
                    .spawn()
                    .map_err(|e| format!("Failed to open PowerShell: {}", e))?;
            },
            _ => {
                Command::new("cmd")
                    .args(["/c", "start", "cmd", "/k", &command])
                    .spawn()
                    .map_err(|e| format!("Failed to open terminal: {}", e))?;
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let terminal_app = terminal.unwrap_or_else(|| "gnome-terminal".to_string());
        let cmd_with_exec = format!("{}; exec bash", command);
        
        let result = match terminal_app.as_str() {
            "gnome-terminal" => Command::new("gnome-terminal")
                .args(["--", "bash", "-c", &cmd_with_exec])
                .spawn(),
            "konsole" => Command::new("konsole")
                .args(["-e", "bash", "-c", &cmd_with_exec])
                .spawn(),
            "alacritty" => Command::new("alacritty")
                .args(["-e", "bash", "-c", &cmd_with_exec])
                .spawn(),
            "kitty" => Command::new("kitty")
                .args(["bash", "-c", &cmd_with_exec])
                .spawn(),
            "tilix" => Command::new("tilix")
                .args(["-e", "bash", "-c", &cmd_with_exec])
                .spawn(),
            _ => Command::new("xterm")
                .args(["-e", "bash", "-c", &cmd_with_exec])
                .spawn(),
        };
        
        result.map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_default_download_path() -> Result<String, String> {
    let download_dir = dirs::download_dir()
        .ok_or_else(|| "Could not find download directory".to_string())?;
    
    download_dir
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid download path".to_string())
}

#[tauri::command]
pub async fn download_skill(url: String, filename: String, download_path: Option<String>) -> Result<String, String> {
    // Get the target directory
    let target_dir: PathBuf = if let Some(path) = download_path {
        if path.is_empty() {
            dirs::download_dir()
                .ok_or_else(|| "Could not find download directory".to_string())?
        } else {
            PathBuf::from(path)
        }
    } else {
        dirs::download_dir()
            .ok_or_else(|| "Could not find download directory".to_string())?
    };
    
    // Ensure directory exists
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    // Build the full file path
    let file_path = target_dir.join(&filename);
    
    // Download the file using reqwest (blocking)
    let response = reqwest::blocking::get(&url)
        .map_err(|e| format!("Failed to download: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }
    
    let bytes = response.bytes()
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Write to file
    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    file_path
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid file path".to_string())
}
