import React, { useState } from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import type { Connection } from '../../../types/connection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Trash2, TestTube, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionsListProps {
  connections?: Connection[];
}

export function ConnectionsList({ connections: propsConnections }: ConnectionsListProps) {
  const {
    connections: contextConnections,
    selectedConnection,
    isLoading,
    error,
    selectConnection,
    deleteConnection,
    testConnection,
    setDefaultConnection,
  } = useConnection();
  
  const connections = propsConnections || contextConnections;

  const [deleteDialogConnection, setDeleteDialogConnection] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteDialogConnection) {
      try {
        await deleteConnection(deleteDialogConnection);
        setDeleteDialogConnection(null);
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    }
  };

  const handleTest = async (connectionId: string) => {
    setTestingConnection(connectionId);
    try {
      await testConnection(connectionId);
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setTestingConnection(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading connections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-destructive">Error Loading Connections: {error}</span>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No connections found matching your search criteria.
      </div>
    );
  }

  const sortedConnections = [...connections].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });

  const getStatusBadge = (connection: Connection) => {
    if (testingConnection === connection.id) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Testing
        </Badge>
      );
    }
    
    switch (connection.testStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const deleteDialogConnectionName = deleteDialogConnection 
    ? connections.find(c => c.id === deleteDialogConnection)?.name 
    : '';

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedConnections.map((connection) => (
              <TableRow 
                key={connection.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedConnection?.id === connection.id && "bg-muted"
                )}
                onClick={() => selectConnection(connection.id)}
              >
                <TableCell className="font-medium">
                  {connection.name}
                  {connection.isDefault && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Default
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{connection.region.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {connection.region.provider.toUpperCase()} • {connection.region.location}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(connection)}
                </TableCell>
                <TableCell>
                  {connection.isDefault && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(connection.lastUsed).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTest(connection.id);
                      }}
                      disabled={testingConnection === connection.id}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultConnection(connection.id);
                      }}
                      disabled={connection.isDefault}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        connection.isDefault ? "fill-yellow-400 text-yellow-400" : ""
                      )} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialogConnection(connection.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteDialogConnection} onOpenChange={() => setDeleteDialogConnection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the connection "{deleteDialogConnectionName}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogConnection(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}