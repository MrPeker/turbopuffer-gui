import React, { useState, useEffect } from 'react';
import { useConnections } from '../../contexts/ConnectionContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useNamespacesStore } from '../../stores/namespacesStore';
import { NamespaceList } from './NamespaceList';
import { NamespaceTreeView } from './NamespaceTreeView';
import { CreateNamespaceDialog } from './CreateNamespaceDialog';
import { PageHeader } from '../layout/PageHeader';
import { RecentNamespaces } from './RecentNamespaces';
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

export function NamespacesPage() {
  const navigate = useNavigate();
  const { connectionId } = useParams<{ connectionId: string }>();
  const { getDelimiterPreference, setDelimiterPreference, getConnectionById, isActiveConnectionReadOnly } = useConnections();

  // Zustand store
  const {
    namespaces,
    isLoading,
    isRefreshing,
    isSearching,
    error,
    searchTerm,
    viewMode,
    intendedDestination: storeIntendedDestination,
    setConnectionId,
    initializeClient,
    loadNamespaces,
    refresh,
    createNamespace,
    deleteNamespace,
    setSearchTerm,
    searchNamespacesAPI,
    setViewMode,
    setIntendedDestination,
    loadMoreForPrefix,
    getFilteredNamespaces,
  } = useNamespacesStore();

  const connection = connectionId ? getConnectionById(connectionId) : null;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [delimiter, setDelimiter] = useState('-');

  const filteredNamespaces = getFilteredNamespaces();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 2) {
      await searchNamespacesAPI(searchTerm);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Clear search and reload if search term is cleared
    if (value.length === 0) {
      loadNamespaces(true);
    }
  };

  const handleCreateNamespace = async (namespaceId: string) => {
    try {
      await createNamespace(namespaceId);
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create namespace:', err);
      throw err;
    }
  };


  // Check for intended destination on mount
  useEffect(() => {
    const destination = sessionStorage.getItem('intendedDestination');
    if (destination) {
      setIntendedDestination(destination);
      sessionStorage.removeItem('intendedDestination');
    }
  }, [setIntendedDestination]);

  // Initialize connection and load namespaces
  useEffect(() => {
    if (connection && connectionId && connection.region) {
      // Set connection in store
      setConnectionId(connectionId);

      // Initialize client
      initializeClient(connectionId, connection.region).then((success) => {
        if (success) {
          // Load namespaces after client is initialized
          loadNamespaces();
        }
      });

      // Load delimiter preference for this connection
      const savedDelimiter = getDelimiterPreference(connectionId);
      setDelimiter(savedDelimiter);
    }
  }, [connection, connectionId, setConnectionId, initializeClient, loadNamespaces, getDelimiterPreference]);

  // Save delimiter preference when it changes
  const handleDelimiterChange = (value: string) => {
    if (value && connectionId) {
      setDelimiter(value);
      setDelimiterPreference(connectionId, value);
    }
  };

  if (!connection) {
    return (
      <div className="flex flex-col h-full bg-tp-bg">
        <PageHeader title="Namespaces" description="no connection" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-tp-surface border border-tp-border-subtle flex items-center justify-center mx-auto mb-3">
            <Database className="h-8 w-8 text-tp-accent" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-tp-text mb-2">no connection selected</h2>
          <p className="text-xs text-tp-text-muted mb-4 max-w-sm">
            select a connection to view namespaces
          </p>
          <Button onClick={() => navigate('/connections')} size="sm">
            <Database className="h-3 w-3 mr-1.5" />
            connections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-tp-bg">
        {/* Enhanced Header with Stats */}
        <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-sm font-bold uppercase tracking-wider text-tp-text">namespaces</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-tp-text-muted">
                  <span className="font-mono font-medium text-tp-accent">{namespaces.length}</span> total
                </p>
                {filteredNamespaces.length !== namespaces.length && (
                  <>
                    <span className="text-tp-border-strong/60">│</span>
                    <p className="text-xs text-tp-text-muted">
                      <span className="font-mono font-medium text-tp-accent">{filteredNamespaces.length}</span> filtered
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={refresh}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              refresh
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isLoading || isActiveConnectionReadOnly}
              title={isActiveConnectionReadOnly ? "Read-only connection: write operations disabled" : undefined}
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              new
            </Button>
          </div>
        </div>

        <RecentNamespaces connectionId={connectionId!} intendedDestination={storeIntendedDestination} />

        {/* Enhanced Search and View Controls */}
        <div className="px-3 py-2.5 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tp-text-muted h-3.5 w-3.5" />
              <Input
                type="search"
                placeholder="search namespaces..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-8 text-xs pr-20 bg-tp-bg border-tp-border-strong"
              />
              {searchTerm.length >= 2 && (
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 text-[10px] px-2 hover:bg-tp-accent/10 hover:text-tp-accent"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
                      searching
                    </>
                  ) : (
                    <>
                      <Search className="h-2.5 w-2.5 mr-1" />
                      api search
                    </>
                  )}
                </Button>
              )}
            </form>

            {searchTerm && !isSearching && (
              <div className="text-[10px] text-tp-text-faint font-mono flex items-center gap-1 flex-shrink-0">
                <span className="font-medium text-tp-text-muted">{filteredNamespaces.length}/{namespaces.length}</span>
                <span>local</span>
                {searchTerm.length >= 2 && (
                  <>
                    <span className="text-tp-border-strong/60">•</span>
                    <span>enter for api</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {viewMode === 'tree' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-tp-bg border-l border-tp-border-subtle">
                <span className="text-[10px] text-tp-text-muted uppercase tracking-widest font-bold">delim</span>
                <ToggleGroup type="single" value={delimiter} onValueChange={handleDelimiterChange} className="gap-0.5">
                  <ToggleGroupItem value="-" aria-label="Dash delimiter" className="h-6 w-6 text-[10px] font-mono text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                    -
                  </ToggleGroupItem>
                  <ToggleGroupItem value="_" aria-label="Underscore delimiter" className="h-6 w-6 text-[10px] font-mono text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                    _
                  </ToggleGroupItem>
                  <ToggleGroupItem value="." aria-label="Dot delimiter" className="h-6 w-6 text-[10px] font-mono text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                    .
                  </ToggleGroupItem>
                  <ToggleGroupItem value="/" aria-label="Slash delimiter" className="h-6 w-6 text-[10px] font-mono text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                    /
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)} className="gap-0.5">
              <ToggleGroupItem value="list" aria-label="List view" className="h-7 gap-1 px-2.5 text-[11px] font-medium text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                <List className="h-3 w-3" />
                list
              </ToggleGroupItem>
              <ToggleGroupItem value="tree" aria-label="Tree view" className="h-7 gap-1 px-2.5 text-[11px] font-medium text-tp-text data-[state=on]:bg-tp-accent data-[state=on]:text-white">
                <FolderTree className="h-3 w-3" />
                tree
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
          {storeIntendedDestination && (
            <Alert className="bg-tp-surface-alt border-tp-border-strong">
              <Info className="h-3 w-3" />
              <AlertTitle className="text-xs uppercase tracking-wider">select namespace</AlertTitle>
              <AlertDescription className="text-[11px] text-tp-text-muted">
                choose a namespace to continue to {storeIntendedDestination === '/documents' ? 'documents' :
                  storeIntendedDestination === '/query' ? 'query builder' :
                  storeIntendedDestination === '/schema' ? 'schema designer' :
                  'requested page'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="bg-tp-danger/10 border-tp-danger/30">
              <AlertCircle className="h-3 w-3" />
              <AlertTitle className="text-xs uppercase tracking-wider">error</AlertTitle>
              <AlertDescription className="flex items-center justify-between text-[11px]">
                <span>{error}</span>
                {error.includes('connection') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/connections')}
                    className="ml-4 h-6 text-xs"
                  >
                    connections
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && !isRefreshing ? (
            <div className="border border-tp-border-subtle bg-tp-bg">
              {viewMode === 'list' ? (
                <Table>
                  <TableHeader className="bg-tp-surface sticky top-0 z-10">
                    <TableRow className="border-b border-tp-border-subtle hover:bg-transparent">
                      <TableHead className="h-8 px-4 w-[24px]"></TableHead>
                      <TableHead className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest text-tp-text-muted">namespace</TableHead>
                      <TableHead className="h-8 px-4 w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(8)].map((_, i) => (
                      <TableRow key={i} className="border-b border-tp-border-subtle/50 h-11">
                        <TableCell className="py-2.5 px-4">
                          <Skeleton className="h-3.5 w-3.5 bg-tp-surface-alt" />
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <Skeleton className="h-3 w-64 bg-tp-surface-alt" />
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-right">
                          <Skeleton className="h-6 w-6 ml-auto bg-tp-surface-alt" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-3 space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 16 + 8}px` }}>
                      <Skeleton className="h-3.5 w-3.5 bg-tp-surface-alt" />
                      <Skeleton className="h-3 w-3 bg-tp-surface-alt" />
                      <Skeleton className="h-3 w-48 bg-tp-surface-alt" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredNamespaces.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-tp-surface border border-tp-border-subtle flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="h-8 w-8 text-tp-accent" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-tp-text mb-2">
                {searchTerm ? 'no matches' : 'no namespaces'}
              </h3>
              <p className="text-xs text-tp-text-muted text-center mb-4 max-w-md">
                {searchTerm
                  ? `no namespaces match "${searchTerm}"`
                  : 'create your first namespace to store vectors'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isActiveConnectionReadOnly}
                  title={isActiveConnectionReadOnly ? "Read-only connection: write operations disabled" : undefined}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  create namespace
                </Button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <NamespaceList
              namespaces={filteredNamespaces}
              isRefreshing={isRefreshing}
              intendedDestination={storeIntendedDestination}
            />
          ) : (
            <NamespaceTreeView
              namespaces={filteredNamespaces}
              delimiter={delimiter}
              connectionId={connectionId!}
              isRefreshing={isRefreshing}
              intendedDestination={storeIntendedDestination}
            />
          )}
        </div>
      </div>

      <CreateNamespaceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateNamespace={handleCreateNamespace}
      />
    </>
  );
}