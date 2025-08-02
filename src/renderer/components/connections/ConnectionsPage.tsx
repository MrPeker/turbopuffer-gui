import React, { useState } from 'react';
import { NewConnectionDialog } from './NewConnectionDialog';
import { ConnectionList } from './ConnectionList';
import { useConnection } from '../../contexts/ConnectionContext';
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
  const { connections, loadConnections, isLoading } = useConnection();
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
      <div className="space-y-8">
        <PageHeader
          title="Connections"
          description="Manage your Turbopuffer database connections"
        />
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Database className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">Welcome to Turbopuffer GUI</h2>
          <p className="text-lg text-muted-foreground mb-2 max-w-md">
            A powerful third-party client for managing your Turbopuffer vector databases.
          </p>
          <Badge variant="outline" className="mb-8 text-xs">
            Third-party • Open Source • Community Built
          </Badge>

          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Connection
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
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Manage your Turbopuffer database connections"
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Connection
            </Button>
          </>
        }
      />

      <ConnectionList 
        connections={filteredConnections}
        connectedCount={connectedCount}
        totalCount={connections.length}
      />

      <NewConnectionDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}