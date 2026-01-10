import { useState, useEffect, useRef, useCallback } from 'react';
import { Skill, InstalledItem, Client, SkillType, PackageManager, CLIENT_LABELS, CLIENT_LOCAL_SKILL_PATHS, CLIENT_PERSONAL_SKILL_PATHS } from '../types';
import { Card } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { InstallMenu } from './InstallMenu';
import { executeInTerminal } from '../utils/terminal';
import { getSkillInstallCommand, getSkillDownloadInfo } from '../api/registry';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../contexts/ToastContext';

interface SkillListProps {
  skills: Skill[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  isInstalled: (id: string, type: 'plugin' | 'skill') => boolean;
  onInstalled: (item: InstalledItem) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onSkillClick?: (skill: Skill) => void;
}

interface InstallConfig {
  skill: Skill;
  client: Client;
  skillType: SkillType;
  packageManager: PackageManager;
}

export function SkillList({ 
  skills, 
  loading, 
  loadingMore,
  error, 
  hasMore,
  total,
  isInstalled, 
  onInstalled, 
  onRefresh,
  onLoadMore,
  onSkillClick
}: SkillListProps) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [installConfig, setInstallConfig] = useState<InstallConfig | null>(null);
  const [installing, setInstalling] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    }, { threshold: 0.1 });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, loadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleInstallToClient = (skill: Skill, client: Client, skillType: SkillType, packageManager: PackageManager) => {
    setInstallConfig({ skill, client, skillType, packageManager });
  };

  const handleConfirmInstall = async () => {
    if (!installConfig) return;
    
    const { skill, client, skillType, packageManager } = installConfig;
    const isLocal = skillType === 'project';
    const command = getSkillInstallCommand(skill.installIdentifier, client, isLocal, packageManager);
    
    setInstalling(true);
    try {
      await executeInTerminal(command, settings.defaultTerminal || undefined);
      onInstalled({
        id: skill.id,
        type: 'skill',
        name: skill.name,
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

  const handleLocalInstall = async (skill: Skill) => {
    setInstallConfig({
      skill,
      client: 'claude-code',
      skillType: 'project',
      packageManager: settings.defaultPackageManager,
    });
  };

  const handleDownload = async (skill: Skill) => {
    const downloadInfo = getSkillDownloadInfo(skill);
    if (!downloadInfo) {
      console.error('No download URL available for this skill');
      return;
    }
    
    setDownloading(skill.id);
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
      setDownloading(null);
    }
  };

  if (loading && skills.length === 0) {
    return (
      <div className="panel-loading">
        <div className="spinner" />
        <span>Loading skills...</span>
      </div>
    );
  }

  if (error && skills.length === 0) {
    return (
      <div className="panel-error">
        <div className="panel-error-message">{error}</div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          Retry
        </button>
      </div>
    );
  }

  const filteredSkills = skills.filter(skill => !isInstalled(skill.id, 'skill'));

  if (!loading && filteredSkills.length === 0 && skills.length === 0) {
    return (
      <div className="panel-empty">
        No skills found
      </div>
    );
  }

  if (!loading && filteredSkills.length === 0 && skills.length > 0) {
    return (
      <div className="panel-empty">
        <div className="panel-empty-icon">✅</div>
        <div>All skills are installed</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="panel-error-offline">
          <span>⚠️</span>
          {error}
        </div>
      )}
      
      {total > 0 && (
        <div className="list-stats">
          Showing {filteredSkills.length} of {total.toLocaleString()} skills
        </div>
      )}
      
      <div className="card-list">
        {filteredSkills.map((skill, index) => (
          <div 
            key={skill.id}
            ref={index === filteredSkills.length - 1 ? lastItemRef : null}
            onClick={() => onSkillClick?.(skill)}
            style={{ cursor: onSkillClick ? 'pointer' : 'default' }}
          >
            <Card
            name={skill.name}
            description={skill.description}
            downloads={skill.downloads}
            stars={skill.stars}
            tags={skill.tags}
            isInstalled={false}
            actions={
              <div className="skill-actions" onClick={(e) => e.stopPropagation()}>
                <div className="skill-actions-left">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleLocalInstall(skill)}
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
                  className={`btn btn-secondary btn-sm skill-download-btn ${downloading === skill.id ? 'loading' : ''}`}
                  onClick={() => handleDownload(skill)}
                  disabled={downloading === skill.id}
                  title="Download skill"
                >
                  <span className="skill-download-btn-content">
                    <DownloadIcon />
                    <span>Download skill</span>
                  </span>
                  <span className="skill-download-btn-spinner">
                    <span className="spinner spinner-xs" />
                  </span>
                </button>
              </div>
            }
          />
          </div>
        ))}
      </div>

      {loadingMore && (
        <div className="loading-more">
          <div className="spinner spinner-sm" />
          <span>Loading more...</span>
        </div>
      )}

      {!hasMore && skills.length > 0 && (
        <div className="end-of-list">
          — End of list —
        </div>
      )}

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
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
