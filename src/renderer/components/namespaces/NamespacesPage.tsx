import React, { useState, useEffect, useMemo } from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import { useNamespace } from '../../contexts/NamespaceContext';
import { useNavigate } from 'react-router-dom';
import { namespaceService } from '../../services/namespaceService';
import { turbopufferService } from '../../services/turbopufferService';
import { NamespaceList } from './NamespaceList';
import { NamespaceTreeView } from './NamespaceTreeView';
import { CreateNamespaceDialog } from './CreateNamespaceDialog';
import { PageHeader } from '../layout/PageHeader';
import type { Namespace } from '../../../types/namespace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info , 
  Search, 
  RefreshCw, 
  Plus, 
  Database, 
  AlertCircle,
  Folder,
  FolderOpen,
  List,
  FolderTree
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ViewMode = 'list' | 'tree';

export function NamespacesPage() {
  const navigate = useNavigate();
  const { activeConnection, getDelimiterPreference, setDelimiterPreference, loadConnections, isLoading: isLoadingConnections } = useConnection();
  const { selectNamespace } = useNamespace();
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [delimiter, setDelimiter] = useState('-');
  const [loadedPrefixes, setLoadedPrefixes] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  // Local filtering of already loaded namespaces
  const filteredNamespaces = useMemo(() => {
    if (!searchTerm) return namespaces;
    return namespaces.filter(ns => 
      ns.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [namespaces, searchTerm]);


  const loadNamespaces = async (search?: string, isLoadMore?: boolean) => {
    if (!activeConnection) return;

    // Only set main loading state if not loading more for a folder
    if (!isLoadMore) {
      setIsLoading(true);
    }
    setError(null);

    try {
      let connectionWithKey;
      try {
        connectionWithKey = await window.electronAPI.getConnectionForUse(activeConnection.id);
      } catch (err) {
        console.error('Failed to get connection for use:', err);
        const errorMessage = err instanceof Error ? err.message : 'Connection not found';
        
        // If connection not found, it might have been deleted
        if (errorMessage.includes('not found')) {
          setError('The selected connection no longer exists. Please select a different connection.');
          // Reload connections to refresh the list
          await loadConnections();
        } else {
          setError(`Failed to connect: ${errorMessage}`);
        }
        
        setIsLoading(false);
        setIsRefreshing(false);
        setIsSearching(false);
        setIsLoadingMore(false);
        return;
      }
      
      await turbopufferService.initializeClient(connectionWithKey.apiKey, connectionWithKey.region);
      namespaceService.setClient(turbopufferService.getClient()!);

      const response = await namespaceService.listNamespaces({
        prefix: search || undefined,
        page_size: 1000 // Max allowed
      });

      if (search) {
        // If searching with prefix, merge with existing results
        const existingIds = new Set(namespaces.map(ns => ns.id));
        const newNamespaces = response.namespaces.filter(ns => !existingIds.has(ns.id));
        const allNamespaces = [...namespaces, ...newNamespaces];
        setNamespaces(allNamespaces);
        setLoadedPrefixes(new Set([...loadedPrefixes, search]));
      } else {
        setNamespaces(response.namespaces);
        setLoadedPrefixes(new Set());
      }
    } catch (err) {
      console.error('Failed to load namespaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load namespaces');
    } finally {
      if (!isLoadMore) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadedPrefixes(new Set());
    await loadNamespaces();
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 2) {
      setIsSearching(true);
      await loadNamespaces(searchTerm);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Clear search results if search term is cleared
    if (value.length === 0 && isSearching) {
      setIsSearching(false);
      loadNamespaces();
    }
  };

  const handleLoadMoreForPrefix = async (prefix: string) => {
    if (!loadedPrefixes.has(prefix)) {
      setIsLoadingMore(true);
      await loadNamespaces(prefix, true);
    }
  };

  const handleCreateNamespace = async (namespaceId: string) => {
    try {
      await namespaceService.createNamespace(namespaceId);
      setIsCreateDialogOpen(false);
      await loadNamespaces();
    } catch (err) {
      console.error('Failed to create namespace:', err);
      throw err;
    }
  };

  const handleDeleteNamespace = async (namespaceId: string) => {
    try {
      await namespaceService.deleteNamespace(namespaceId);
      setNamespaces(namespaces.filter(ns => ns.id !== namespaceId));
    } catch (err) {
      console.error('Failed to delete namespace:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Check for intended destination
    const destination = sessionStorage.getItem('intendedDestination');
    if (destination) {
      setIntendedDestination(destination);
      sessionStorage.removeItem('intendedDestination');
    }
  }, []);

  useEffect(() => {
    // Ensure connections are loaded first
    if (!activeConnection && !isLoadingConnections) {
      loadConnections();
    } else if (activeConnection) {
      loadNamespaces();
      // Load delimiter preference for this connection
      const savedDelimiter = getDelimiterPreference(activeConnection.id);
      setDelimiter(savedDelimiter);
    }
  }, [activeConnection, isLoadingConnections, getDelimiterPreference, loadConnections]);

  // Save delimiter preference when it changes
  const handleDelimiterChange = (value: string) => {
    if (value && activeConnection) {
      setDelimiter(value);
      setDelimiterPreference(activeConnection.id, value);
    }
  };

  if (isLoadingConnections) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Loading Connections...</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please wait while we load your connections.
        </p>
      </div>
    );
  }

  if (!activeConnection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <Database className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Connection Selected</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please select a connection from the Connections page to view and manage namespaces.
        </p>
        <Button onClick={() => navigate('/connections')}>
          Go to Connections
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Namespaces"
          description="Manage your Turbopuffer namespaces and organize vectors"
          actions={
            <>
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Namespace
              </Button>
            </>
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search namespaces..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 w-80 pr-20"
              />
              {searchTerm.length >= 2 && (
                <Button 
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Search API'
                  )}
                </Button>
              )}
            </form>

            {searchTerm && !isSearching && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredNamespaces.length} of {namespaces.length} namespaces matching "{searchTerm}" locally. 
                {searchTerm.length >= 2 && ' Press Enter or click "Search API" to search server.'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'tree' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Delimiter:</span>
                <ToggleGroup type="single" value={delimiter} onValueChange={handleDelimiterChange}>
                  <ToggleGroupItem value="-" aria-label="Dash delimiter">
                    -
                  </ToggleGroupItem>
                  <ToggleGroupItem value="_" aria-label="Underscore delimiter">
                    _
                  </ToggleGroupItem>
                  <ToggleGroupItem value="." aria-label="Dot delimiter">
                    .
                  </ToggleGroupItem>
                  <ToggleGroupItem value="/" aria-label="Slash delimiter">
                    /
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4 mr-2" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="tree" aria-label="Tree view">
                <FolderTree className="h-4 w-4 mr-2" />
                Tree
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {intendedDestination && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Select a Namespace</AlertTitle>
            <AlertDescription>
              Please select a namespace to continue to {intendedDestination === '/documents' ? 'Documents' : 
                intendedDestination === '/query' ? 'Query Builder' : 
                intendedDestination === '/schema' ? 'Schema Designer' : 
                'your requested page'}.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {error.includes('connection') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/connections')}
                  className="ml-4"
                >
                  Go to Connections
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && !isRefreshing ? (
          <div className="rounded-md border">
            {viewMode === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20px]"></TableHead>
                    <TableHead>Namespace ID</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 20 + 8}px` }}>
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : filteredNamespaces.length === 0 && !isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No namespaces found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchTerm 
                  ? `No namespaces match "${searchTerm}". Try a different search term.`
                  : 'Create your first namespace to start storing vectors and documents.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Namespace
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <NamespaceList 
            namespaces={filteredNamespaces}
            onDeleteNamespace={handleDeleteNamespace}
            isRefreshing={isRefreshing}
            intendedDestination={intendedDestination}
          />
        ) : (
          <NamespaceTreeView
            namespaces={filteredNamespaces}
            delimiter={delimiter}
            onDeleteNamespace={handleDeleteNamespace}
            onLoadMore={handleLoadMoreForPrefix}
            isRefreshing={isRefreshing}
            intendedDestination={intendedDestination}
          />
        )}
      </div>

      <CreateNamespaceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateNamespace={handleCreateNamespace}
      />
    </>
  );
}