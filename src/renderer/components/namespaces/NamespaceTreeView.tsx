import React, { useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespacesStore } from '../../stores/namespacesStore';
import type { NamespaceWithRegion } from '../../../types/connection';
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
import { formatBytes, formatNumber } from '../../utils/formatBytes';

interface NamespaceTreeViewProps {
  namespaces: NamespaceWithRegion[];
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
  regionId?: string;
}

interface TreeNodeRowProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  isLoading: boolean;
  onToggleFolder: (folderId: string) => void;
  onNamespaceClick: (node: TreeNode) => void;
  onNodeHover: (namespaceId: string, isFolder: boolean, regionId?: string) => void;
  onNodeLeave: () => void;
  onCopy: (text: string) => void;
  onDelete: (namespaceId: string) => void;
}

/**
 * Memoized tree node component that subscribes only to its own metadata.
 * This prevents re-rendering all nodes when one node's metadata loads.
 */
const TreeNodeRow = memo(function TreeNodeRow({
  node,
  level,
  isExpanded,
  isLoading,
  onToggleFolder,
  onNamespaceClick,
  onNodeHover,
  onNodeLeave,
  onCopy,
  onDelete,
}: TreeNodeRowProps) {
  // Subscribe to ONLY this node's metadata using a granular selector (only for leaf nodes)
  const cacheKey = node.regionId ? `${node.id}:${node.regionId}` : node.id;

  const metadata = useNamespacesStore((state) => {
    if (node.isFolder) return undefined;
    const cached = state.metadataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.metadata;
    }
    return undefined;
  });

  const metadataLoading = useNamespacesStore((state) => {
    if (node.isFolder) return false;
    return state.metadataLoading.has(cacheKey);
  });

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer group",
        !node.isFolder && "hover:bg-muted/70"
      )}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onClick={() => node.isFolder ? onToggleFolder(node.id) : onNamespaceClick(node)}
      onMouseEnter={() => onNodeHover(node.id, node.isFolder, node.regionId)}
      onMouseLeave={onNodeLeave}
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
                onNamespaceClick(node);
              }}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Open Namespace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onCopy(node.id);
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
                  onDelete(node.id);
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
  );
});

interface TreeNodeContainerProps {
  node: TreeNode;
  level: number;
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onNamespaceClick: (node: TreeNode) => void;
  onNodeHover: (namespaceId: string, isFolder: boolean, regionId?: string) => void;
  onNodeLeave: () => void;
  onCopy: (text: string) => void;
  onDelete: (namespaceId: string) => void;
}

/**
 * Container component that handles the recursive tree structure.
 * Memoized to prevent unnecessary re-renders.
 */
