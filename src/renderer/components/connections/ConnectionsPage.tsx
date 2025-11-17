import React, { useState } from 'react';
import { NewConnectionDialog } from './NewConnectionDialog';
import { ConnectionList } from './ConnectionList';
import { useConnections } from '../../contexts/ConnectionContext';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Plus, Database, Search, Zap, Globe, Sparkles } from 'lucide-react';

export function ConnectionsPage() {
  const { connections, loadConnections, isLoading } = useConnections();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    loadConnections();
  };

  const connectedCount = connections.filter(c => c.testStatus === 'success').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Connections"
          description="Manage your Turbopuffer database connections"
          actions={
            <>
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </>
          }
        />
        
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
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (connections.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col h-full bg-tp-bg">
        <PageHeader
          title="Connections"
          description="database connections"
        />

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-tp-surface border border-tp-border-subtle flex items-center justify-center mx-auto mb-3">
              <Database className="h-8 w-8 text-tp-accent" />
            </div>
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-tp-text mb-2">no connections</h2>
          <p className="text-xs text-tp-text-muted mb-1 max-w-sm">
            connect to turbopuffer to manage namespaces and vector data
          </p>
          <Badge variant="outline" className="mb-4">
            third-party • open source
          </Badge>

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
            className="mt-2"
          >
            <Plus className="h-3 w-3 mr-1.5" />
            create connection
          </Button>
        </div>

        <NewConnectionDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-tp-bg">
      <PageHeader
        title="Connections"
        description={`${connections.length} total • ${connectedCount} active`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-tp-text-muted h-3 w-3" />
              <Input
                type="text"
                placeholder="search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 w-48 h-7 text-xs"
              />
            </div>
            <Button variant="ghost" onClick={handleRefresh} disabled={isLoading} size="sm">
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-3 w-3 mr-1" />
              new
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <ConnectionList
          connections={filteredConnections}
          connectedCount={connectedCount}
          totalCount={connections.length}
        />
      </div>

      <NewConnectionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}