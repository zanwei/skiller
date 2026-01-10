import { useState, useRef, useEffect } from 'react';
import { Skill, Client, SkillType, PackageManager, CLIENT_LABELS } from '../types';
import './InstallMenu.css';

import ClaudeLogo from '../assets/icons/logo/claude.svg';
import ClaudeCodeLogo from '../assets/icons/logo/claude-code.svg';
import CursorLogo from '../assets/icons/logo/cursor.svg';
import VSCodeLogo from '../assets/icons/logo/vscode.svg';
import CodexLogo from '../assets/icons/logo/codex.svg';
import AmpCodeLogo from '../assets/icons/logo/amp-code.svg';
import OpenCodeLogo from '../assets/icons/logo/open-code.svg';
import GooseLogo from '../assets/icons/logo/goose.svg';
import LettaLogo from '../assets/icons/logo/letta.svg';

interface InstallMenuProps {
  skill: Skill;
  onInstall: (skill: Skill, client: Client, skillType: SkillType, packageManager: PackageManager) => void;
  disabled?: boolean;
  defaultPackageManager: PackageManager;
}

const CLIENTS: Client[] = ['claude', 'claude-code', 'cursor', 'vscode', 'codex', 'amp', 'opencode', 'goose', 'letta', 'github'];
const SKILL_TYPES: { value: SkillType; label: string }[] = [
  { value: 'personal', label: 'As Personal Skill' },
  { value: 'project', label: 'As Project Skill' },
];
const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'bun', 'pnpm', 'yarn'];

interface MenuPosition {
  top: number;
  left: number;
}

export function InstallMenu({ skill, onInstall, disabled, defaultPackageManager }: InstallMenuProps) {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedType, setSelectedType] = useState<SkillType | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 400;
    const gap = 8;
    const padding = 12;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left: number;
    let top: number;
    
    const rightSpace = viewportWidth - triggerRect.right - gap;
    const leftSpace = triggerRect.left - gap;
    
    if (rightSpace >= menuWidth + padding) {
      left = triggerRect.right + gap;
    } else if (leftSpace >= menuWidth + padding) {
      left = triggerRect.left - menuWidth - gap;
    } else {
      left = Math.max(padding, Math.min(
        triggerRect.left + triggerRect.width / 2 - menuWidth / 2,
        viewportWidth - menuWidth - padding
      ));
    }
    
    const bottomSpace = viewportHeight - triggerRect.top;
    const topSpace = triggerRect.bottom;
    
    if (bottomSpace >= menuHeight + padding) {
      top = triggerRect.top;
    } else if (topSpace >= menuHeight + padding) {
      top = triggerRect.bottom - menuHeight;
    } else {
      top = Math.max(padding, Math.min(
        triggerRect.top,
        viewportHeight - menuHeight - padding
      ));
    }
    
    top = Math.max(padding, Math.min(top, viewportHeight - menuHeight - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - menuWidth - padding));
    
    setMenuPosition({ top, left });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      calculatePosition();
    } else {
      setMenuPosition(null);
    }
  }, [open]);

  useEffect(() => {
    const scrollableParent = document.querySelector('.panel-content');
    if (!scrollableParent) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    if (open) {
      scrollableParent.classList.add('no-scroll');
      scrollableParent.addEventListener('wheel', preventScroll, { passive: false });
      scrollableParent.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      scrollableParent.classList.remove('no-scroll');
    }

    return () => {
      scrollableParent.classList.remove('no-scroll');
      scrollableParent.removeEventListener('wheel', preventScroll);
      scrollableParent.removeEventListener('touchmove', preventScroll);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    setSelectedClient(null);
    setSelectedType(null);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleTypeSelect = (type: SkillType) => {
    setSelectedType(type);
  };

  const handlePackageManagerSelect = (pm: PackageManager) => {
    if (selectedClient && selectedType) {
      onInstall(skill, selectedClient, selectedType, pm);
      closeMenu();
    }
  };

  return (
    <div className="install-menu" ref={ref}>
      <button
        ref={triggerRef}
        className="btn btn-secondary btn-sm install-menu-trigger"
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        Install to...
        <ChevronIcon />
      </button>

      {open && menuPosition && (
        <div 
          ref={dropdownRef}
          className="install-menu-dropdown"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {!selectedClient && (
            <div className="install-menu-level">
              {CLIENTS.map(client => (
                <button
                  key={client}
                  className="install-menu-item"
                  onClick={() => handleClientSelect(client)}
                >
                  <ClientIcon client={client} />
                  {CLIENT_LABELS[client]}
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
          )}

          {selectedClient && !selectedType && (
            <div className="install-menu-level">
              <button className="install-menu-back" onClick={() => setSelectedClient(null)}>
                <ChevronLeftIcon />
                <ClientIcon client={selectedClient} />
                {CLIENT_LABELS[selectedClient]}
              </button>
              {SKILL_TYPES.map(type => (
                <button
                  key={type.value}
                  className="install-menu-item"
                  onClick={() => handleTypeSelect(type.value)}
                >
                  {type.value === 'personal' ? <GlobalIcon /> : <LocalIcon />}
                  {type.label}
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
          )}

          {selectedClient && selectedType && (
            <div className="install-menu-level">
              <button className="install-menu-back" onClick={() => setSelectedType(null)}>
                <ChevronLeftIcon />
                {selectedType === 'personal' ? <GlobalIcon /> : <LocalIcon />}
                {selectedType === 'personal' ? 'Personal Skill' : 'Project Skill'}
              </button>
              {PACKAGE_MANAGERS.map(pm => (
                <button
                  key={pm}
                  className={`install-menu-item ${pm === defaultPackageManager ? 'install-menu-item-default' : ''}`}
                  onClick={() => handlePackageManagerSelect(pm)}
                >
                  <PackageManagerIcon pm={pm} />
                  {pm}
                  {pm === defaultPackageManager && <span className="install-menu-default-badge">default</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CLIENT_LOGOS: Record<Client, string | null> = {
  'claude': ClaudeLogo,
  'claude-code': ClaudeCodeLogo,
  'cursor': CursorLogo,
  'vscode': VSCodeLogo,
  'codex': CodexLogo,
  'amp': AmpCodeLogo,
  'opencode': OpenCodeLogo,
  'goose': GooseLogo,
  'letta': LettaLogo,
  'github': null,
};

function ClientIcon({ client }: { client: Client }) {
  const logoSrc = CLIENT_LOGOS[client];
  
  if (client === 'github') {
    return (
      <div className="client-icon-frame">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </div>
    );
  }
  
  if (!logoSrc) {
    return null;
  }
  
  return (
    <div className="client-icon-frame">
      <img src={logoSrc} alt={CLIENT_LABELS[client]} className="client-icon-svg" />
    </div>
  );
}

function PackageManagerIcon({ pm }: { pm: PackageManager }) {
  switch (pm) {
    case 'npm':
      return <span className="pm-icon pm-npm">N</span>;
    case 'yarn':
      return <span className="pm-icon pm-yarn">Y</span>;
    case 'pnpm':
      return <span className="pm-icon pm-pnpm">P</span>;
    case 'bun':
      return <span className="pm-icon pm-bun">B</span>;
    default:
      return null;
  }
}

function GlobalIcon() {
  return (
    <svg className="type-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}

function LocalIcon() {
  return (
    <svg className="type-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3l3 3-3 3" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 3l-3 3 3 3" />
    </svg>
  );
}
