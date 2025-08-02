import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Connection } from '../../../types/connection';
import { useConnection } from '../../contexts/ConnectionContext';
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
  const { selectConnection, deleteConnection, testConnection, setDefaultConnection } = useConnection();
  const [deletingConnection, setDeletingConnection] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [deleteDialogConnection, setDeleteDialogConnection] = useState<Connection | null>(null);

  const handleSelect = (connection: Connection) => {
    selectConnection(connection.id);
    navigate('/namespaces');
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
        color: 'text-blue-500',
        label: 'Testing...',
        badgeVariant: 'secondary' as const
      };
    }
    
    switch (connection.testStatus) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          label: 'Connected',
          badgeVariant: 'default' as const
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          label: 'Failed',
          badgeVariant: 'destructive' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          label: 'Unknown',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const getProviderPrefix = (provider: string) => {
    return provider.toUpperCase();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Connection Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No connections found.
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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelect(connection)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{connection.name}</span>
                        {connection.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600 text-sm">{getProviderPrefix(connection.region.provider)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{connection.region.location}</span>
                        <span className="text-xs text-muted-foreground font-mono">({connection.region.id})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.badgeVariant} className="gap-1">
                        <StatusIcon className={cn("h-3 w-3", isTesting && "animate-spin")} />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(connection.lastUsed).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(connection);
                          }}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Connect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleTest(e, connection)} disabled={isTesting}>
                            <TestTube className="h-4 w-4 mr-2" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleSetDefault(e, connection)} 
                            disabled={connection.isDefault}
                          >
                            <Star className={cn(
                              "h-4 w-4 mr-2",
                              connection.isDefault && "fill-current"
                            )} />
                            {connection.isDefault ? 'Default Connection' : 'Set as Default'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(connection.region.id);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Region ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogConnection(connection);
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {connections.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
          <div>
            Showing {connections.length} of {totalCount} connection{totalCount !== 1 ? 's' : ''}
          </div>
          <div>
            {connectedCount} connected • {totalCount - connectedCount} disconnected
          </div>
        </div>
      )}

      <Dialog open={!!deleteDialogConnection} onOpenChange={(open) => !open && setDeleteDialogConnection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialogConnection?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogConnection(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!!deletingConnection}
            >
              {deletingConnection ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}