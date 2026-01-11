<div align="center">
  
# Introducing Skiller

![preview](https://github.com/user-attachments/assets/394f6263-0c80-48e1-9c3e-ac40f5402725)


**A lightweight desktop menubar app for browsing and installing Claude Code plugins and Agent Skills**

[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

https://github.com/user-attachments/assets/1f69740f-5fff-4994-9f07-2d86f71ac831

</div>

---

## Features

### Plugin & Skill Management
- **Browse Plugins**: Explore Claude Code plugins from [claude-plugins.dev](https://claude-plugins.dev)
- **Browse Skills**: Discover Agent Skills for various AI coding assistants
- **One-Click Install**: Install directly to your preferred terminal
- **Track Installations**: Keep track of what you've installed

### Modern Interface
- **System Tray App**: Lives in your menubar for quick access
- **Theme Support**: Light, Dark, and System-following themes
- **Global Shortcut**: Customize a hotkey to instantly open Skiller
- **Infinite Scroll**: Smooth pagination with preloading

### Flexible Installation
- **10 Client Targets**: Install skills to Claude, Cursor, VS Code, and more
- **4 Package Managers**: Choose between npm, bun, pnpm, or yarn
- **Personal or Project**: Install globally or locally to your project

---

## 📸 Screenshots

| Plugins Tab | Skills Tab | Settings |
|:-----------:|:----------:|:--------:|
| Browse & install plugins | Multi-step skill installation | Customize your experience |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later
- [Rust](https://www.rust-lang.org/tools/install) 1.70 or later
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/skiller.git
cd skiller

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## Usage

### Opening Skiller

1. **Click the tray icon** in your menubar (macOS) or system tray (Windows/Linux)
2. **Use the global shortcut** (default: `Ctrl+Alt+X`, customizable in Settings)

### Installing a Plugin

1. Navigate to the **Plugins** tab
2. Browse or search for a plugin
3. Click **Install** on the plugin card
4. Confirm the installation in the dialog
5. The install command runs in your default terminal

### Installing a Skill

**Quick Install:**
1. Navigate to the **Skills** tab
2. Click **Install** for a global installation

**Custom Install:**
1. Click **Install to...** for more options
2. Select your target client (Claude Code, Cursor, VS Code, etc.)
3. Choose installation type (Personal or Project)
4. Pick your package manager
5. The command executes in your selected terminal

### Configuration

Open **Settings** (gear icon) to customize:

| Setting | Description |
|---------|-------------|
| **Theme** | Light, Dark, or follow system preference |
| **Show in Dock** | Toggle Dock icon visibility (macOS only) |
| **Global Shortcut** | Set a custom keyboard shortcut |
| **Default Install Path** | Default directory for project installations |
| **Default Package Manager** | Your preferred package manager |
| **Default Terminal** | Choose from detected terminal applications |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│          Skiller App                │
│  ┌─────────────┬─────────────────┐  │
│  │ React UI    │  Tauri Backend  │  │
│  │ (TypeScript)│  (Rust)         │  │
│  └─────────────┴─────────────────┘  │
└─────────────────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ claude-plugins  │  │ System Terminal │
│ .dev API        │  │ (CLI execution) │
└─────────────────┘  └─────────────────┘
```

### Project Structure

```
skiller/
├── .github/                  # GitHub configuration
│   ├── workflows/            # CI/CD workflows
│   └── ISSUE_TEMPLATE/       # Issue templates
├── src/                      # React frontend
│   ├── api/                  # API & caching layer
│   ├── assets/               # Static assets (icons, images)
│   ├── components/           # UI components
│   ├── hooks/                # React hooks
│   ├── styles/               # CSS styles
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── src-tauri/                # Rust backend
│   ├── icons/                # App icons
│   ├── src/
│   │   ├── lib.rs            # Main entry & tray logic
│   │   └── commands.rs       # Tauri commands
│   └── tauri.conf.json       # Tauri configuration
├── public/                   # Public assets
├── package.json
├── vite.config.ts
├── LICENSE                   # MIT License
├── CONTRIBUTING.md           # Contribution guidelines
└── CHANGELOG.md              # Version history
```

---

## Supported Clients

Skiller supports installing skills to the following AI coding assistants:

| Client | Description |
|--------|-------------|
| **Claude** | Anthropic's Claude Desktop app |
| **Claude Code** | Claude's coding-focused interface |
| **Cursor** | AI-powered code editor |
| **VS Code** | Visual Studio Code with AI extensions |
| **Codex** | OpenAI Codex integration |
| **Amp Code** | Amp's AI coding assistant |
| **OpenCode** | Open-source AI coding platform |
| **Goose** | Block's AI agent platform |
| **Letta** | Memory-focused AI platform |
| **GitHub** | GitHub Copilot integration |

---

## Supported Terminals

### macOS
- Terminal (default)
- iTerm
- Warp
- Alacritty
- kitty
- Hyper
- WezTerm
- Tabby
- Rio
- Ghostty

### Windows
- Windows Terminal
- Command Prompt
- PowerShell

### Linux
- GNOME Terminal
- Konsole
- xterm
- Alacritty
- kitty
- Tilix

---

## Permissions

Skiller requires certain permissions to function:

### macOS
- **Accessibility** (optional): For terminals that require System Events automation
- **Automation**: To control terminal applications via AppleScript

### How to Grant Permissions

1. Go to **System Settings** → **Privacy & Security**
2. Navigate to **Automation**
3. Allow Skiller to control your terminal application

---

## Development

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Rust, Tauri 2.x
- **Styling**: CSS with CSS Variables for theming
- **State**: React Hooks + Tauri Store

### Key Dependencies

**Frontend:**
- `@tauri-apps/api` - Tauri frontend API
- `@tauri-apps/plugin-dialog` - File dialogs
- `@tauri-apps/plugin-http` - HTTP requests (bypasses CORS)
- `@tauri-apps/plugin-shell` - Shell command execution
- `@tauri-apps/plugin-store` - Persistent storage

**Backend (Rust):**
- `tauri` - Core framework with tray support
- `tauri-plugin-global-shortcut` - Global hotkey registration
- `cocoa` / `objc` - macOS native APIs

### Building from Source

```bash
# Development mode with hot reload
npm run tauri dev

# Production build (on your current platform)
npm run tauri build

# The built app will be in:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/deb/
```

### Building for Windows

**Option 1: Build on Windows machine**

```powershell
# Using PowerShell script
.\scripts\build-windows.ps1

# Or using CMD batch file
.\scripts\build-windows.bat
```

**Option 2: GitHub Actions (Automated)**

Push a version tag to trigger automated builds for all platforms:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow will automatically create installers for Windows, macOS, and Linux.

---

## API Reference

Skiller fetches data from [claude-plugins.dev](https://claude-plugins.dev):

| Endpoint | Description |
|----------|-------------|
| `GET /api/plugins` | List plugins with pagination |
| `GET /api/skills` | List skills with pagination |

### Query Parameters

- `limit` - Number of items per page (default: 20)
- `offset` - Pagination offset
- `q` - Search query

### Caching

- **API Cache**: 5 minutes TTL for list data
- **Search Cache**: 2 minutes TTL for search results
- **Rate Limiting**: 500ms minimum interval for scroll requests

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [claude-plugins.dev](https://claude-plugins.dev) for the plugin/skill registry
- [Tauri](https://tauri.app/) for the amazing desktop framework
- [Anthropic](https://anthropic.com/) for Claude

---

<div align="center">

**Made with ❤️ for the Claude community**

</div>
