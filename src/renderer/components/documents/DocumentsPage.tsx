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
import { useConnection } from "@/renderer/contexts/ConnectionContext";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";
import { useNamespace } from "@/renderer/contexts/NamespaceContext";
import { useToast } from "@/hooks/use-toast";
import { DocumentsTable } from "./DocumentsTable";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { FilterBar } from "./FilterBar/FilterBar";
import { RawQueryBar } from "./RawQueryBar";

export const DocumentsPage: React.FC = () => {
  const { namespaceId } = useParams<{ namespaceId: string }>();
  const { selectedConnection } = useConnection();
  const { selectedNamespace, loadNamespaceById } = useNamespace();
  const { toast } = useToast();
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
  } = useDocumentsStore();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pageSize, setPageSize] = useState(1000);
  const [isRawQueryMode, setIsRawQueryMode] = useState(false);

  // Auto-select namespace if URL has namespaceId but no namespace is selected
  useEffect(() => {
    const autoSelectNamespace = async () => {
      if (namespaceId && selectedConnection && (!selectedNamespace || selectedNamespace.id !== namespaceId)) {
        console.log(`Auto-selecting namespace: ${namespaceId}`);
        try {
          await loadNamespaceById(namespaceId);
        } catch (error) {
          console.error('Failed to auto-select namespace:', error);
          // If namespace doesn't exist, redirect to namespace selection
          toast.error('Namespace not found', {
            description: `The namespace "${namespaceId}" does not exist or is not accessible.`,
          });
        }
      }
    };

    autoSelectNamespace();
  }, [namespaceId, selectedConnection, selectedNamespace, loadNamespaceById, toast]);

  // Single effect to handle initialization and loading
  useEffect(() => {
    const initializeAndLoad = async () => {
      if (namespaceId && selectedConnection) {
        // Set connection ID first
        setConnectionId(selectedConnection.id);
        
        // Set namespace first
        if (documents.length === 0 || currentNamespaceId !== namespaceId) {
          await setNamespace(namespaceId);
        }

        // Initialize the client with the current connection
        const initialized = await initializeClient(
          selectedConnection.id,
          selectedConnection.region
        );

        if (initialized) {
          // Load documents with current page size
          loadDocuments(false, false, pageSize);
        }
      }
    };

    initializeAndLoad();
  }, [namespaceId, selectedConnection, pageSize]); // Include pageSize in deps

  const handleRefresh = () => {
    refresh();
  };

  const handleRetryConnection = async () => {
    if (namespaceId && selectedConnection) {
      // Reset initialization state and retry
      resetInitialization();
      const initialized = await initializeClient(
        selectedConnection.id,
        selectedConnection.region
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
    }
  };

  const handleLoadMore = () => {
    loadDocuments(false, true, pageSize);
  };

  const handleInitialLoad = () => {
    loadDocuments(false, false, pageSize);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Documents</h1>
            <Button
              variant={isRawQueryMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRawQueryMode(!isRawQueryMode)}
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              {isRawQueryMode ? "Raw Query" : "Query Mode"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filter Bar or Raw Query Bar */}
      {isRawQueryMode ? (
        <RawQueryBar namespaceId={namespaceId || ''} />
      ) : (
        <FilterBar 
          className="sticky top-0 z-10" 
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
          }}
        />
      )}

      {/* Bulk Actions */}
      {!isRawQueryMode && selectedDocuments.size > 0 && (
        <div className="px-4 py-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {selectedDocuments.size} document(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocuments(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {error.includes("Failed to") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryConnection}
                className="ml-4"
              >
                Retry Connection
              </Button>
            )}
          </AlertDescription>
        </Alert>
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
            hasMore={!!nextCursor}
            onLoadMore={handleLoadMore}
            onDocumentClick={setSelectedDocument}
            selectedDocuments={new Set(Array.from(selectedDocuments).map(String))}
            onInitialLoad={handleInitialLoad}
          />
        )}
      </div>

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={() => {
            refresh();
            setSelectedDocument(null);
          }}
        />
      )}

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
    </div>
  );
};
