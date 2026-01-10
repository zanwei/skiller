import { useState, useEffect, useCallback, useRef } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { AppSettings, PackageManager, Theme, TerminalApp } from '../types';
import './Settings.css';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onBack: () => void;
}

const PACKAGE_MANAGERS: { value: PackageManager; label: string }[] = [
  { value: 'npm', label: 'npm' },
  { value: 'bun', label: 'Bun' },
  { value: 'pnpm', label: 'pnpm' },
  { value: 'yarn', label: 'Yarn' },
];

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
];

export function Settings({ settings, onUpdate, onBack }: SettingsProps) {
  const [terminals, setTerminals] = useState<TerminalApp[]>([]);
  const [loadingTerminals, setLoadingTerminals] = useState(false);
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const [shortcutSuccess, setShortcutSuccess] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const shortcutInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('1.0.0'));
  }, []);

  const handleDownloadPathSelect = async () => {
    try {
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const { open } = await import('@tauri-apps/plugin-dialog');
        
        await invoke('set_prevent_hide', { prevent: true });
        
        try {
          const selected = await open({
            directory: true,
            multiple: false,
            title: 'Select Default Download Path',
          });
          if (selected && typeof selected === 'string') {
            onUpdate({ defaultDownloadPath: selected });
          }
        } finally {
          await invoke('set_prevent_hide', { prevent: false });
        }
      } else {
        const path = prompt('Enter default download path:', settings.defaultDownloadPath);
        if (path !== null) {
          onUpdate({ defaultDownloadPath: path });
        }
      }
    } catch (error) {
      console.error('Failed to select download path:', error);
    }
  };

  const loadTerminals = async () => {
    setLoadingTerminals(true);
    try {
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const installedTerminals = await invoke<TerminalApp[]>('get_installed_terminals');
        setTerminals(installedTerminals);
      } else {
        setTerminals([
          { name: 'Terminal', path: '/System/Applications/Utilities/Terminal.app', bundle_id: 'com.apple.Terminal' },
          { name: 'iTerm', path: '/Applications/iTerm.app', bundle_id: 'com.googlecode.iterm2' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load terminals:', error);
    } finally {
      setLoadingTerminals(false);
    }
  };

  useEffect(() => {
    loadTerminals();
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    if (window.__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/core');
      if (settings.globalShortcut) {
        try {
          await invoke('register_shortcut', { shortcut: settings.globalShortcut });
        } catch (e) {
          console.error('Failed to register saved shortcut:', e);
        }
      }
      try {
        await invoke('set_dock_visible', { visible: settings.showInDock });
      } catch (e) {
        console.error('Failed to set dock visibility:', e);
      }
    }
  };

  const keyEventToShortcut = useCallback((e: KeyboardEvent): string | null => {
    const modifiers: string[] = [];
    
    if (e.metaKey) modifiers.push('Command');
    if (e.ctrlKey) modifiers.push('Control');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    
    const key = e.key;
    if (['Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'Tab', 'Escape'].includes(key)) {
      return null;
    }
    
    if (modifiers.length === 0) {
      return null;
    }
    
    let keyName = key.length === 1 ? key.toUpperCase() : key;
    if (keyName === ' ') keyName = 'Space';
    if (keyName === 'ArrowUp') keyName = 'Up';
    if (keyName === 'ArrowDown') keyName = 'Down';
    if (keyName === 'ArrowLeft') keyName = 'Left';
    if (keyName === 'ArrowRight') keyName = 'Right';
    
    return [...modifiers, keyName].join('+');
  }, []);

  const formatShortcutDisplay = (shortcut: string): string => {
    if (!shortcut) return '';
    return shortcut
      .replace(/Command/g, '⌘')
      .replace(/Control/g, '⌃')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/\+/g, ' + ');
  };

  const handleShortcutKeyDown = useCallback(async (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shortcut = keyEventToShortcut(e);
    if (!shortcut) return;
    
    setShortcutError(null);
    setShortcutSuccess(false);
    
    if (window.__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        const available = await invoke<boolean>('is_shortcut_available', { shortcut });
        
        if (!available) {
          setShortcutError('This shortcut is already in use');
          return;
        }
        
        await invoke('register_shortcut', { shortcut });
        onUpdate({ globalShortcut: shortcut });
        setShortcutSuccess(true);
        setIsRecordingShortcut(false);
        
        setTimeout(() => setShortcutSuccess(false), 2000);
      } catch (error: any) {
        setShortcutError(error.toString());
      }
    } else {
      onUpdate({ globalShortcut: shortcut });
      setShortcutSuccess(true);
      setIsRecordingShortcut(false);
      setTimeout(() => setShortcutSuccess(false), 2000);
    }
  }, [keyEventToShortcut, onUpdate]);

  useEffect(() => {
    if (isRecordingShortcut) {
      window.addEventListener('keydown', handleShortcutKeyDown);
      return () => window.removeEventListener('keydown', handleShortcutKeyDown);
    }
  }, [isRecordingShortcut, handleShortcutKeyDown]);

  const handleClearShortcut = async () => {
    if (window.__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('unregister_shortcut');
      } catch (e) {
        console.error('Failed to unregister shortcut:', e);
      }
    }
    onUpdate({ globalShortcut: '' });
    setShortcutError(null);
    setShortcutSuccess(false);
  };

  const handleDockToggle = async (visible: boolean) => {
    if (window.__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('set_dock_visible', { visible });
        onUpdate({ showInDock: visible });
      } catch (error) {
        console.error('Failed to set dock visibility:', error);
      }
    } else {
      onUpdate({ showInDock: visible });
    }
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <button className="settings-close" onClick={onBack}>
          <CloseIcon />
        </button>
      </header>

      <div className="settings-content">
        <div className="settings-section">
          <h3 className="settings-section-title">Appearance</h3>
          
          <div className="settings-item">
            <label className="settings-label">Theme</label>
            <div className="theme-toggle">
              <div 
                className="theme-indicator" 
                style={{ 
                  left: `calc(${THEMES.findIndex(t => t.value === settings.theme) * 100 / THEMES.length}% + 3px)`,
                  width: `calc(${100 / THEMES.length}% - 6px)`
                }} 
              />
              {THEMES.map(theme => (
                <button
                  key={theme.value}
                  className={`theme-option ${settings.theme === theme.value ? 'active' : ''}`}
                  onClick={() => onUpdate({ theme: theme.value })}
                >
                  {theme.icon}
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-row">
              <div>
                <label className="settings-label">Show Skiller in Dock</label>
                <p className="settings-description">
                  Display app icon in macOS Dock
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showInDock}
                  onChange={e => handleDockToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Quick Access</h3>
          
          <div className="settings-item">
            <label className="settings-label">Global Shortcut</label>
            <p className="settings-description">
              Press a key combination to quickly open Skiller
            </p>
            
            <div className="shortcut-input-wrapper">
              <input
                ref={shortcutInputRef}
                type="text"
                className={`settings-input shortcut-input ${isRecordingShortcut ? 'recording' : ''} ${shortcutError ? 'error' : ''} ${shortcutSuccess ? 'success' : ''}`}
                value={isRecordingShortcut ? 'Press keys...' : formatShortcutDisplay(settings.globalShortcut)}
                placeholder="Click to set shortcut"
                readOnly
                onClick={() => {
                  setIsRecordingShortcut(true);
                  setShortcutError(null);
                }}
                onBlur={() => setIsRecordingShortcut(false)}
              />
              {settings.globalShortcut && (
                <button 
                  className="shortcut-clear" 
                  onClick={handleClearShortcut}
                  title="Clear shortcut"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            
            {shortcutError && (
              <p className="settings-error">{shortcutError}</p>
            )}
            {shortcutSuccess && (
              <p className="settings-success">Shortcut registered successfully!</p>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Download & Installation</h3>
          
          <div className="settings-item">
            <label className="settings-label">Default Download Path</label>
            <p className="settings-description">
              Where to save downloaded skill files (default: system Downloads folder)
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input
                type="text"
                className="settings-input"
                style={{ flex: 1 }}
                value={settings.defaultDownloadPath}
                onChange={e => onUpdate({ defaultDownloadPath: e.target.value })}
                placeholder="System Downloads folder"
              />
              <button className="btn btn-secondary btn-sm" style={{ height: 'auto' }} onClick={handleDownloadPathSelect}>
                Browse
              </button>
            </div>
          </div>

          <div className="settings-item">
            <label className="settings-label">Default Package Manager</label>
            <p className="settings-description">
              Used when running install commands
            </p>
            <select
              className="settings-select"
              value={settings.defaultPackageManager}
              onChange={e => onUpdate({ defaultPackageManager: e.target.value as PackageManager })}
            >
              {PACKAGE_MANAGERS.map(pm => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-item">
            <label className="settings-label">Default Terminal</label>
            <p className="settings-description">
              Terminal app used for running commands
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <select
                className="settings-select"
                style={{ flex: 1 }}
                value={settings.defaultTerminal}
                onChange={e => onUpdate({ defaultTerminal: e.target.value })}
                disabled={loadingTerminals}
              >
                <option value="">System Default</option>
                {terminals.map(terminal => (
                  <option key={terminal.bundle_id} value={terminal.name}>
                    {terminal.name}
                  </option>
                ))}
              </select>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ height: 'auto' }}
                onClick={loadTerminals}
                disabled={loadingTerminals}
              >
                {loadingTerminals ? '...' : 'Refresh'}
              </button>
            </div>
            {terminals.length > 0 && (
              <p className="settings-hint">
                Found {terminals.length} terminal{terminals.length > 1 ? 's' : ''}: {terminals.map(t => t.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="settings-footer">
        <div className="settings-version">Skiller v{appVersion}</div>
        <a 
          className="settings-link" 
          href="https://claude-plugins.dev" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Powered by claude-plugins.dev
        </a>
      </footer>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l6 6M10 4l-6 6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}
