import React, { useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNamespacesStore } from '../../stores/namespacesStore';
import type { Namespace } from '../../../types/namespace';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  Trash2,
  ArrowRight,
  RefreshCw,
  Copy,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes, formatNumber, formatDate } from '../../utils/formatBytes';

interface NamespaceListProps {
  namespaces: Namespace[];
  isRefreshing?: boolean;
  intendedDestination?: string | null;
}

export function NamespaceList({ namespaces, isRefreshing, intendedDestination }: NamespaceListProps) {
  const navigate = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();

  // Zustand store
  const {
    deletingNamespace,
    deleteDialogNamespace,
    setDeleteDialogNamespace,
    deleteNamespace,
    addRecentNamespace,
    fetchMetadataForNamespace,
    getNamespaceMetadata,
    isMetadataLoading,
  } = useNamespacesStore();

  // Debounced metadata fetch on hover (200ms delay to avoid scroll jank)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRowHover = useCallback((namespaceId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      fetchMetadataForNamespace(namespaceId);
    }, 200);
  }, [fetchMetadataForNamespace]);

  const handleRowLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleDelete = async (namespaceId: string) => {
    try {
      await deleteNamespace(namespaceId);
    } catch (error) {
      console.error('Failed to delete namespace:', error);
    }
  };

  const handleNamespaceClick = (namespace: Namespace) => {
    if (!connectionId) return;

    // Add to recent namespaces
    addRecentNamespace(connectionId, namespace);

    // If there's an intended destination, navigate there instead
    if (intendedDestination) {
      navigate(intendedDestination);
    } else {
      navigate(`/connections/${connectionId}/namespaces/${namespace.id}/documents`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div className="border border-tp-border-subtle bg-tp-bg">
        <Table>
          <TableHeader className="bg-tp-surface sticky top-0 z-10">
            <TableRow className="border-b border-tp-border-subtle hover:bg-transparent">
              <TableHead className="h-9 px-4 w-[24px]"></TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">namespace</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted text-right w-[100px]">rows</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted text-right w-[100px]">size</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted w-[120px]">created</TableHead>
              <TableHead className="h-9 px-4 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {namespaces.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-xs text-tp-text-muted">
                  no namespaces found
                </TableCell>
              </TableRow>
            ) : (
              namespaces.map((namespace) => {
                const metadata = getNamespaceMetadata(namespace.id);
                const isLoading = isMetadataLoading(namespace.id);

                return (
                  <TableRow
                    key={namespace.id}
                    className="cursor-pointer hover:bg-tp-surface-alt/80 border-b border-tp-border-subtle/50 h-12 transition-colors"
                    onClick={() => handleNamespaceClick(namespace)}
                    onMouseEnter={() => handleRowHover(namespace.id)}
                    onMouseLeave={handleRowLeave}
                  >
                    <TableCell className="py-3 px-4">
                      <FolderOpen className="h-3.5 w-3.5 text-tp-accent/70 flex-shrink-0" />
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono text-sm text-tp-text font-medium">
                      {namespace.id}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-xs text-tp-text-muted tabular-nums">
                      {isLoading ? (
                        <Skeleton className="h-4 w-16 ml-auto" />
                      ) : metadata ? (
                        formatNumber(metadata.approx_row_count)
                      ) : (
                        <span className="text-tp-text-muted/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-xs text-tp-text-muted tabular-nums">
                      {isLoading ? (
                        <Skeleton className="h-4 w-16 ml-auto" />
                      ) : metadata ? (
                        formatBytes(metadata.approx_logical_bytes)
                      ) : (
                        <span className="text-tp-text-muted/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-tp-text-muted">
                      {isLoading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : metadata ? (
                        formatDate(metadata.created_at)
                      ) : (
                        <span className="text-tp-text-muted/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-tp-surface border-tp-border-strong">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNamespaceClick(namespace);
                          }}
                          className="text-sm"
                        >
                          <ArrowRight className="h-3 w-3 mr-1.5" />
                          open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(namespace.id);
                          }}
                          className="text-sm"
                        >
                          <Copy className="h-3 w-3 mr-1.5" />
                          copy id
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-tp-border-subtle" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogNamespace(namespace.id);
                          }}
                          className="text-tp-danger focus:text-tp-danger text-sm"
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {namespaces.length > 0 && (
        <div className="px-4 py-2.5 text-[11px] text-tp-text-muted font-mono font-medium bg-tp-surface border-t border-tp-border-subtle">
          showing {namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}
        </div>
      )}

      <Dialog open={!!deleteDialogNamespace} onOpenChange={(open) => !open && setDeleteDialogNamespace(null)}>
        <DialogContent className="bg-tp-surface border-tp-border-strong">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">delete namespace</DialogTitle>
            <DialogDescription className="text-xs text-tp-text-muted">
              delete <span className="font-mono font-semibold text-tp-accent">{deleteDialogNamespace}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-[11px] text-tp-text-muted">
              permanently deletes all vectors, documents, and data
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogNamespace(null)}>
              cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteDialogNamespace && handleDelete(deleteDialogNamespace)}
              disabled={!!deletingNamespace}
            >
              {deletingNamespace === deleteDialogNamespace ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  deleting
                </>
              ) : (
                'delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}