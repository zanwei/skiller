import { useState } from 'react';
import { TabBar } from './TabBar';
import { PluginList } from './PluginList';
import { SkillList } from './SkillList';
import { SkillDetail } from './SkillDetail';
import { InstalledList } from './InstalledList';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { SortDropdown } from './SortDropdown';
import { usePlugins } from '../hooks/usePlugins';
import { useSkills } from '../hooks/useSkills';
import { useInstalled } from '../hooks/useInstalled';
import { TabType, Skill } from '../types';
import './Panel.css';

interface PanelProps {
  onOpenSettings: () => void;
}

export function Panel({ onOpenSettings }: PanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('plugins');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  
  const {
    plugins,
    loading: pluginsLoading,
    loadingMore: pluginsLoadingMore,
    error: pluginsError,
    hasMore: pluginsHasMore,
    total: pluginsTotal,
    searchQuery: pluginSearch,
    setSearchQuery: setPluginSearch,
    categoryFilter,
    setCategoryFilter,
    categories,
    refresh: refreshPlugins,
    loadMore: loadMorePlugins,
  } = usePlugins();

  const {
    skills,
    loading: skillsLoading,
    loadingMore: skillsLoadingMore,
    error: skillsError,
    hasMore: skillsHasMore,
    total: skillsTotal,
    searchQuery: skillSearch,
    setSearchQuery: setSkillSearch,
    tagFilter,
    setTagFilter,
    allTags,
    sortBy,
    setSortBy,
    refresh: refreshSkills,
    loadMore: loadMoreSkills,
  } = useSkills();

  const {
    installed,
    loading: installedLoading,
    isInstalled,
    addInstalled,
    removeInstalled,
  } = useInstalled();

  const handleSearch = (query: string) => {
    if (activeTab === 'plugins') {
      setPluginSearch(query);
    } else if (activeTab === 'skills') {
      setSkillSearch(query);
    }
  };

  const currentSearch = activeTab === 'plugins' ? pluginSearch : skillSearch;

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
  };

  const handleBackFromDetail = () => {
    setSelectedSkill(null);
  };

  // If viewing skill detail, show detail view
  if (selectedSkill) {
    return (
      <div className="panel">
        <header className="panel-header">
          <div className="panel-title panel-title-back">
            <button className="btn btn-ghost btn-sm panel-back-btn" onClick={handleBackFromDetail} title="Back">
              <BackIcon />
            </button>
            <span>{selectedSkill.name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onOpenSettings} title="Settings">
            <SettingsIcon />
          </button>
        </header>

        <main className="panel-content">
          <SkillDetail skill={selectedSkill} onInstalled={addInstalled} />
        </main>
      </div>
    );
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <div className="panel-title">
          <img src="/logo.png" alt="Skiller" className="panel-logo-img" />
          <span>Skiller</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onOpenSettings} title="Settings">
          <SettingsIcon />
        </button>
      </header>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} installedCount={installed.length} />

      {activeTab !== 'installed' && (
        <div className="panel-filters">
          <SearchBar 
            value={currentSearch} 
            onChange={handleSearch}
            placeholder={`Search ${activeTab}...`}
          />
          {activeTab === 'plugins' && categories.length > 0 && (
            <FilterDropdown
              label="Category"
              options={categories.filter((c): c is string => !!c).map(c => ({ value: c, label: c }))}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          )}
          {activeTab === 'skills' && allTags.length > 0 && (
            <FilterDropdown
              label="Tag"
              options={allTags.map(t => ({ value: t, label: t }))}
              value={tagFilter}
              onChange={setTagFilter}
            />
          )}
          {activeTab === 'skills' && (
            <SortDropdown
              value={sortBy}
              onChange={setSortBy}
            />
          )}
        </div>
      )}

      <main className="panel-content">
        {activeTab === 'plugins' && (
          <PluginList
            plugins={plugins}
            loading={pluginsLoading}
            loadingMore={pluginsLoadingMore}
            error={pluginsError}
            hasMore={pluginsHasMore}
            total={pluginsTotal}
            isInstalled={isInstalled}
            onInstalled={addInstalled}
            onRefresh={refreshPlugins}
            onLoadMore={loadMorePlugins}
          />
        )}
        {activeTab === 'skills' && (
          <SkillList
            skills={skills}
            loading={skillsLoading}
            loadingMore={skillsLoadingMore}
            error={skillsError}
            hasMore={skillsHasMore}
            total={skillsTotal}
            isInstalled={isInstalled}
            onInstalled={addInstalled}
            onRefresh={refreshSkills}
            onLoadMore={loadMoreSkills}
            onSkillClick={handleSkillClick}
          />
        )}
        {activeTab === 'installed' && (
          <InstalledList
            installed={installed}
            loading={installedLoading}
            onRemove={removeInstalled}
          />
        )}
      </main>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
