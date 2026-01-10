import { useState, useEffect } from 'react';
import { Skill, InstalledItem, Client, SkillType, PackageManager, CLIENT_LABELS, CLIENT_LOCAL_SKILL_PATHS, CLIENT_PERSONAL_SKILL_PATHS } from '../types';
import { fetchSkillContent, getSkillInstallCommand, getSkillDownloadInfo } from '../api/registry';
import { InstallMenu } from './InstallMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { executeInTerminal } from '../utils/terminal';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../contexts/ToastContext';
import './SkillDetail.css';

interface SkillDetailProps {
  skill: Skill;
  onInstalled: (item: InstalledItem) => void;
}

interface InstallConfig {
  skill: Skill;
  client: Client;
  skillType: SkillType;
  packageManager: PackageManager;
}

export function SkillDetail({ skill, onInstalled }: SkillDetailProps) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [installConfig, setInstallConfig] = useState<InstallConfig | null>(null);
  const [installing, setInstalling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadContent() {
      if (!skill.rawFileUrl) {
        setLoading(false);
        setError('No content URL available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const markdown = await fetchSkillContent(skill.rawFileUrl);
        setContent(markdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [skill.rawFileUrl]);

  const handleCopy = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInstallToClient = (skill: Skill, client: Client, skillType: SkillType, packageManager: PackageManager) => {
    setInstallConfig({ skill, client, skillType, packageManager });
  };

  const handleConfirmInstall = async () => {
    if (!installConfig) return;
    
    const { skill: installSkill, client, skillType, packageManager } = installConfig;
    const isLocal = skillType === 'project';
    const command = getSkillInstallCommand(installSkill.installIdentifier, client, isLocal, packageManager);
    
    setInstalling(true);
    try {
      await executeInTerminal(command, settings.defaultTerminal || undefined);
      onInstalled({
        id: installSkill.id,
        type: 'skill',
        name: installSkill.name,
        installedAt: new Date().toISOString(),
        client,
        skillType,
      });
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setInstalling(false);
      setInstallConfig(null);
    }
  };

  const handleLocalInstall = () => {
    setInstallConfig({
      skill,
      client: 'claude-code',
      skillType: 'project',
      packageManager: settings.defaultPackageManager,
    });
  };

  const handleDownload = async () => {
    const downloadInfo = getSkillDownloadInfo(skill);
    if (!downloadInfo) {
      console.error('No download URL available for this skill');
      return;
    }
    
    setDownloading(true);
    try {
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const filePath = await invoke<string>('download_skill', {
          url: downloadInfo.url,
          filename: downloadInfo.filename,
          downloadPath: settings.defaultDownloadPath || null,
        });
        showToast({
          message: `Downloaded "${skill.name}" successfully`,
          filePath,
          fileName: downloadInfo.filename,
        });
      } else {
        // Web fallback: open download URL in new tab
        window.open(downloadInfo.url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="skill-detail">
      <div className="skill-detail-content">
        {/* Skill Card Info */}
        <div className="skill-detail-card">
          <div className="skill-detail-header">
            <h3 className="skill-detail-name">{skill.name}</h3>
            <div className="skill-detail-stats">
              {skill.downloads !== undefined && (
                <span className="skill-detail-stat" title="Downloads">
                  <DownloadIcon />
                  {formatNumber(skill.downloads)}
                </span>
              )}
              {skill.stars !== undefined && (
                <span className="skill-detail-stat" title="Stars">
                  <StarIcon />
                  {formatNumber(skill.stars)}
                </span>
              )}
            </div>
          </div>
          <p className="skill-detail-description">{skill.description}</p>
          {skill.tags && skill.tags.length > 0 && (
            <div className="skill-detail-tags">
              {skill.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
          <div className="skill-detail-actions">
            <div className="skill-detail-actions-left">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleLocalInstall}
              >
                Install
              </button>
              <InstallMenu
                skill={skill}
                onInstall={handleInstallToClient}
                disabled={false}
                defaultPackageManager={settings.defaultPackageManager}
              />
            </div>
            <button
              className={`btn btn-secondary btn-sm skill-download-btn ${downloading ? 'loading' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
              title="Download skill"
            >
              <span className="skill-download-btn-content">
                <SkillDownloadIcon />
                <span>Download skill</span>
              </span>
              <span className="skill-download-btn-spinner">
                <span className="spinner spinner-xs" />
              </span>
            </button>
          </div>
        </div>

        {/* Markdown Section */}
        <div className="skill-markdown-section">
          <div className="skill-markdown-header">
            <span className="skill-markdown-title">SKILL.md</span>
            <button
              className={`skill-markdown-copy ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              disabled={!content}
            >
              {copied ? (
                <>
                  <CheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="skill-detail-loading">
              <div className="spinner" />
              <span>Loading content...</span>
            </div>
          )}

          {error && !loading && (
            <div className="skill-detail-error">
              <div className="skill-detail-error-icon">⚠️</div>
              <div>{error}</div>
            </div>
          )}

          {content && !loading && (
            <div className="skill-markdown-content">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </div>

      {installConfig && (
        <ConfirmDialog
          title="Install Skill"
          message={`Install "${installConfig.skill.name}" to ${CLIENT_LABELS[installConfig.client]}?`}
          detail={
            <div className="confirm-details">
              <div className="confirm-detail">
                <span>Type:</span>
                <span>{installConfig.skillType === 'personal' ? 'Personal Skill (Global)' : 'Project Skill (Local)'}</span>
              </div>
              <div className="confirm-detail">
                <span>Install Path:</span>
                <span className="confirm-path">
                  {installConfig.skillType === 'personal' 
                    ? CLIENT_PERSONAL_SKILL_PATHS[installConfig.client]
                    : CLIENT_LOCAL_SKILL_PATHS[installConfig.client]}
                </span>
              </div>
              <div className="confirm-detail">
                <span>Package Manager:</span>
                <span>{installConfig.packageManager}</span>
              </div>
              <code className="confirm-command">
                {getSkillInstallCommand(
                  installConfig.skill.installIdentifier,
                  installConfig.client,
                  installConfig.skillType === 'project',
                  installConfig.packageManager
                )}
              </code>
            </div>
          }
          copyCommand={getSkillInstallCommand(
            installConfig.skill.installIdentifier,
            installConfig.client,
            installConfig.skillType === 'project',
            installConfig.packageManager
          )}
          confirmText={installing ? 'Installing...' : 'Install'}
          onConfirm={handleConfirmInstall}
          onCancel={() => setInstallConfig(null)}
          loading={installing}
        />
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown to HTML conversion
  const html = parseMarkdown(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic - only match explicit markdown syntax with word boundaries
  html = html.replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Process lists with proper nesting support
  html = parseListsWithNesting(html);

  // Paragraphs (double newlines)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ol>)/g, '$1');
  html = html.replace(/(<\/ol>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr>)/g, '$1');
  html = html.replace(/(<hr>)\s*<\/p>/g, '$1');

  return html;
}

function parseListsWithNesting(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a list
    const ulMatch = line.match(/^(\s*)([\*\-])\s+(.+)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    
    if (ulMatch || olMatch) {
      // Collect all consecutive list lines
      const listLines: { indent: number; type: 'ul' | 'ol'; content: string }[] = [];
      
      while (i < lines.length) {
        const currentLine = lines[i];
        const ulM = currentLine.match(/^(\s*)([\*\-])\s+(.+)$/);
        const olM = currentLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
        
        if (ulM) {
          listLines.push({
            indent: ulM[1].length,
            type: 'ul',
            content: ulM[3]
          });
          i++;
        } else if (olM) {
          listLines.push({
            indent: olM[1].length,
            type: 'ol',
            content: olM[3]
          });
          i++;
        } else if (currentLine.trim() === '') {
          // Empty line - check if next line continues the list
          const nextLine = lines[i + 1];
          if (nextLine && (nextLine.match(/^(\s*)([\*\-])\s+/) || nextLine.match(/^(\s*)(\d+)\.\s+/))) {
            i++;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      
      // Build nested list HTML
      result.push(buildNestedList(listLines));
    } else {
      result.push(line);
      i++;
    }
  }
  
  return result.join('\n');
}

function buildNestedList(items: { indent: number; type: 'ul' | 'ol'; content: string }[]): string {
  if (items.length === 0) return '';
  
  // Normalize indents: find minimum indent and use it as base
  const minIndent = Math.min(...items.map(item => item.indent));
  const normalizedItems = items.map(item => ({
    ...item,
    indent: Math.floor((item.indent - minIndent) / 2) // Convert to nesting level
  }));
  
  let html = '';
  const stack: { type: 'ul' | 'ol'; indent: number }[] = [];
  
  for (const item of normalizedItems) {
    // Close lists that are deeper than current indent
    while (stack.length > 0 && stack[stack.length - 1].indent >= item.indent) {
      const popped = stack.pop()!;
      html += `</${popped.type}>`;
    }
    
    // Open new list if needed
    if (stack.length === 0 || stack[stack.length - 1].indent < item.indent) {
      // Check if we need to open a new list
      const needNewList = stack.length === 0 || item.indent > stack[stack.length - 1].indent;
      if (needNewList) {
        html += `<${item.type}>`;
        stack.push({ type: item.type, indent: item.indent });
      }
    }
    
    html += `<li>${item.content}</li>`;
  }
  
  // Close remaining open lists
  while (stack.length > 0) {
    const popped = stack.pop()!;
    html += `</${popped.type}>`;
  }
  
  return html;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10h8" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 1l1.5 3.1 3.4.5-2.5 2.4.6 3.4L6 8.8l-3 1.6.6-3.4-2.5-2.4 3.4-.5L6 1z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SkillDownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
