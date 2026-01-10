export interface Plugin {
  id: string;
  name: string;
  description: string;
  owner: string;
  repo: string;
  downloads: number;
  stars: number;
  category?: string;
  tags: string[];
  installCommand: string;
  isInstalled?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  owner: string;
  repo: string;
  downloads: number;
  stars: number;
  tags: string[];
  installIdentifier: string;
  supportedClients: Client[];
  isInstalled?: boolean;
  rawFileUrl?: string;
}

export type Client = 
  | 'claude'
  | 'claude-code'
  | 'cursor'
  | 'vscode'
  | 'codex'
  | 'amp'
  | 'opencode'
  | 'goose'
  | 'letta'
  | 'github';

export const CLIENT_LABELS: Record<Client, string> = {
  'claude': 'Claude',
  'claude-code': 'Claude Code',
  'cursor': 'Cursor',
  'vscode': 'VS Code',
  'codex': 'Codex',
  'amp': 'Amp Code',
  'opencode': 'OpenCode',
  'goose': 'Goose',
  'letta': 'Letta',
  'github': 'GitHub',
};

export const CLIENT_LOCAL_SKILL_PATHS: Record<Client, string> = {
  'claude': '~/.claude/skills/',
  'claude-code': '.claude/skills/',
  'cursor': '.cursor/skills/',
  'vscode': '.vscode/skills/',
  'codex': '.codex/skills/',
  'amp': '.amp/skills/',
  'opencode': '.opencode/skills/',
  'goose': '.goose/skills/',
  'letta': '.letta/skills/',
  'github': '.github/skills/',
};

export const CLIENT_PERSONAL_SKILL_PATHS: Record<Client, string> = {
  'claude': '~/.claude/skills/',
  'claude-code': '~/.claude/skills/',
  'cursor': '~/.cursor/skills/',
  'vscode': '~/.vscode/skills/',
  'codex': '~/.codex/skills/',
  'amp': '~/.amp/skills/',
  'opencode': '~/.opencode/skills/',
  'goose': '~/.goose/skills/',
  'letta': '~/.letta/skills/',
  'github': '~/.github/skills/',
};

export type PackageManager = 'npm' | 'bun' | 'pnpm' | 'yarn';

export type SkillType = 'personal' | 'project';

export type Theme = 'light' | 'dark' | 'system';

export interface TerminalApp {
  name: string;
  path: string;
  bundle_id: string;
}

export interface AppSettings {
  panelHeight: number;
  defaultInstallPath: string;
  defaultDownloadPath: string;
  defaultPackageManager: PackageManager;
  defaultTerminal: string;
  theme: Theme;
  globalShortcut: string;
  showInDock: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  panelHeight: 650,
  defaultInstallPath: '',
  defaultDownloadPath: '',
  defaultPackageManager: 'npm',
  defaultTerminal: '',
  theme: 'dark',
  globalShortcut: 'Control+Alt+X',
  showInDock: false,
};

export interface InstalledItem {
  id: string;
  type: 'plugin' | 'skill';
  name: string;
  installedAt: string;
  client?: Client;
  skillType?: SkillType;
  path?: string;
}

export type TabType = 'plugins' | 'skills' | 'installed';
