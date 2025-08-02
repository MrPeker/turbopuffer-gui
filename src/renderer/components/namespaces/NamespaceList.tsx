import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNamespace } from '../../contexts/NamespaceContext';
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
import { 
  MoreHorizontal, 
  Trash2, 
  ArrowRight,
  RefreshCw,
  Database,
  Copy,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NamespaceListProps {
  namespaces: Namespace[];
  onDeleteNamespace: (namespaceId: string) => Promise<void>;
  isRefreshing?: boolean;
  intendedDestination?: string | null;
}

export function NamespaceList({ namespaces, onDeleteNamespace, isRefreshing, intendedDestination }: NamespaceListProps) {
  const navigate = useNavigate();
  const { selectNamespace } = useNamespace();
  const [deletingNamespace, setDeletingNamespace] = useState<string | null>(null);
  const [deleteDialogNamespace, setDeleteDialogNamespace] = useState<string | null>(null);

  const handleDelete = async (namespaceId: string) => {
    setDeletingNamespace(namespaceId);
    try {
      await onDeleteNamespace(namespaceId);
      setDeleteDialogNamespace(null);
    } finally {
      setDeletingNamespace(null);
    }
  };

  const handleNamespaceClick = (namespaceId: string) => {
    const namespace = namespaces.find(ns => ns.id === namespaceId);
    if (namespace) {
      selectNamespace(namespace);
    }
    // If there's an intended destination, navigate there instead
    if (intendedDestination) {
      navigate(intendedDestination);
    } else {
      navigate(`/namespaces/${namespaceId}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20px]"></TableHead>
              <TableHead>Namespace ID</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {namespaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No namespaces found.
                </TableCell>
              </TableRow>
            ) : (
              namespaces.map((namespace) => (
                <TableRow 
                  key={namespace.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleNamespaceClick(namespace.id)}
                >
                  <TableCell className="w-[20px]">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-mono">
                    {namespace.id}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleNamespaceClick(namespace.id);
                        }}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Open Namespace
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(namespace.id);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogNamespace(namespace.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {namespaces.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
          <div>
            Showing {namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}
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