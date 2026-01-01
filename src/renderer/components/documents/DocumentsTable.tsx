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
  onDocumentClick: (doc: any) => void;
  selectedDocuments: Set<string | number>;
  onInitialLoad?: () => void;
  activeDocumentId?: string | number | null;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  loading,
  onDocumentClick,
  selectedDocuments,
  onInitialLoad,
  activeDocumentId = null,
}) => {
  const { setSelectedDocuments, visibleColumns, attributes, wrapCellText, shrinkLargeText } = useDocumentsStore();
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
      return <span className="text-tp-text-faint italic">null</span>;
    }

    // Special handling for ID field - show with vector dimension if available
    if (key === 'id' && doc) {
      const vectorDim = doc.vector ? doc.vector.length : null;
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-tp-accent">{value}</span>
          {vectorDim && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-tp-surface border-tp-border-strong">
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
          <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-tp-surface-alt border-tp-border-subtle">
            [{value.length}D]
          </Badge>
        );
      }

      // For non-vector arrays, show actual values if short enough
      const arrayStr = JSON.stringify(value);
      if (arrayStr.length <= 50) {
        return (
          <span className="text-tp-text-muted">
            {arrayStr}
          </span>
        );
      } else {
        return (
          <Badge variant="outline" className="text-[10px] h-4 px-1">
            [{value.length}]
          </Badge>
        );
      }
    }

    // Handle objects
    if (typeof value === 'object') {
      const json = JSON.stringify(value, null, 2);
      if (wrapCellText) {
        return (
          <pre className={`whitespace-pre-wrap text-xs max-w-[36rem] break-words`} title={json}>
            {json}
          </pre>
        );
      }
      return (
        <Badge variant="outline" className="text-[10px] h-4 px-1 max-w-xs truncate">
          {JSON.stringify(value).substring(0, 40)}...
        </Badge>
      );
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'} className="text-[10px] h-4 px-1">
          {value.toString()}
        </Badge>
      );
    }

    // Handle long strings
    if (typeof value === 'string' && value.length > 80) {
      const shrinkClass = shrinkLargeText && value.length > 160 ? 'text-xs' : '';
      if (wrapCellText) {
        return (
          <span className={`whitespace-normal break-words ${shrinkClass} block`} title={value}>
            {value}
          </span>
        );
      }
      return (
        <span className={`truncate max-w-xs block ${shrinkClass}`} title={value}>
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
      <div className="flex items-center justify-center h-full bg-tp-bg">
        <div className="text-center">
          <p className="text-xs text-tp-text-muted mb-3">no documents found</p>
          <Button variant="outline" onClick={onInitialLoad} className="text-xs h-7">
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
    <div className="flex flex-col h-full relative bg-tp-bg">
      {/* Loading overlay for existing data */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-tp-bg/90 z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 bg-tp-surface px-4 py-2 border border-tp-border-subtle">
            <div className="h-0.5 w-24 bg-tp-border-subtle overflow-hidden">
              <div className="h-full w-1/3 bg-tp-accent animate-pulse" />
            </div>
            <span className="text-xs text-tp-text-muted font-mono">updating...</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto overflow-x-auto"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-tp-surface z-10 border-b border-tp-border-subtle">
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="w-12 h-9 px-4 text-xs font-bold text-tp-text-muted cursor-pointer"
                onClick={() => !loading && toggleAllDocuments()}
              >
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleAllDocuments()}
                  disabled={loading}
                  className="h-3 w-3 pointer-events-none"
                />
              </TableHead>
              {Array.from(visibleColumns).filter(col => allColumns.includes(col)).map(column => (
                <TableHead
                  key={column}
                  className="min-w-[120px] h-9 px-4 text-xs font-bold text-tp-text-muted"
                  style={{ width: columnWidths[column] }}
                >
                  {column}
                </TableHead>
              ))}
              <TableHead className="w-16 h-8 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc, index) => {
              const isActive = activeDocumentId !== null && doc.id === activeDocumentId;
              return (
                <TableRow
                  key={doc.id || index}
                  className={`group cursor-pointer hover:bg-tp-surface-alt border-b border-tp-border-subtle/50 border-l-2 ${wrapCellText ? 'min-h-12' : 'h-12'} transition-all ${isActive ? 'border-l-tp-accent bg-tp-surface-alt' : 'border-l-transparent hover:border-l-tp-surface-alt'
                    }`}
                  onClick={() => onDocumentClick(doc)}
                >
                  <TableCell
                    className="py-3 pl-[14px] pr-4 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDocumentSelection(doc.id);
                    }}
                  >
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                      className="h-3 w-3 pointer-events-none"
                    />
                  </TableCell>
                  {Array.from(visibleColumns).filter(col => allColumns.includes(col)).map(column => {
                    const value = doc[column] !== undefined ? doc[column] : doc.attributes?.[column];
                    return (
                      <TableCell key={column} className={`py-3 px-4 text-sm text-tp-text font-mono group-hover:text-tp-text ${wrapCellText ? 'align-top' : 'align-middle'}`}>
                        {formatCellValue(value, column, doc)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-sm">
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
              );
            })}
            {showSkeleton && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumns.size + 2} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-0.5 w-32 bg-tp-border-subtle overflow-hidden">
                      <div className="h-full w-1/3 bg-tp-accent animate-pulse" />
                    </div>
                    <span className="text-xs text-tp-text-muted font-mono">loading documents...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </div>
    </div>
  );
};
