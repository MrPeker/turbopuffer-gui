import React, { useState, useEffect } from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import { useNamespace } from '../../contexts/NamespaceContext';
import type { SimpleFilter } from '../../stores/documentsStore';
import { Button } from '../../../components/ui/button';
import { Clock, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RecentFilterEntry {
  id: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  description?: string;
}

interface NamespaceQueryHistoryProps {
  className?: string;
  onApplyFilters?: (searchText: string, filters: SimpleFilter[]) => void;
}

export function NamespaceQueryHistory({ className, onApplyFilters }: NamespaceQueryHistoryProps) {
  const { activeConnection } = useConnection();
  const { selectedNamespace } = useNamespace();
  const [recentQueries, setRecentQueries] = useState<RecentFilterEntry[]>([]);

  useEffect(() => {
    const loadRecentQueries = async () => {
      if (!activeConnection || !selectedNamespace) {
        setRecentQueries([]);
        return;
      }

      try {
        const history = await window.electronAPI.loadQueryHistory(
          activeConnection.id,
          selectedNamespace.id
        );
        setRecentQueries(history.recent || []);
      } catch (error) {
        console.error('Failed to load query history:', error);
        setRecentQueries([]);
      }
    };

    loadRecentQueries();
  }, [activeConnection, selectedNamespace]);

  const handleApplyQuery = (entry: RecentFilterEntry) => {
    if (onApplyFilters) {
      onApplyFilters(entry.searchText, entry.filters);
    }
  };

  if (recentQueries.length === 0 || !selectedNamespace) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        Recent Queries
      </div>
      <div className="flex flex-wrap gap-2">
        {recentQueries.slice(0, 3).map((entry) => (
          <Button
            key={entry.id}
            variant="outline"
            size="sm"
            onClick={() => handleApplyQuery(entry)}
            className="text-xs h-8 px-2 max-w-[200px]"
          >
            <Search className="h-3 w-3 mr-1" />
            <span className="truncate">
              {entry.description || `${entry.filters.length} filter${entry.filters.length !== 1 ? 's' : ''}`}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}