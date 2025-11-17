import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Connection } from '../../../types/connection';
import { useConnections } from '../../contexts/ConnectionContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Trash2, 
  ArrowRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TestTube,
  Star,
  Copy,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionListProps {
  connections: Connection[];
  connectedCount: number;
  totalCount: number;
}

export function ConnectionList({ connections, connectedCount, totalCount }: ConnectionListProps) {
  const navigate = useNavigate();
  const { deleteConnection, testConnection, setDefaultConnection } = useConnections();
  const [deletingConnection, setDeletingConnection] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [deleteDialogConnection, setDeleteDialogConnection] = useState<Connection | null>(null);

  const handleSelect = (connection: Connection) => {
    navigate(`/connections/${connection.id}/namespaces`);
  };

  const handleTest = async (e: React.MouseEvent, connection: Connection) => {
    e.stopPropagation();
    setTestingConnection(connection.id);
    try {
      await testConnection(connection.id);
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, connection: Connection) => {
    e.stopPropagation();
    try {
      await setDefaultConnection(connection.id);
    } catch (error) {
      console.error('Failed to set default connection:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogConnection) return;
    
    setDeletingConnection(deleteDialogConnection.id);
    try {
      await deleteConnection(deleteDialogConnection.id);
      setDeleteDialogConnection(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setDeletingConnection(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusConfig = (connection: Connection, isTesting: boolean) => {
    if (isTesting) {
      return {
        icon: RefreshCw,
        color: 'text-tp-accent',
        label: 'testing',
        badgeVariant: 'secondary' as const
      };
    }

    switch (connection.testStatus) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-tp-success',
          label: 'connected',
          badgeVariant: 'default' as const
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-tp-danger',
          label: 'failed',
          badgeVariant: 'destructive' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-tp-text-muted',
          label: 'unknown',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const getProviderPrefix = (provider: string) => {
    return provider.toUpperCase();
  };

  return (
    <>
      <div className="border border-tp-border-subtle bg-tp-bg">
        <Table>
          <TableHeader className="bg-tp-surface sticky top-0 z-10">
            <TableRow className="border-b border-tp-border-subtle hover:bg-transparent">
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">connection</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">region</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">status</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">last used</TableHead>
              <TableHead className="h-9 px-4 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-xs text-tp-text-muted">
                  no connections found
                </TableCell>
              </TableRow>
            ) : (
              connections.map((connection) => {
                const isTesting = testingConnection === connection.id;
                const statusConfig = getStatusConfig(connection, isTesting);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow
                    key={connection.id}
                    className="cursor-pointer hover:bg-tp-surface-alt/80 border-b border-tp-border-subtle/50 h-12 transition-colors"
                    onClick={() => handleSelect(connection)}
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-tp-accent/70 flex-shrink-0" />
                        <span className="text-sm text-tp-text font-medium">{connection.name}</span>
                        {connection.isDefault && (
                          <Badge variant="outline" className="ml-1 gap-1">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-tp-accent text-xs font-mono">{getProviderPrefix(connection.region.provider)}</span>
                        <span className="text-tp-border-strong/60">│</span>
                        <span className="text-sm text-tp-text">{connection.region.location}</span>
                        <span className="text-xs text-tp-text-faint font-mono ml-1">({connection.region.id})</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant={statusConfig.badgeVariant} className="gap-1">
                        <StatusIcon className={cn("h-2.5 w-2.5", isTesting && "animate-spin")} />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-tp-text-muted font-mono">
                      {new Date(connection.lastUsed).toLocaleDateString()}
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
                              handleSelect(connection);
                            }}
                            className="text-sm"
                          >
                            <ArrowRight className="h-3 w-3 mr-1.5" />
                            connect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleTest(e, connection)}
                            disabled={isTesting}
                            className="text-sm"
                          >
                            <TestTube className="h-3 w-3 mr-1.5" />
                            test connection
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleSetDefault(e, connection)}
                            disabled={connection.isDefault}
                            className="text-sm"
                          >
                            <Star className={cn(
                              "h-3 w-3 mr-1.5",
                              connection.isDefault && "fill-current"
                            )} />
                            {connection.isDefault ? 'default' : 'set as default'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(connection.region.id);
                            }}
                            className="text-sm"
                          >
                            <Copy className="h-3 w-3 mr-1.5" />
                            copy region id
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-tp-border-subtle" />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogConnection(connection);
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

      {connections.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-tp-text-muted font-mono bg-tp-surface border-t border-tp-border-subtle">
          <div className="font-medium">
            showing {connections.length} of {totalCount}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tp-success"></span>
              <span className="font-medium">{connectedCount}</span> connected
            </span>
            <span className="text-tp-border-strong/60">│</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tp-danger"></span>
              <span className="font-medium">{totalCount - connectedCount}</span> disconnected
            </span>
          </div>
        </div>
      )}

      <Dialog open={!!deleteDialogConnection} onOpenChange={(open) => !open && setDeleteDialogConnection(null)}>
        <DialogContent className="bg-tp-surface border-tp-border-strong">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">delete connection</DialogTitle>
            <DialogDescription className="text-xs text-tp-text-muted">
              delete "{deleteDialogConnection?.name}"? this cannot be undone
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogConnection(null)}>
              cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!!deletingConnection}
            >
              {deletingConnection ? (
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