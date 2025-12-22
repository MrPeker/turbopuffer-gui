import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespacesStore } from '../../stores/namespacesStore';
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
import { formatBytes, formatNumber, formatDate } from '../../utils/formatBytes';

interface NamespaceTreeViewProps {
  namespaces: Namespace[];
  delimiter: string;
  connectionId: string;
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
  connectionId,
  isRefreshing,
  intendedDestination
}: NamespaceTreeViewProps) {
  const navigate = useNavigate();

  // Zustand store
  const {
    expandedFolders,
    loadingFolders,
    deletingNamespace,
    deleteDialogNamespace,
    expandFolder,
    collapseFolder,
    addLoadingFolder,
    removeLoadingFolder,
    loadMoreForPrefix,
    setDeleteDialogNamespace,
    deleteNamespace,
    resetExpandedFolders,
    fetchMetadataForNamespace,
    getNamespaceMetadata,
    isMetadataLoading,
  } = useNamespacesStore();

  // Debounced metadata fetch on hover (200ms delay to avoid scroll jank)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeHover = useCallback((namespaceId: string, isFolder: boolean) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (!isFolder) {
      hoverTimeoutRef.current = setTimeout(() => {
        fetchMetadataForNamespace(namespaceId);
      }, 200);
    }
  }, [fetchMetadataForNamespace]);

  const handleNodeLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  // Reset expanded folders when delimiter changes
  useEffect(() => {
    resetExpandedFolders();
  }, [delimiter, resetExpandedFolders]);

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
    if (expandedFolders.has(folderId)) {
      collapseFolder(folderId);
    } else {
      expandFolder(folderId);

      // Check if we need to load more items for this folder
      const folderNode = findNode(treeData, folderId);
      if (folderNode?.hasMore && !loadingFolders.has(folderId)) {
        addLoadingFolder(folderId);
        try {
          await loadMoreForPrefix(folderId);
        } finally {
          removeLoadingFolder(folderId);
        }
      }

      // Auto-expand single-child folders recursively (non-blocking)
      autoExpandSingleChildren(folderId);
    }
  };

  const autoExpandSingleChildren = async (folderId: string) => {
    // Small delay to let UI update
    await new Promise(resolve => setTimeout(resolve, 150));

    const folderNode = findNode(treeData, folderId);
    if (!folderNode ||
        folderNode.children.length !== 1 ||
        !folderNode.children[0].isFolder) {
      return;
    }

    const childFolder = folderNode.children[0];

    // Expand the child folder
    expandFolder(childFolder.id);

    // Load more for child if needed
    if (childFolder.hasMore && !loadingFolders.has(childFolder.id)) {
      addLoadingFolder(childFolder.id);
      try {
        await loadMoreForPrefix(childFolder.id);
      } finally {
        removeLoadingFolder(childFolder.id);
      }
    }

    // Continue recursively
    autoExpandSingleChildren(childFolder.id);
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
      // If there's an intended destination, navigate there instead
      if (intendedDestination) {
        navigate(intendedDestination);
      } else {
        navigate(`/connections/${connectionId}/namespaces/${namespace.id}/documents`);
      }
    }
  };

  const handleDelete = async (namespaceId: string) => {
    try {
      await deleteNamespace(namespaceId);
    } catch (error) {
      console.error('Failed to delete namespace:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isLoading = loadingFolders.has(node.id);
    const metadata = !node.isFolder ? getNamespaceMetadata(node.id) : undefined;
    const metadataLoading = !node.isFolder && isMetadataLoading(node.id);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer group",
            !node.isFolder && "hover:bg-muted/70"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => node.isFolder ? toggleFolder(node.id) : handleNamespaceClick(node)}
          onMouseEnter={() => handleNodeHover(node.id, node.isFolder)}
          onMouseLeave={handleNodeLeave}
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
            "text-sm min-w-0",
            node.isFolder ? "font-medium flex-1" : "font-mono"
          )}>
            {node.name}
          </span>

          {/* Metadata display for leaf nodes */}
          {!node.isFolder && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-2">
              {metadataLoading ? (
                <>
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </>
              ) : metadata ? (
                <>
                  <span className="tabular-nums" title="Row count">
                    {formatNumber(metadata.approx_row_count)} rows
                  </span>
                  <span className="tabular-nums" title="Size">
                    {formatBytes(metadata.approx_logical_bytes)}
                  </span>
                </>
              ) : null}
            </div>
          )}

          <div className="flex-1" />

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