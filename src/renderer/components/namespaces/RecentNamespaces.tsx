import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespace } from '../../contexts/NamespaceContext';
import type { Namespace } from '../../../types/namespace';
import { Button } from '../../../components/ui/button';
import { FolderOpen, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RecentNamespacesProps {
  className?: string;
  intendedDestination?: string | null;
}

export function RecentNamespaces({ className, intendedDestination }: RecentNamespacesProps) {
  const navigate = useNavigate();
  const { recentNamespaces, selectNamespace } = useNamespace();

  const handleNamespaceClick = (namespace: Namespace) => {
    selectNamespace(namespace);
    // If there's an intended destination, navigate there instead
    if (intendedDestination) {
      navigate(intendedDestination);
    } else {
      navigate(`/namespaces/${namespace.id}`);
    }
  };

  if (recentNamespaces.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        Recent Namespaces
      </div>
      <div className="flex flex-wrap gap-2">
        {recentNamespaces.map((namespace) => (
          <Button
            key={namespace.id}
            variant="outline"
            size="sm"
            onClick={() => handleNamespaceClick(namespace)}
            className="font-mono text-xs h-8 px-2"
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            {namespace.id}
          </Button>
        ))}
      </div>
    </div>
  );
}