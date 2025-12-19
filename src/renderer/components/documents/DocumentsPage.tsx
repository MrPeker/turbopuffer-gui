import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Document } from "@/types/document";
import {
  AlertCircle,
  Download,
  RefreshCw,
  Trash2,
  Upload,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConnections } from "@/renderer/contexts/ConnectionContext";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";
import { useToast } from "@/hooks/use-toast";
import { useInspector } from "@/renderer/components/layout/MainLayout";
import { DocumentsTable } from "./DocumentsTable";
import { DocumentDetailsPanel } from "./DocumentDetailsPanel";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { FilterBar } from "./FilterBar/FilterBar";
import { RawQueryBar } from "./RawQueryBar";
import { QueryPerformanceMetrics } from "./QueryPerformanceMetrics";
import { AggregationGroupsTable } from "./AggregationGroupsTable"; // NEW: Import grouped results table
import { convertFiltersToRawQuery } from "@/renderer/utils/filterConversion";
import { ConnectionErrorState, NamespaceNotFoundState } from "../shared/ErrorStates";
import { Skeleton } from "@/components/ui/skeleton";

export const DocumentsPage: React.FC = () => {
  const { connectionId, namespaceId } = useParams<{ connectionId: string; namespaceId: string }>();
  const { getConnectionById, turbopufferClient, clientError, setActiveConnection, isActiveConnectionReadOnly } = useConnections();
  const connection = connectionId ? getConnectionById(connectionId) : null;
  const { toast } = useToast();
  const { setInspectorContent, setInspectorTitle, openInspector, closeInspector } = useInspector();
  const {
    documents,
    isLoading: loading,
    error,
    totalCount,
    selectedDocuments,
    isRefreshing,
    currentNamespaceId,
    initializeClient,
    loadDocuments,
    refresh,
    deleteDocuments,
    setSelectedDocuments,
    setConnectionId,
    setNamespace,
    exportDocuments,
    nextCursor,
    resetInitialization,
    lastQueryResult,
    unfilteredTotalCount,
    groupByAttributes, // NEW: Get group-by attributes
    aggregationGroups, // NEW: Get grouped results
    isGroupedQuery, // NEW: Flag for grouped query
    aggregations, // NEW: Get aggregations config
  } = useDocumentsStore();

  // Subscribe to store state for filter dependencies
  const activeFilters = useDocumentsStore(state => state.activeFilters);
  const searchText = useDocumentsStore(state => state.searchText);

  // Check if we're in aggregation mode (with or without grouping)
  const isAggregationMode = aggregations.length > 0;

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [isRawQueryMode, setIsRawQueryMode] = useState(false);
  const [initialRawQuery, setInitialRawQuery] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDocumentId, setActiveDocumentId] = useState<string | number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Track initialization to prevent infinite loops
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastInitKey, setLastInitKey] = useState<string>('');

  // Initialize connection when connectionId changes
  useEffect(() => {
    const initConnection = async () => {
      if (connectionId) {
        try {
          await setActiveConnection(connectionId);
        } catch (err) {
          // Error is already set in context
          console.error('Failed to initialize connection:', err);
        }
      }
    };

    initConnection();
  }, [connectionId]); // Removed setActiveConnection from deps to prevent loop

  // Single effect to handle initialization and loading
  useEffect(() => {
    // Create a unique key for this initialization
    const initKey = `${connectionId}-${namespaceId}-${pageSize}-${!!turbopufferClient}`;

    // Only proceed if we have a turbopuffer client
    if (!turbopufferClient) {
      console.log('⏭️ Waiting for turbopuffer client...');
      // Reset initialization when client is not ready
      if (hasInitialized) {
        setHasInitialized(false);
      }
      return;
    }

    // Skip if we've already initialized with these exact params
    if (hasInitialized && lastInitKey === initKey) {
      console.log('⏭️ Skipping re-initialization - already initialized:', initKey);
      return;
    }

    const initializeAndLoad = async () => {
      if (!namespaceId || !connectionId) {
        console.log('⏭️ Skipping - missing namespace or connection ID');
        return;
      }

      console.log('🚀 Starting initialization:', initKey);

      // Wait for connection to be loaded from storage
      if (!connection) {
        console.log('⏭️ Waiting for connection to load...');
        return;
      }

      // Set connection ID first
      setConnectionId(connectionId);

      // Set namespace if it changed
      if (currentNamespaceId !== namespaceId) {
        console.log('📁 Namespace changed, setting new namespace');
        await setNamespace(namespaceId);
        // Reset to first page when changing namespaces
        setCurrentPage(1);
      }

      // Initialize the client with the current connection
      const initialized = await initializeClient(
        connectionId,
        connection.region
      );

      if (initialized) {
        console.log('✅ Client initialized, loading documents');
        // Load documents with current page size
        await loadDocuments(false, false, pageSize);

        // Mark as initialized with this specific key
        setHasInitialized(true);
        setLastInitKey(initKey);
        console.log('✅ Initialization complete:', initKey);
      }
    };

    initializeAndLoad();
  }, [namespaceId, connectionId, pageSize, !!turbopufferClient, !!connection]); // Include connection availability

  const handleRefresh = () => {
    refresh();
    // Reset to first page on refresh
    setCurrentPage(1);
  };

  const handleRetryConnection = async () => {
    if (namespaceId && connection) {
      // Reset initialization state and retry
      resetInitialization();
      const initialized = await initializeClient(
        connection.id,
        connection.region
      );
      if (initialized) {
        loadDocuments(false, false, pageSize);
      }
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    // Check if there are documents to export
    const docsToExport = selectedDocuments.size > 0 ? selectedDocuments.size : documents.length;

    if (docsToExport === 0) {
      toast({
        title: "No documents to export",
        description: "Load some documents first before exporting",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportIds =
        selectedDocuments.size > 0
          ? Array.from(selectedDocuments).map((id) => String(id))
          : undefined;

      await exportDocuments(format, exportIds);

      // Success - no toast, the file download is the feedback
      setIsExporting(false);
    } catch (error) {
      setIsExporting(false);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDocuments.size} document(s)?`
    );

    if (confirmed) {
      await deleteDocuments(Array.from(selectedDocuments));
      setSelectedDocuments(new Set());
      refresh();
      // Reset to first page after deletion
      setCurrentPage(1);
    }
  };

  const handleDocumentClick = (document: Document) => {
    setActiveDocumentId(document.id);
    setInspectorTitle('Document Details');
    setInspectorContent(
      <DocumentDetailsPanel
        document={document}
        onClose={() => {
          setActiveDocumentId(null);
          closeInspector();
        }}
        onUpdate={() => {
          refresh();
          setActiveDocumentId(null);
          closeInspector();
        }}
      />
    );
    openInspector();
  };

  const handleInitialLoad = () => {
    loadDocuments(false, false, pageSize);
    // Reset to first page on initial load
    setCurrentPage(1);
  };

  // Early return: Connection error from context
  if (clientError) {
    return <ConnectionErrorState error={clientError} />;
  }

  // Early return: Client not ready yet (still initializing)
  if (!turbopufferClient) {
    return (
      <div className="flex flex-col h-full bg-tp-bg">
        <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Early return: Namespace not found (404 error from store)
  if (error && error.includes('404') && namespaceId) {
    return <NamespaceNotFoundState namespaceId={namespaceId} connectionId={connectionId} />;
  }

  // Component to display raw query responses (like aggregations)
  const RawResponseViewer: React.FC<{ response: any }> = ({ response }) => (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-lg">Query Response</CardTitle>
        <CardDescription>
          Raw response from TurboPuffer API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-md p-4">
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
        {response.aggregations && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Aggregation Results:</h4>
            <div className="grid gap-2">
              {Object.entries(response.aggregations).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center bg-muted/50 px-3 py-2 rounded">
                  <span className="font-mono text-sm">{key}:</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {response.performance && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Performance Metrics:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(response.performance).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full bg-tp-bg relative">
      {/* Toolbar - Tier 3: Document Actions */}
      <div className="px-3 py-1.5 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center gap-1.5">
          <h1 className="text-xs font-semibold uppercase tracking-wider text-tp-text">Documents</h1>
          {namespaceId && (
            <>
              <span className="text-tp-text-muted">•</span>
              <span className="text-xs font-mono text-tp-accent">{namespaceId}</span>
            </>
          )}
        </div>

        {/* Document Actions - Tier 3 (subtle) */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUploadDialog(true)}
            disabled={isActiveConnectionReadOnly}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-3 w-3 mr-1" />
            upload
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3 w-3 mr-1" />
                export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-tp-surface border-tp-border-strong">
              <DropdownMenuItem onClick={() => handleExport("json")} className="text-sm">
                <Download className="h-3 w-3 mr-1.5" />
                json
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")} className="text-sm">
                <Download className="h-3 w-3 mr-1.5" />
                csv
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Button
            variant={isRawQueryMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              if (!isRawQueryMode) {
                const rawQuery = convertFiltersToRawQuery(
                  useDocumentsStore.getState().activeFilters,
                  useDocumentsStore.getState().searchText,
                  useDocumentsStore.getState().attributes
                );
                setInitialRawQuery(rawQuery);
              } else {
                setInitialRawQuery(undefined);
              }
              setIsRawQueryMode(!isRawQueryMode);
            }}
            className="h-6 text-[10px]"
          >
            <Code className="h-3 w-3 mr-1" />
            {isRawQueryMode ? "raw" : "visual"}
          </Button>
        </div>
      </div>

      {/* Filter Bar or Raw Query Bar */}
      {isRawQueryMode ? (
        <RawQueryBar namespaceId={namespaceId || ''} initialQuery={initialRawQuery} />
      ) : (
        <FilterBar 
          className="sticky top-0 z-10" 
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            // Reset to first page when page size changes
            useDocumentsStore.getState().loadDocuments(false, false, newSize);
          }}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-3 my-2 px-3 py-2 bg-tp-danger/10 border border-tp-danger/30 rounded-sm">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-3 w-3 text-tp-danger flex-shrink-0" />
            <span className="flex-1 text-tp-text">{error}</span>
            {error.includes("Failed to") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryConnection}
                className="h-6 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Documents Table or Aggregation Results */}
      <div className="flex-1 overflow-hidden">
        {/* Priority 1: Show grouped aggregations table when grouping is enabled */}
        {isGroupedQuery && aggregationGroups && aggregationGroups.length > 0 ? (
          <>
            <AggregationGroupsTable
              groups={aggregationGroups}
              groupByAttributes={groupByAttributes}
            />
            <QueryPerformanceMetrics lastQueryResult={lastQueryResult} />
          </>
        ) :
        /* Priority 2: Show aggregation results when in aggregation mode (Count without grouping) */
        isAggregationMode && lastQueryResult ? (
          <RawResponseViewer response={lastQueryResult} />
        ) :
        /* Priority 3: Show raw response if no documents but we have query results */
        documents.length === 0 && lastQueryResult && !loading && !error ? (
          <RawResponseViewer response={lastQueryResult} />
        ) : (
          /* Priority 4: Show documents table (default) */
          <>
            <DocumentsTable
              documents={documents}
              loading={loading}
              onDocumentClick={handleDocumentClick}
              selectedDocuments={new Set(Array.from(selectedDocuments).map(String))}
              onInitialLoad={handleInitialLoad}
              activeDocumentId={activeDocumentId}
            />
            <QueryPerformanceMetrics lastQueryResult={lastQueryResult} />
          </>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <DocumentUploadDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={() => {
            setShowUploadDialog(false);
            refresh();
          }}
        />
      )}

      {/* Selection Footer - Absolute positioned at bottom */}
      {!isRawQueryMode && selectedDocuments.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-tp-surface border-t border-tp-border-strong shadow-lg z-10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-tp-text">
              {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocuments(new Set())}
                className="h-7 text-xs"
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isActiveConnectionReadOnly}
                title={isActiveConnectionReadOnly ? "Read-only connection: write operations disabled" : undefined}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