const TreeNodeContainer = memo(function TreeNodeContainer({
  node,
  level,
  expandedFolders,
  loadingFolders,
  onToggleFolder,
  onNamespaceClick,
  onNodeHover,
  onNodeLeave,
  onCopy,
  onDelete,
}: TreeNodeContainerProps) {
  const isExpanded = expandedFolders.has(node.id);
  const isLoading = loadingFolders.has(node.id);

  return (
    <div key={node.regionId ? `${node.id}:${node.regionId}` : node.id}>
      <TreeNodeRow
        node={node}
        level={level}
        isExpanded={isExpanded}
        isLoading={isLoading}
        onToggleFolder={onToggleFolder}
        onNamespaceClick={onNamespaceClick}
        onNodeHover={onNodeHover}
        onNodeLeave={onNodeLeave}
        onCopy={onCopy}
        onDelete={onDelete}
      />

      {node.isFolder && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNodeContainer
              key={child.regionId ? `${child.id}:${child.regionId}` : child.id}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              loadingFolders={loadingFolders}
              onToggleFolder={onToggleFolder}
              onNamespaceClick={onNamespaceClick}
              onNodeHover={onNodeHover}
              onNodeLeave={onNodeLeave}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))}
          {isLoading && (
            <>
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
});

export function NamespaceTreeView({
  namespaces,
  delimiter,
  connectionId,
  isRefreshing,
  intendedDestination
}: NamespaceTreeViewProps) {
  const navigate = useNavigate();

  // Subscribe to specific store slices
  const expandedFolders = useNamespacesStore((state) => state.expandedFolders);
  const loadingFolders = useNamespacesStore((state) => state.loadingFolders);
  const deletingNamespace = useNamespacesStore((state) => state.deletingNamespace);
  const deleteDialogNamespace = useNamespacesStore((state) => state.deleteDialogNamespace);
  const expandFolder = useNamespacesStore((state) => state.expandFolder);
  const collapseFolder = useNamespacesStore((state) => state.collapseFolder);
  const addLoadingFolder = useNamespacesStore((state) => state.addLoadingFolder);
  const removeLoadingFolder = useNamespacesStore((state) => state.removeLoadingFolder);
  const loadMoreForPrefix = useNamespacesStore((state) => state.loadMoreForPrefix);
  const setDeleteDialogNamespace = useNamespacesStore((state) => state.setDeleteDialogNamespace);
  const deleteNamespace = useNamespacesStore((state) => state.deleteNamespace);
  const resetExpandedFolders = useNamespacesStore((state) => state.resetExpandedFolders);
  const fetchMetadataForNamespace = useNamespacesStore((state) => state.fetchMetadataForNamespace);
  const addRecentNamespace = useNamespacesStore((state) => state.addRecentNamespace);

  // Debounced metadata fetch on hover
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeHover = useCallback((namespaceId: string, isFolder: boolean, regionId?: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (!isFolder) {
      hoverTimeoutRef.current = setTimeout(() => {
        fetchMetadataForNamespace(namespaceId, regionId);
      }, 150); // Reduced from 200ms for snappier feel
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
  const buildTree = useCallback((namespaceList: NamespaceWithRegion[]): TreeNode[] => {
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
            hasMore: !isLast,
            regionId: isLast ? namespace.regionId : undefined
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

  const findNode = useCallback((nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  }, []);

  const autoExpandSingleChildren = useCallback(async (folderId: string) => {
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
  }, [treeData, findNode, expandFolder, loadingFolders, addLoadingFolder, loadMoreForPrefix, removeLoadingFolder]);

  const toggleFolder = useCallback(async (folderId: string) => {
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
  }, [expandedFolders, collapseFolder, expandFolder, findNode, treeData, loadingFolders, addLoadingFolder, loadMoreForPrefix, removeLoadingFolder, autoExpandSingleChildren]);

  const handleNamespaceClick = useCallback((node: TreeNode) => {
    if (!node.isFolder) {
      // Add to recent namespaces with region info
      addRecentNamespace(connectionId, {
        id: node.id,
        regionId: node.regionId
      });

      // If there's an intended destination, navigate there instead
      if (intendedDestination) {
        navigate(intendedDestination);
      } else {
        // Include regionId in URL so DocumentsPage knows which region to use
        const regionParam = node.regionId ? `?region=${encodeURIComponent(node.regionId)}` : '';
        navigate(`/connections/${connectionId}/namespaces/${node.id}/documents${regionParam}`);
      }
    }
  }, [connectionId, addRecentNamespace, intendedDestination, navigate]);

  const handleDelete = useCallback(async (namespaceId: string) => {
    try {
      await deleteNamespace(namespaceId);
    } catch (error) {
      console.error('Failed to delete namespace:', error);
    }
  }, [deleteNamespace]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleOpenDeleteDialog = useCallback((namespaceId: string) => {
    setDeleteDialogNamespace(namespaceId);
  }, [setDeleteDialogNamespace]);

  return (
    <>
      <div className="rounded-md border bg-card p-2">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No namespaces found.
          </div>
        ) : (
          <div className="space-y-0.5">
            {treeData.map(node => (
              <TreeNodeContainer
                key={node.regionId ? `${node.id}:${node.regionId}` : node.id}
                node={node}
                level={0}
                expandedFolders={expandedFolders}
                loadingFolders={loadingFolders}
                onToggleFolder={toggleFolder}
                onNamespaceClick={handleNamespaceClick}
                onNodeHover={handleNodeHover}
                onNodeLeave={handleNodeLeave}
                onCopy={copyToClipboard}
                onDelete={handleOpenDeleteDialog}
              />
            ))}
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
