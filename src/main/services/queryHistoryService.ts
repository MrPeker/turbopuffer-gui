import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SimpleFilter {
  id: string;
  attribute: string;
  operator: string;
  value: any;
  displayValue: string;
}

interface FilterHistoryEntry {
  id: string;
  name: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  appliedCount: number;
  description?: string;
}

interface RecentFilterEntry {
  id: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  description?: string;
}

interface QueryHistory {
  saved: FilterHistoryEntry[];
  recent: RecentFilterEntry[];
}

export class QueryHistoryService {
  private static instance: QueryHistoryService;
  private historyDir: string;
  private cache: Map<string, QueryHistory> = new Map();

  private constructor() {
    const userDataPath = app.getPath('userData');
    this.historyDir = path.join(userDataPath, 'query-history');
    this.ensureHistoryDir();
  }

  static getInstance(): QueryHistoryService {
    if (!QueryHistoryService.instance) {
      QueryHistoryService.instance = new QueryHistoryService();
    }
    return QueryHistoryService.instance;
  }

  private async ensureHistoryDir(): Promise<void> {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create query history directory:', error);
    }
  }

  private getHistoryFilePath(connectionId: string, namespaceId: string): string {
    // Create a safe filename from connection and namespace IDs
    const safeConnectionId = connectionId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeNamespaceId = namespaceId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.historyDir, `${safeConnectionId}__${safeNamespaceId}.json`);
  }

  private getCacheKey(connectionId: string, namespaceId: string): string {
    return `${connectionId}::${namespaceId}`;
  }

  async loadQueryHistory(connectionId: string, namespaceId: string): Promise<QueryHistory> {
    const cacheKey = this.getCacheKey(connectionId, namespaceId);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const filePath = this.getHistoryFilePath(connectionId, namespaceId);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const history = JSON.parse(data) as QueryHistory;
      
      // Ensure structure
      if (!history.saved) history.saved = [];
      if (!history.recent) history.recent = [];
      
      // Cache the result
      this.cache.set(cacheKey, history);
      return history;
    } catch (error) {
      // If file doesn't exist or is invalid, return empty history
      const emptyHistory: QueryHistory = {
        saved: [],
        recent: []
      };
      this.cache.set(cacheKey, emptyHistory);
      return emptyHistory;
    }
  }

  async saveQueryHistory(connectionId: string, namespaceId: string, history: QueryHistory): Promise<void> {
    const filePath = this.getHistoryFilePath(connectionId, namespaceId);
    const cacheKey = this.getCacheKey(connectionId, namespaceId);
    
    try {
      // Limit the number of entries to prevent unbounded growth
      const limitedHistory: QueryHistory = {
        saved: history.saved.slice(0, 50), // Keep last 50 saved filters
        recent: history.recent.slice(0, 30) // Keep last 30 recent filters
      };
      
      await fs.writeFile(
        filePath, 
        JSON.stringify(limitedHistory, null, 2), 
        'utf-8'
      );
      
      // Update cache
      this.cache.set(cacheKey, limitedHistory);
    } catch (error) {
      console.error('Failed to save query history:', error);
      throw new Error(`Failed to save query history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addSavedFilter(
    connectionId: string, 
    namespaceId: string, 
    entry: FilterHistoryEntry
  ): Promise<void> {
    const history = await this.loadQueryHistory(connectionId, namespaceId);
    
    // Add to beginning of saved filters
    history.saved.unshift(entry);
    
    // Remove duplicates by name (keep the newest)
    const seen = new Set<string>();
    history.saved = history.saved.filter(item => {
      if (seen.has(item.name)) {
        return false;
      }
      seen.add(item.name);
      return true;
    });
    
    await this.saveQueryHistory(connectionId, namespaceId, history);
  }

  async addRecentFilter(
    connectionId: string, 
    namespaceId: string, 
    entry: RecentFilterEntry
  ): Promise<void> {
    const history = await this.loadQueryHistory(connectionId, namespaceId);
    
    // Add to beginning of recent filters
    history.recent.unshift(entry);
    
    // Remove exact duplicates (same filters and search text)
    const seen = new Set<string>();
    history.recent = history.recent.filter(item => {
      const key = JSON.stringify({
        searchText: item.searchText,
        filters: item.filters.map(f => ({
          attribute: f.attribute,
          operator: f.operator,
          value: f.value
        }))
      });
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    await this.saveQueryHistory(connectionId, namespaceId, history);
  }

  async updateSavedFilterCount(
    connectionId: string, 
    namespaceId: string, 
    filterId: string
  ): Promise<void> {
    const history = await this.loadQueryHistory(connectionId, namespaceId);
    
    const filter = history.saved.find(f => f.id === filterId);
    if (filter) {
      filter.appliedCount++;
      await this.saveQueryHistory(connectionId, namespaceId, history);
    }
  }

  async deleteSavedFilter(
    connectionId: string, 
    namespaceId: string, 
    filterId: string
  ): Promise<void> {
    const history = await this.loadQueryHistory(connectionId, namespaceId);
    
    history.saved = history.saved.filter(f => f.id !== filterId);
    
    await this.saveQueryHistory(connectionId, namespaceId, history);
  }

  async clearRecentFilters(connectionId: string, namespaceId: string): Promise<void> {
    const history = await this.loadQueryHistory(connectionId, namespaceId);
    
    history.recent = [];
    
    await this.saveQueryHistory(connectionId, namespaceId, history);
  }

  async deleteAllHistory(connectionId: string, namespaceId: string): Promise<void> {
    const filePath = this.getHistoryFilePath(connectionId, namespaceId);
    const cacheKey = this.getCacheKey(connectionId, namespaceId);
    
    try {
      await fs.unlink(filePath);
      this.cache.delete(cacheKey);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}