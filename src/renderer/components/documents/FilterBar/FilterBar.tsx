import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";
import { cn } from "@/lib/utils";
import { FilterBuilder } from "./FilterBuilder";
import { FilterChip } from "./FilterChip";
import { VectorSearchInput } from "../VectorSearchInput";


interface FilterBarProps {
  className?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}



export const FilterBar: React.FC<FilterBarProps> = ({ className, pageSize = 1000, onPageSizeChange }) => {
  const {
    documents,
    totalCount,
    unfilteredTotalCount,
    searchText,
    setSearchText,
    activeFilters,
    addFilter,
    updateFilter,
    removeFilter,
    clearAllFilters,
    isLoading,
    attributes,
    loadDocuments,
    visibleColumns,
    toggleColumn,
    setVisibleColumns,
    loadSchemaAndInitColumns,
    applyRecentFilter,
    currentPage,
    totalPages,
    sortAttribute,
    sortDirection,
    setSortAttribute,
    searchMode,
    searchField,
    setSearchMode,
    setSearchField,
    vectorQuery,
    vectorField,
    setVectorQuery,
  } = useDocumentsStore();

  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Subscribe to store for currentNamespaceId changes
  const currentNamespaceId = useDocumentsStore(state => state.currentNamespaceId);
  
  // Subscribe directly to recentFilterHistory from store
  const recentFilterHistory = useDocumentsStore(state => state.recentFilterHistory);
  
  // Get filter history reactively
  const recentHistory = useMemo(() => {
    if (!currentNamespaceId) return [];
    const history = recentFilterHistory.get(currentNamespaceId) || [];
    console.log('🔄 FilterBar: Computing recent history', {
      currentNamespaceId,
      historyCount: history.length,
      mapSize: recentFilterHistory.size
    });
    return history;
  }, [currentNamespaceId, recentFilterHistory]);

  // Get all available fields from documents and attributes
  const availableFields = useMemo(() => {
    const fieldMap = new Map<
      string,
      {
        name: string;
        type: string;
        sampleValues: any[];
        count: number;
      }
    >();

    // Always include ID field
    fieldMap.set("id", {
      name: "id",
      type: "string",
      sampleValues: [],
      count: documents.length,
    });

    // Process attributes from store
    attributes.forEach((attr) => {
      fieldMap.set(attr.name, {
        name: attr.name,
        type: attr.type || "string",
        sampleValues: [...(attr.sampleValues || [])], // Create a new array to avoid immutability issues
        count: attr.frequency || 0,
      });
    });

    // Process fields from documents
    documents.forEach((doc) => {
      // Process root-level fields
      Object.entries(doc).forEach(([key, value]) => {
        if (
          key !== "attributes" &&
          key !== "$dist" &&
          !key.includes("vector")
        ) {
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              name: key,
              type: Array.isArray(value)
                ? "array"
                : typeof value === "number"
                ? "number"
                : "string",
              sampleValues: [],
              count: 0,
            });
          }

          const field = fieldMap.get(key)!;
          field.count++;

          // Update type if we detect it's an array but wasn't marked as such
          if (Array.isArray(value) && field.type !== "array") {
            field.type = "array";
          }

          // Collect sample values
          if (Array.isArray(value)) {
            // For arrays, collect individual elements as sample values
            value.forEach((v) => {
              if (
                field.sampleValues.length < 1000 &&
                !field.sampleValues.includes(v) &&
                v !== null &&
                v !== undefined &&
                v !== ""
              ) {
                field.sampleValues.push(v);
              }
            });
          } else if (
            field.sampleValues.length < 20 &&
            !field.sampleValues.includes(value) &&
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            field.sampleValues.push(value);
          }
        }
      });

      // Also process attributes property if it exists
      if (doc.attributes && typeof doc.attributes === "object") {
        Object.entries(doc.attributes).forEach(([key, value]) => {
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              name: key,
              type: Array.isArray(value)
                ? "array"
                : typeof value === "number"
                ? "number"
                : "string",
              sampleValues: [],
              count: 0,
            });
          }

          const field = fieldMap.get(key)!;
          field.count++;

          // Update type if we detect it's an array but wasn't marked as such
          if (Array.isArray(value) && field.type !== "array") {
            field.type = "array";
          }

          // Collect sample values
          if (Array.isArray(value)) {
            // For arrays, collect individual elements as sample values
            value.forEach((v) => {
              if (
                field.sampleValues.length < 1000 &&
                !field.sampleValues.includes(v) &&
                v !== null &&
                v !== undefined &&
                v !== ""
              ) {
                field.sampleValues.push(v);
              }
            });
          } else if (
            field.sampleValues.length < 20 &&
            !field.sampleValues.includes(value) &&
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            field.sampleValues.push(value);
          }
        });
      }
    });

    const fields = Array.from(fieldMap.values())
      .map((field) => {
        // Sort sample values for array fields
        if (field.type === "array" && field.sampleValues.length > 0) {
          // Create a copy and sort it
          const sortedValues = [...field.sampleValues];
          // Check if all values are numbers
          if (sortedValues.every((v) => typeof v === "number")) {
            sortedValues.sort((a, b) => a - b);
          } else {
            sortedValues.sort();
          }
          field.sampleValues = sortedValues;
        }
        return field;
      })
      .sort((a, b) => {
        // Sort by: id first, then by count (most common fields)
        if (a.name === "id") return -1;
        if (b.name === "id") return 1;
        return b.count - a.count;
      });

    return fields;
  }, [documents, attributes]);

  // Load schema on mount
  useEffect(() => {
    loadSchemaAndInitColumns();
  }, []);

  // Sync local search text with store
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(localSearchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchText, setSearchText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to open filter
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !isFilterPopoverOpen) {
        e.preventDefault();
        setIsFilterPopoverOpen(true);
      }
      // / to focus search when not in input
      else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as Element).tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterPopoverOpen]);

  const handleClearSearch = () => {
    setLocalSearchText("");
    setSearchText("");
    searchInputRef.current?.focus();
  };


  const hasActiveFiltersOrSearch =
    activeFilters.length > 0 || searchText.length > 0;
  const filteredCount = documents.length;
  const totalDocCount = unfilteredTotalCount || totalCount || documents.length;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-3 py-2 bg-tp-surface border-b border-tp-border-subtle",
        className
      )}
    >
      {/* Main Filter Row */}
      <div className="flex items-center gap-1.5">
        {/* Enhanced Search Input */}
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-tp-text-muted" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="search all fields..."
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            className="pl-7 pr-8 h-7 text-xs"
            disabled={isLoading}
          />
          {localSearchText && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClearSearch}
              disabled={isLoading}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>

        {/* Search Mode Toggle */}
        <div className="flex items-center gap-0.5 border border-tp-border rounded-md p-0.5">
          <Button
            variant={searchMode === 'pattern' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => {
              setSearchMode('pattern');
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
          >
            Pattern
          </Button>
          <Button
            variant={searchMode === 'bm25' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => {
              setSearchMode('bm25');
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
          >
            BM25
          </Button>
          <Button
            variant={searchMode === 'vector' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => {
              setSearchMode('vector');
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
          >
            Vector
          </Button>
        </div>

        {/* BM25 Field Selector */}
        {searchMode === 'bm25' && (
          <Select
            value={searchField || "id"}
            onValueChange={(value) => {
              setSearchField(value);
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Field..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              {attributes
                .filter(attr => attr.type === 'string')
                .map((attr) => (
                  <SelectItem key={attr.name} value={attr.name}>
                    {attr.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Separator orientation="vertical" className="h-6 bg-tp-border-strong" />

        {/* Sort Controls */}
        <Select
          value={sortAttribute || "id"}
          onValueChange={(value) => {
            setSortAttribute(value, sortDirection);
            setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">ID</SelectItem>
            {attributes.map((attr) => (
              <SelectItem key={attr.name} value={attr.name}>
                {attr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortAttribute(sortAttribute || 'id', newDirection);
            setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
          }}
          disabled={isLoading}
        >
          {sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </Button>

        <Separator orientation="vertical" className="h-6 bg-tp-border-strong" />

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-7"
          onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
        >
          <Filter className="h-3 w-3" />
          filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 px-1 min-w-[16px] h-4 text-[9px]">
              {activeFilters.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-2.5 w-2.5 ml-0.5 transition-transform",
              isFilterPopoverOpen && "rotate-180"
            )}
          />
        </Button>

        {/* Filter History */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7"
            >
              <Clock className="h-3 w-3" />
              history
              {recentHistory.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 px-1 min-w-[16px] h-4 text-[9px]">
                  {recentHistory.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-96 max-h-[400px] overflow-y-auto bg-tp-surface border-tp-border-strong" align="start">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider">recent filters</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-tp-border-subtle" />
            {recentHistory.length === 0 ? (
              <div className="px-2 py-4 text-center text-[11px] text-tp-text-muted">
                no filter history yet
              </div>
            ) : (
              <>
                {recentHistory.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    className="flex flex-col items-start py-1.5 cursor-pointer text-xs"
                    onClick={() => applyRecentFilter(entry.id)}
                  >
                    <div className="text-xs font-medium text-tp-text">
                      {entry.description || (
                        <>
                          {entry.filters.length} filter{entry.filters.length !== 1 ? 's' : ''}
                          {entry.searchText && ` + search "${entry.searchText}"`}
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-tp-text-faint font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Column Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7">
              <Eye className="h-3 w-3" />
              columns ({visibleColumns.size}/{availableFields.length})
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto bg-tp-surface border-tp-border-strong">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider">toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-tp-border-subtle" />
            <DropdownMenuItem
              key="id"
              onClick={(e) => {
                e.preventDefault();
                toggleColumn("id");
                setTimeout(() => loadDocuments(true, false, pageSize), 100);
              }}
              className="text-xs"
            >
              <Checkbox
                checked={visibleColumns.has("id")}
                className="mr-1.5 h-3 w-3"
              />
              <span className="flex-1">id</span>
              <Badge variant="outline" className="ml-1.5">
                required
              </Badge>
            </DropdownMenuItem>
            {availableFields
              .filter(field => field.name !== "id")
              .map((field) => (
                <DropdownMenuItem
                  key={field.name}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(field.name);
                    setTimeout(() => loadDocuments(true, false, pageSize), 100);
                  }}
                  className="text-xs"
                >
                  <Checkbox
                    checked={visibleColumns.has(field.name)}
                    className="mr-1.5 h-3 w-3"
                  />
                  <span className="flex-1 font-mono text-tp-text">
                    {field.name}
                    {(field.name.includes("vector") ||
                      field.name === "attributes" ||
                      field.name === "$dist") && (
                      <Badge variant="outline" className="ml-1.5">
                        special
                      </Badge>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator className="bg-tp-border-subtle" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                const newColumns = new Set<string>(['id']);
                availableFields.forEach(field => {
                  if (!field.name.includes('vector') &&
                      !field.name.includes('embedding') &&
                      field.name !== '$dist' &&
                      field.name !== 'attributes' &&
                      field.name !== 'long_text'
                  ) {
                    newColumns.add(field.name);
                  }
                });
                setVisibleColumns(newColumns);
                setTimeout(() => loadDocuments(true, false, pageSize), 100);
              }}
              className="text-xs"
            >
              reset to default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Vector Search Input */}
      {searchMode === 'vector' && (
        <div className="px-3 pb-2">
          <VectorSearchInput
            onVectorChange={(vector, field) => {
              setVectorQuery(vector, field);
              if (vector && vector.length > 0) {
                setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
              }
            }}
            vectorFields={attributes
              .filter(attr => attr.name.toLowerCase().includes('vector') || attr.name.toLowerCase().includes('embedding'))
              .map(attr => attr.name)
              .concat(['vector']) // Add default 'vector' field
            }
            disabled={isLoading}
          />
        </div>
      )}

      {/* Enhanced Filter Builder */}
      {isFilterPopoverOpen && (
        <div className="mx-4 my-1">
          <FilterBuilder 
            fields={availableFields}
            activeFilters={activeFilters}
            onAddFilter={addFilter}
            onUpdateFilter={(filterId, field, operator, value) => {
              updateFilter(filterId, field, operator as any, value);
            }}
            onRemoveFilter={removeFilter}
          />
        </div>
      )}

      {/* Active Filters Row */}
      {activeFilters.length > 0 && !isFilterPopoverOpen && (
        <div className="flex items-center gap-2 px-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                filter={filter}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Document Count and Pagination */}
      <div className="flex items-center justify-between mt-1 px-4">
        <div className="text-xs text-muted-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-muted-foreground" />
              <span>Loading documents...</span>
            </div>
          ) : (
            <span>
              Showing{" "}
              {hasActiveFiltersOrSearch ? (
                <>
                  <span className="font-medium text-foreground">
                    {filteredCount >= 1000
                      ? "1000+"
                      : filteredCount.toLocaleString()}
                  </span>
                  <span> matching</span>
                  {unfilteredTotalCount && (
                    <>
                      <span> of </span>
                      <span className="font-medium text-foreground">
                        {totalDocCount.toLocaleString()}
                      </span>
                      <span> total</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {totalDocCount.toLocaleString()}
                  </span>
                  <span> total</span>
                </>
              )}
              <span> documents</span>
            </span>
          )}
        </div>

        {/* Page Size Selector and Pagination Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              const newSize = Number(value);
              if (onPageSizeChange) {
                onPageSizeChange(newSize);
              }
              loadDocuments(false, false, newSize);
            }}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {Math.min(((currentPage - 1) * pageSize) + 1, totalCount || 0)} - {Math.min(currentPage * pageSize, totalCount || 0)} of {totalCount?.toLocaleString() || 0}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPage > 1) {
                  loadDocuments(false, false, pageSize, currentPage - 1);
                }
              }}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadDocuments(false, false, pageSize, currentPage + 1);
              }}
              disabled={currentPage >= (totalPages || 1) || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Removed inline FilterBuilderPanel component - using enhanced FilterBuilder instead

// Using enhanced FilterChip component from separate file
