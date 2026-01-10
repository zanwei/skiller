import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Skill } from '../types';
import { 
  fetchSkillsPaginated, 
  prefetchSkillsNextPage,
  clearSkillsCache,
  SKILL_PAGE_SIZE 
} from '../api/registry';
import { SortOption } from '../components/SortDropdown';

const SEARCH_DEBOUNCE_MS = 500;

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef(searchQuery);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadSkills(true);
  }, []);

  useEffect(() => {
    currentQueryRef.current = searchQuery;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      loadSkills(true);
    }, SEARCH_DEBOUNCE_MS);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadSkills = async (reset: boolean = false) => {
    if (loadingRef.current && !reset) return;
    
    const offset = reset ? 0 : skills.length;
    
    if (reset) {
    setLoading(true);
      setSkills([]);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    loadingRef.current = true;

    try {
      const query = currentQueryRef.current.trim() || undefined;
      const result = await fetchSkillsPaginated(offset, SKILL_PAGE_SIZE, query);
      
      if (result.items.length === 0 && result.hasMore && !reset) {
        setLoadingMore(false);
        loadingRef.current = false;
        return;
      }

      if (reset) {
        setSkills(result.items);
      } else {
        setSkills(prev => [...prev, ...result.items]);
      }
      setTotal(result.total);
      setHasMore(result.hasMore);

      if (result.hasMore) {
        const newOffset = reset ? result.items.length : offset + result.items.length;
        prefetchSkillsNextPage(newOffset, SKILL_PAGE_SIZE, query);
      }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingRef.current && !loadingMore && hasMore) {
      loadSkills(false);
    }
  }, [loadingMore, hasMore, skills.length, searchQuery]);

  const refresh = useCallback(async () => {
    clearSkillsCache();
    await loadSkills(true);
  }, [searchQuery]);

  const filteredAndSortedSkills = useMemo(() => {
    let result = tagFilter
      ? skills.filter(skill => skill.tags.includes(tagFilter))
      : [...skills];
    
    // Apply sorting
    if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'stars') {
      result.sort((a, b) => b.stars - a.stars);
    }
    // 'relevance' keeps the original order from API
    
    return result;
  }, [skills, tagFilter, sortBy]);

  const allTags = useMemo(() => 
    [...new Set(skills.flatMap(s => s.tags))].sort(),
    [skills]
  );

  return {
    skills: filteredAndSortedSkills,
    allSkills: skills,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    hasMore,
    total,
    searchQuery,
    setSearchQuery,
    tagFilter,
    setTagFilter,
    allTags,
    sortBy,
    setSortBy,
  };
}
