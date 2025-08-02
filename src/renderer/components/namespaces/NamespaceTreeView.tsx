import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespace } from '../../contexts/NamespaceContext';
import type { Namespace } from '../../../types/namespace';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  RefreshCw,
  Copy,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NamespaceTreeViewProps {
  namespaces: Namespace[];
  delimiter: string;
  onDeleteNamespace: (namespaceId: string) => Promise<void>;
  onLoadMore: (prefix: string) => Promise<void>;
  isRefreshing?: boolean;
  intendedDestination?: string | null;
}

interface TreeNode {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: TreeNode[];
  hasMore?: boolean;
  isLoading?: boolean;
}

export function NamespaceTreeView({ 
  namespaces, 
  delimiter, 
  onDeleteNamespace,
  onLoadMore,
  isRefreshing,
  intendedDestination 
}: NamespaceTreeViewProps) {
  const navigate = useNavigate();
  const { selectNamespace } = useNamespace();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [deletingNamespace, setDeletingNamespace] = useState<string | null>(null);
  const [deleteDialogNamespace, setDeleteDialogNamespace] = useState<string | null>(null);

  // Reset expanded folders when delimiter changes
  useEffect(() => {
    setExpandedFolders(new Set());
  }, [delimiter]);

  // Build tree structure from flat namespace list
  const buildTree = useCallback((namespaceList: Namespace[]): TreeNode[] => {
    const root: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    // Sort namespaces to ensure folders come before their contents
    const sorted = [...namespaceList].sort((a, b) => a.id.localeCompare(b.id));

    sorted.forEach(namespace => {
      const parts = namespace.id.split(delimiter);
      let currentPath = '';
      let parentNode: TreeNode[] = root;

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}${delimiter}${part}` : part;
        const isLast = index === parts.length - 1;

        if (!nodeMap.has(currentPath)) {
          const node: TreeNode = {
            id: currentPath,
            name: part,
            fullPath: currentPath,
            isFolder: !isLast,
            children: [],
            hasMore: !isLast // Folders might have more items to load
          };
          nodeMap.set(currentPath, node);
          parentNode.push(node);
        }

        const node = nodeMap.get(currentPath)!;
        if (!isLast) {
          parentNode = node.children;
        }
      });
    });

    return root;
  }, [delimiter]);

  const treeData = useMemo(() => buildTree(namespaces), [namespaces, buildTree]);

  const toggleFolder = async (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      
      // Check if we need to load more items for this folder
      const folderNode = findNode(treeData, folderId);
      if (folderNode?.hasMore && !loadingFolders.has(folderId)) {
        setLoadingFolders(new Set([...loadingFolders, folderId]));
        try {
          await onLoadMore(folderId);
        } finally {
          setLoadingFolders(prev => {
            const next = new Set(prev);
            next.delete(folderId);
            return next;
          });
        }
      }
    }
    
    setExpandedFolders(newExpanded);
  };

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const handleNamespaceClick = (namespace: TreeNode) => {
    if (!namespace.isFolder) {
      const ns = namespaces.find(n => n.id === namespace.id);
      if (ns) {
        selectNamespace(ns);
      }
      // If there's an intended destination, navigate there instead
      if (intendedDestination) {
        navigate(intendedDestination);
      } else {
        navigate(`/namespaces/${namespace.id}`);
      }
    }
  };

  const handleDelete = async (namespaceId: string) => {
    setDeletingNamespace(namespaceId);
    try {
      await onDeleteNamespace(namespaceId);
      setDeleteDialogNamespace(null);
    } finally {
      setDeletingNamespace(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isLoading = loadingFolders.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer group",
            !node.isFolder && "hover:bg-muted/70"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => node.isFolder ? toggleFolder(node.id) : handleNamespaceClick(node)}
        >
          {node.isFolder ? (
            <div className="h-4 w-4 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          ) : (
            <div className="w-4" />
          )}
          
          {node.isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className={cn(
            "flex-1 text-sm",
            node.isFolder ? "font-medium" : "font-mono"
          )}>
            {node.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!node.isFolder && (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleNamespaceClick(node);
                  }}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Open Namespace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(node.id);
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy {node.isFolder ? 'Prefix' : 'ID'}
              </DropdownMenuItem>
              {!node.isFolder && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogNamespace(node.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {node.isFolder && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
            {isLoading && (
              <>
                {/* Show skeleton items while loading */}
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={`skeleton-${i}`}
                    className="flex items-center gap-2 py-1.5 px-2"
                    style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                  >
                    <div className="w-4" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
                <div 
                  className="flex items-center gap-2 py-1.5 px-2 text-muted-foreground"
                  style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                >
                  <div className="w-4" />
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Loading more...</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="rounded-md border bg-card p-2">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No namespaces found.
          </div>
        ) : (
          <div className="space-y-0.5">
            {treeData.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

      {namespaces.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
          <div>
            Showing {namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}
          </div>
          <div>
            Delimiter: <span className="font-mono font-semibold">{delimiter}</span>
          </div>
        </div>
      )}

      <Dialog open={!!deleteDialogNamespace} onOpenChange={(open) => !open && setDeleteDialogNamespace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Namespace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the namespace <span className="font-mono font-semibold">{deleteDialogNamespace}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone and will permanently delete all vectors, documents, and data in this namespace.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogNamespace(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialogNamespace && handleDelete(deleteDialogNamespace)}
              disabled={!!deletingNamespace}
            >
              {deletingNamespace === deleteDialogNamespace ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Namespace'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}