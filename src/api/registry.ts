import { Plugin, Skill, Client } from '../types';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { 
  apiCache, 
  searchCache, 
  scrollRateLimiter,
  requestDeduplicator,
  apiConcurrencyLimiter,
  withTimeout,
  requestCounter
} from './cache';

const API_BASE = 'https://claude-plugins.dev';

export const PLUGIN_PAGE_SIZE = 20;
export const SKILL_PAGE_SIZE = 20;

const API_TIMEOUT_MS = 15000;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  await apiConcurrencyLimiter.acquire();
  
  try {
    const fetchPromise = (async () => {
      if (isTauri) {
        try {
          return await tauriFetch(url, options);
        } catch (e) {
          console.warn('Tauri fetch failed, trying browser fetch:', e);
        }
      }
      return fetch(url, options);
    })();
    
    return await withTimeout(fetchPromise, API_TIMEOUT_MS, `Request to ${url} timed out`);
  } finally {
    apiConcurrencyLimiter.release();
  }
};

function parsePlugin(data: any): Plugin {
  const namespace = data.namespace || '';
  const nameParts = namespace.replace('@', '').split('/');
  const owner = nameParts[0] || data.owner || '';
  const repo = nameParts[1] || data.repo || '';
  
  return {
    id: data.id || `${owner}/${repo}/${data.name}`,
    name: data.name || 'Unknown',
    description: data.description || '',
    owner: owner,
    repo: repo,
    downloads: data.downloads || 0,
    stars: data.stars || 0,
    category: data.category || data.tags?.[0] || 'other',
    tags: data.keywords || data.tags || [],
    installCommand: `npx claude-plugins install ${namespace}/${data.name}`,
  };
}

function parseSkill(data: any): Skill {
  const namespace = data.namespace || '';
  const nameParts = namespace.replace('@', '').split('/');
  const owner = data.author || nameParts[0] || data.owner || '';
  const repo = nameParts[1] || data.repo || '';
  
  return {
    id: data.id || `${owner}/${repo}/${data.name}`,
    name: data.name || 'Unknown',
    description: data.description || '',
    owner: owner,
    repo: repo,
    downloads: data.installs || data.downloads || 0,
    stars: data.stars || 0,
    tags: data.keywords || data.tags || [],
    installIdentifier: namespace || `@${owner}/${repo}/${data.name}`,
    supportedClients: ['claude-code', 'cursor', 'vscode', 'codex', 'amp', 'opencode', 'goose', 'letta', 'github'],
    rawFileUrl: data.metadata?.rawFileUrl || undefined,
  };
}

export async function fetchPluginsPaginated(
  offset: number = 0,
  limit: number = PLUGIN_PAGE_SIZE,
  query?: string
): Promise<PaginatedResponse<Plugin>> {
  const cache = query ? searchCache : apiCache;
  const cacheKey = cache.generateKey('plugins', { offset, limit, q: query || '' });
  
  const cached = cache.get<PaginatedResponse<Plugin>>(cacheKey);
  if (cached) {
    console.debug('Cache hit for plugins:', cacheKey);
    return cached;
  }

  if (offset > 0 && !query) {
    const rateLimitKey = 'plugins-scroll';
    if (!scrollRateLimiter.canRequest(rateLimitKey)) {
      console.debug('Rate limited, returning empty for now');
      return { items: [], total: 0, hasMore: true };
    }
    scrollRateLimiter.recordRequest(rateLimitKey);
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      let url = `${API_BASE}/api/plugins?limit=${limit}&offset=${offset}`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }
      
      const response = await safeFetch(url);
      requestCounter.record('plugins', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const plugins = (data.plugins || data || []).map(parsePlugin);
      const total = data.total || 0;
      
      const result: PaginatedResponse<Plugin> = {
        items: plugins,
        total,
        hasMore: offset + plugins.length < total,
      };

      cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      requestCounter.record('plugins', false);
      console.error('Failed to fetch plugins from API:', error);
      if (offset === 0 && !query) {
        return {
          items: getMockPlugins(),
          total: getMockPlugins().length,
          hasMore: false,
        };
      }
      return { items: [], total: 0, hasMore: false };
    }
  });
}

