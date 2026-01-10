# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2025-01-XX

### Security
- **Code Signing**: macOS app is now signed with Developer ID Application certificate
- Users can now install and run the app without security warnings (after first right-click "Open")
- DMG installer is also signed for secure distribution

### Changed
- Updated entitlements.plist to support Hardened Runtime
- Configured code signing in Tauri build process

## [1.0.0] - 2025-01-XX

### Added
- Initial release

## [0.1.0] - 2024-01-10

### Added
- **Plugin Management**: Browse and install Claude Code plugins from [claude-plugins.dev](https://claude-plugins.dev)
- **Skill Management**: Discover and install Agent Skills for various AI coding assistants
- **System Tray App**: Lives in your menubar for quick access
- **Theme Support**: Light, Dark, and System-following themes
- **Global Shortcut**: Customizable hotkey to instantly open Skiller (default: `Ctrl+Alt+X`)
- **Multi-Platform Support**:
  - macOS: Full support with native features (Dock visibility, multiple terminals)
  - Windows: System tray support with common terminals
  - Linux: Support for popular terminal emulators
- **10 Client Targets**: Install skills to Claude, Cursor, VS Code, and more
- **4 Package Managers**: Choose between npm, bun, pnpm, or yarn
- **Flexible Installation**: Install globally or locally to your project
- **Terminal Support**:
  - macOS: Terminal, iTerm, Warp, Alacritty, kitty, Hyper, WezTerm, Tabby, Rio, Ghostty
  - Windows: Windows Terminal, Command Prompt, PowerShell
  - Linux: GNOME Terminal, Konsole, xterm, Alacritty, kitty, Tilix
- **API Caching**: 5 minutes TTL for list data, 2 minutes for search results
- **Infinite Scroll**: Smooth pagination with preloading

### Security
- Content Security Policy (CSP) configured
- Sandboxed Tauri commands

[Unreleased]: https://github.com/skiller-dev/skiller/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/skiller-dev/skiller/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/skiller-dev/skiller/releases/tag/v1.0.0
[0.1.0]: https://github.com/skiller-dev/skiller/releases/tag/v0.1.0
