import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';

interface DocumentsTableProps {
  documents: any[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDocumentClick: (doc: any) => void;
  selectedDocuments: Set<string>;
  onInitialLoad?: () => void;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  hasMore,
  onLoadMore,
  onDocumentClick,
  selectedDocuments,
  onInitialLoad,
}) => {
  const { setSelectedDocuments, visibleColumns, attributes } = useDocumentsStore();
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track if this is the first load
  useEffect(() => {
    if (documents.length > 0) {
      setIsInitialLoad(false);
    }
  }, [documents.length]);

  // Get all columns from documents and attributes
  const allColumns = React.useMemo(() => {
    const cols = new Set<string>();
    
    // Always include id
    cols.add('id');
    
    // Add from attributes
    attributes.forEach(attr => {
      cols.add(attr.name);
    });
    
    // Add from documents if not already present
    documents.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        if (key !== "attributes") cols.add(key);
      });
      if (doc.attributes && typeof doc.attributes === "object") {
        Object.keys(doc.attributes).forEach((key) => cols.add(key));
      }
    });
    
    const colArray = Array.from(cols);
    // Ensure 'id' is always first if it exists
    const idIndex = colArray.indexOf("id");
    if (idIndex > 0) {
      colArray.splice(idIndex, 1);
      colArray.unshift("id");
    }
    return colArray;
  }, [documents, attributes]);


  const isAllSelected = documents.length > 0 && 
    documents.every(doc => selectedDocuments.has(doc.id));
  const isPartiallySelected = documents.some(doc => selectedDocuments.has(doc.id)) && 
    !isAllSelected;

  const toggleDocumentSelection = (id: string | number) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedDocuments(newSelection);
  };

  const toggleAllDocuments = () => {
    if (isAllSelected) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    }
  };

  const formatCellValue = (value: any, key: string, doc?: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>;
    }

    // Special handling for ID field - show with vector dimension if available
    if (key === 'id' && doc) {
      const vectorDim = doc.vector ? doc.vector.length : null;
      return (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {vectorDim && (
            <Badge variant="outline" className="text-xs">
              {vectorDim}D
            </Badge>
          )}
        </div>
      );
    }

    // Handle vectors/arrays
    if (Array.isArray(value)) {
      if (key.includes('vector') || key.includes('embedding')) {
        return (
          <Badge variant="secondary" className="font-mono text-xs">
            {value.length}D vector
          </Badge>
        );
      }
      
      // For non-vector arrays, show actual values if short enough
      const arrayStr = JSON.stringify(value);
      if (arrayStr.length <= 50) {
        // Show the actual array values
        return (
          <span className="font-mono text-xs">
            {arrayStr}
          </span>
        );
      } else {
        // For longer arrays, show count
        return (
          <Badge variant="outline" className="font-mono text-xs">
            [{value.length} items]
          </Badge>
        );
      }
    }

    // Handle objects
    if (typeof value === 'object') {
      return (
        <Badge variant="outline" className="font-mono text-xs">
          {JSON.stringify(value).substring(0, 50)}...
        </Badge>
      );
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value.toString()}
        </Badge>
      );
    }

    // Handle long strings
    if (typeof value === 'string' && value.length > 100) {
      return (
        <span className="truncate max-w-xs" title={value}>
          {value}
        </span>
      );
    }

    return value;
  };

  // Remove auto-loading on scroll - make it manual only
  const handleScroll = () => {
    // No longer auto-loading on scroll
  };

  if (documents.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No documents found</p>
          <Button variant="outline" onClick={onInitialLoad || onLoadMore}>
            Load Documents
          </Button>
        </div>
      </div>
    );
  }

  // Show skeleton for initial load, overlay for subsequent loads
  const showSkeleton = loading && isInitialLoad && documents.length === 0;
  const showLoadingOverlay = loading && !isInitialLoad && documents.length > 0;

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading overlay for existing data */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-md border">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Updating results...</span>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isPartiallySelected || undefined}
                  onCheckedChange={() => toggleAllDocuments()}
                  disabled={loading}
                />
              </TableHead>
              {Array.from(visibleColumns).filter(col => allColumns.includes(col)).map(column => (
                <TableHead 
                  key={column}
                  className="min-w-[100px]"
                  style={{ width: columnWidths[column] }}
                >
                  {column}
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc, index) => (
              <TableRow 
                key={doc.id || index}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onDocumentClick(doc)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedDocuments.has(doc.id)}
                    onCheckedChange={() => toggleDocumentSelection(doc.id)}
                  />
                </TableCell>
                {Array.from(visibleColumns).filter(col => allColumns.includes(col)).map(column => {
                  const value = doc[column] !== undefined ? doc[column] : doc.attributes?.[column];
                  return (
                    <TableCell key={column}>
                      {formatCellValue(value, column, doc)}
                    </TableCell>
                  );
                })}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDocumentClick(doc)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {showSkeleton && (
              <>
                {[...Array(10)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    {Array.from(visibleColumns).filter(col => allColumns.includes(col)).map(column => (
                      <TableCell key={column}>
                        <Skeleton className="h-4 w-[80%]" />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {/* Load More - placed at the end of table body */}
            {hasMore && !loading && (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 2} className="text-center py-8">
                  <Button variant="outline" onClick={onLoadMore}>
                    Load More Documents
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};