export async function fetchSkillsPaginated(
  offset: number = 0,
  limit: number = SKILL_PAGE_SIZE,
  query?: string
): Promise<PaginatedResponse<Skill>> {
  const cache = query ? searchCache : apiCache;
  const cacheKey = cache.generateKey('skills', { offset, limit, q: query || '' });
  
  const cached = cache.get<PaginatedResponse<Skill>>(cacheKey);
  if (cached) {
    console.debug('Cache hit for skills:', cacheKey);
    return cached;
  }

  if (offset > 0 && !query) {
    const rateLimitKey = 'skills-scroll';
    if (!scrollRateLimiter.canRequest(rateLimitKey)) {
      console.debug('Rate limited, returning empty for now');
      return { items: [], total: 0, hasMore: true };
    }
    scrollRateLimiter.recordRequest(rateLimitKey);
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      let url = `${API_BASE}/api/skills?limit=${limit}&offset=${offset}`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }
      
      const response = await safeFetch(url);
      requestCounter.record('skills', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const skills = (data.skills || data || []).map(parseSkill);
      const total = data.total || 0;
      
      const result: PaginatedResponse<Skill> = {
        items: skills,
        total,
        hasMore: offset + skills.length < total,
      };

      cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      requestCounter.record('skills', false);
      console.error('Failed to fetch skills from API:', error);
      if (offset === 0 && !query) {
        return {
          items: getMockSkills(),
          total: getMockSkills().length,
          hasMore: false,
        };
      }
      return { items: [], total: 0, hasMore: false };
    }
  });
}

export async function prefetchPluginsNextPage(
  currentOffset: number,
  limit: number = PLUGIN_PAGE_SIZE,
  query?: string
): Promise<void> {
  const nextOffset = currentOffset + limit;
  const cache = query ? searchCache : apiCache;
  const cacheKey = cache.generateKey('plugins', { offset: nextOffset, limit, q: query || '' });
  
  if (!cache.has(cacheKey)) {
    setTimeout(() => {
      fetchPluginsPaginated(nextOffset, limit, query).catch(() => {});
    }, 100);
  }
}

export async function prefetchSkillsNextPage(
  currentOffset: number,
  limit: number = SKILL_PAGE_SIZE,
  query?: string
): Promise<void> {
  const nextOffset = currentOffset + limit;
  const cache = query ? searchCache : apiCache;
  const cacheKey = cache.generateKey('skills', { offset: nextOffset, limit, q: query || '' });
  
  if (!cache.has(cacheKey)) {
    setTimeout(() => {
      fetchSkillsPaginated(nextOffset, limit, query).catch(() => {});
    }, 100);
  }
}

export function clearPluginsCache(): void {
  apiCache.invalidatePattern('plugins');
  searchCache.invalidatePattern('plugins');
}

export function clearSkillsCache(): void {
  apiCache.invalidatePattern('skills');
  searchCache.invalidatePattern('skills');
}

export function getAPIStats() {
  return {
    cache: {
      api: apiCache.getStats(),
      search: searchCache.getStats(),
    },
    requests: requestCounter.getStats(),
    concurrency: apiConcurrencyLimiter.getStats(),
  };
}

export async function fetchPlugins(): Promise<Plugin[]> {
  const result = await fetchPluginsPaginated(0, 100);
  return result.items;
}

export async function fetchSkills(): Promise<Skill[]> {
  const result = await fetchSkillsPaginated(0, 100);
  return result.items;
}

export async function searchPlugins(query: string): Promise<Plugin[]> {
  const result = await fetchPluginsPaginated(0, 100, query);
  return result.items;
  }

export async function searchSkills(query: string): Promise<Skill[]> {
  const result = await fetchSkillsPaginated(0, 100, query);
  return result.items;
}

export function getSkillInstallCommand(
  identifier: string,
  client: Client,
  isLocal: boolean,
  packageManager: string = 'npx'
): string {
  const localFlag = isLocal ? ' --local' : '';
  const clientFlag = client !== 'claude-code' ? ` --client ${client}` : '';
  
  if (packageManager === 'npx') {
    return `npx skills-installer install ${identifier}${clientFlag}${localFlag}`;
  }
  
  const runCmd = packageManager === 'bun' ? 'bunx' : 
                 packageManager === 'pnpm' ? 'pnpm dlx' : 
                 packageManager === 'yarn' ? 'yarn dlx' : 'npx';
  
  return `${runCmd} skills-installer install ${identifier}${clientFlag}${localFlag}`;
}

