import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespacesStore } from '../../stores/namespacesStore';
import type { Namespace } from '../../../types/namespace';
import { Badge } from '../../../components/ui/badge';
import { FolderOpen } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RecentNamespacesProps {
  className?: string;
  connectionId: string;
  intendedDestination?: string | null;
}

export function RecentNamespaces({ className, connectionId, intendedDestination }: RecentNamespacesProps) {
  const navigate = useNavigate();

  // Zustand store
  const {
    recentNamespaces,
    addRecentNamespace,
    loadRecentNamespaces,
  } = useNamespacesStore();

  // Load recent namespaces for current connection on mount
  useEffect(() => {
    if (connectionId) {
      loadRecentNamespaces(connectionId);
    }
  }, [connectionId, loadRecentNamespaces]);

  const handleNamespaceClick = (namespace: Namespace) => {
    // Add to recent namespaces
    addRecentNamespace(connectionId, namespace);

    // If there's an intended destination, navigate there instead
    if (intendedDestination) {
      navigate(intendedDestination);
    } else {
      navigate(`/connections/${connectionId}/namespaces/${namespace.id}/documents`);
    }
  };

  if (recentNamespaces.length === 0) {
    return null;
  }

  return (
    <div className={cn("px-3 py-2 border-b border-tp-border-subtle bg-tp-surface/50 flex items-center gap-2", className)}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-tp-text-muted flex-shrink-0">
        recent
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {recentNamespaces.slice(0, 6).map((namespace) => (
          <button
            key={namespace.id}
            onClick={() => handleNamespaceClick(namespace)}
            className="flex items-center gap-1 px-2 py-1 bg-tp-surface border border-tp-border-subtle hover:border-tp-accent/50 hover:bg-tp-surface-alt transition-colors cursor-pointer"
          >
            <FolderOpen className="h-3 w-3 text-tp-accent/70 flex-shrink-0" />
            <span className="font-mono text-[11px] text-tp-text whitespace-nowrap">{namespace.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}