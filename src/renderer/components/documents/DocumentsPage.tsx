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
import { convertFiltersToRawQuery } from "@/renderer/utils/filterConversion";

export const DocumentsPage: React.FC = () => {
  const { connectionId, namespaceId } = useParams<{ connectionId: string; namespaceId: string }>();
  const { getConnectionById } = useConnections();
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
  } = useDocumentsStore();
  
  // Subscribe to store state for filter dependencies
  const activeFilters = useDocumentsStore(state => state.activeFilters);
  const searchText = useDocumentsStore(state => state.searchText);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [isRawQueryMode, setIsRawQueryMode] = useState(false);
  const [initialRawQuery, setInitialRawQuery] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDocumentId, setActiveDocumentId] = useState<string | number | null>(null);

  // Single effect to handle initialization and loading
  useEffect(() => {
    const initializeAndLoad = async () => {
      if (namespaceId && connection) {
        // Set connection ID first
        setConnectionId(connection.id);

        // Set namespace first
        if (documents.length === 0 || currentNamespaceId !== namespaceId) {
          await setNamespace(namespaceId);
          // Reset to first page when changing namespaces
          setCurrentPage(1);
        }

        // Initialize the client with the current connection
        const initialized = await initializeClient(
          connection.id,
          connection.region
        );

        if (initialized) {
          // Load documents with current page size
          // Always load when refreshing
          loadDocuments(isRefreshing, false, pageSize);
        }
      }
    };

    initializeAndLoad();
  }, [namespaceId, connection, pageSize, isRefreshing]);

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
    try {
      const exportIds =
        selectedDocuments.size > 0
          ? Array.from(selectedDocuments).map((id) => String(id))
          : undefined;

      await exportDocuments(format, exportIds);

      toast.success("Export successful", {
        description: `Documents exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
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
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-tp-text">Documents</h1>
            {namespaceId && (
              <p className="text-xs text-tp-text-muted mt-0.5">
                <span className="font-mono text-tp-accent">{namespaceId}</span>
              </p>
            )}
          </div>
          <span className="text-tp-border-strong">│</span>
          <Button
            variant={isRawQueryMode ? "default" : "ghost"}
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
            className="h-7 gap-1.5 text-xs"
          >
            <Code className="h-3 w-3" />
            {isRawQueryMode ? "Raw" : "Visual"}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUploadDialog(true)}
            className="h-7 text-xs"
          >
            <Upload className="h-3 w-3 mr-1.5" />
            Upload
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Documents Table or Raw Response */}
      <div className="flex-1 overflow-hidden">
        {/* Show raw response if no documents but we have query results */}
        {documents.length === 0 && lastQueryResult && !loading && !error ? (
          <RawResponseViewer response={lastQueryResult} />
        ) : (
          <DocumentsTable
            documents={documents}
            loading={loading}
            onDocumentClick={handleDocumentClick}
            selectedDocuments={new Set(Array.from(selectedDocuments).map(String))}
            onInitialLoad={handleInitialLoad}
            activeDocumentId={activeDocumentId}
          />
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