function getMockPlugins(): Plugin[] {
  return [
    {
      id: 'c761e569-b7fb-4463-b5a4-b5f7f579680a',
      name: 'frontend-design',
      description: 'Create distinctive, production-grade frontend interfaces with high design quality.',
      owner: 'anthropics',
      repo: 'claude-code-plugins',
      downloads: 2791,
      stars: 53917,
      category: 'development',
      tags: [],
      installCommand: 'npx claude-plugins install @anthropics/claude-code-plugins/frontend-design',
    },
    {
      id: 'b050a15f-4682-41c5-aa6f-b0e555896a12',
      name: 'compounding-engineering',
      description: 'AI-powered development tools that get smarter with every use.',
      owner: 'EveryInc',
      repo: 'every-marketplace',
      downloads: 1396,
      stars: 2354,
      category: 'ai-powered',
      tags: ['ai-powered', 'workflow-automation'],
      installCommand: 'npx claude-plugins install @EveryInc/every-marketplace/compounding-engineering',
    },
    {
      id: 'c07e9b41-81e5-4999-9460-6d4a34f19491',
      name: 'feature-dev',
      description: 'Comprehensive feature development workflow with specialized agents.',
      owner: 'anthropics',
      repo: 'claude-code-plugins',
      downloads: 1377,
      stars: 53917,
      category: 'development',
      tags: [],
      installCommand: 'npx claude-plugins install @anthropics/claude-code-plugins/feature-dev',
    },
  ];
}

function getMockSkills(): Skill[] {
  return [
    {
      id: '4c08e453-73f3-4c10-9dbc-2174ed8e3f11',
      name: 'frontend-design',
      description: 'Create distinctive, production-grade frontend interfaces with high design quality.',
      owner: 'anthropics',
      repo: 'claude-code',
      downloads: 8702,
      stars: 52420,
      tags: [],
      installIdentifier: '@anthropics/claude-code/frontend-design',
      supportedClients: ['claude-code', 'cursor', 'vscode', 'codex', 'amp', 'opencode', 'goose', 'letta', 'github'],
      rawFileUrl: 'https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md',
    },
    {
      id: '7ddc88c4-47d8-4cc2-9263-94f08dced4f8',
      name: 'prompt-engineering-patterns',
      description: 'Master advanced prompt engineering techniques to maximize LLM performance.',
      owner: 'wshobson',
      repo: 'agents',
      downloads: 886,
      stars: 20969,
      tags: [],
      installIdentifier: '@wshobson/agents/prompt-engineering-patterns',
      supportedClients: ['claude-code', 'cursor', 'vscode', 'codex', 'amp', 'opencode', 'goose', 'letta', 'github'],
      rawFileUrl: 'https://raw.githubusercontent.com/wshobson/agents/main/skills/prompt-engineering-patterns/SKILL.md',
    },
    {
      id: 'a1299c1e-12ab-44af-a931-d7fa0254de10',
      name: 'brainstorming',
      description: 'You MUST use this before any creative work - creating features, building components.',
      owner: 'obra',
      repo: 'superpowers',
      downloads: 825,
      stars: 14889,
      tags: [],
      installIdentifier: '@obra/superpowers/brainstorming',
      supportedClients: ['claude-code', 'cursor', 'vscode', 'codex', 'amp', 'opencode', 'goose', 'letta', 'github'],
      rawFileUrl: 'https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md',
    },
  ];
}

export async function fetchSkillContent(rawFileUrl: string): Promise<string> {
  const cacheKey = apiCache.generateKey('skill-content', { url: rawFileUrl });
  
  const cached = apiCache.get<string>(cacheKey);
  if (cached) {
    console.debug('Cache hit for skill content:', cacheKey);
    return cached;
  }

  return requestDeduplicator.dedupe(cacheKey, async () => {
    try {
      const response = await safeFetch(rawFileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      apiCache.set(cacheKey, content);
      
      return content;
    } catch (error) {
      console.error('Failed to fetch skill content:', error);
      throw error;
    }
  });
}

export function getSkillDownloadInfo(skill: Skill): { url: string; filename: string } | null {
  // Use rawFileUrl to get the SKILL.md download URL
  if (!skill.rawFileUrl) {
    return null;
  }
  
  // rawFileUrl format: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}/SKILL.md
  // We can directly use this URL to download the SKILL.md file
  const filename = `${skill.name}.md`;
  
  return {
    url: skill.rawFileUrl,
    filename,
  };
}
