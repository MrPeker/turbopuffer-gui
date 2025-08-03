import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Filter,
  ChevronDown,
  Hash,
  Eye,
  Clock,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";
import { cn } from "@/lib/utils";
import { MultiSelectInput } from "./MultiSelectInput";
import { FilterBuilder } from "./FilterBuilder";
import { FilterChip } from "./FilterChip";

// Import SimpleFilter type from the documentsStore file
interface SimpleFilter {
  id: string;
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "greater" | "greater_or_equal" | "less" | "less_or_equal" | "in" | "not_in" | "matches" | "not_matches" | "imatches" | "not_imatches";
  value: any;
  displayValue: string;
}

interface FilterHistoryEntry {
  id: string;
  name: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  appliedCount: number;
}

interface RecentFilterEntry {
  id: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  description?: string;
}

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
    removeFilter,
    clearAllFilters,
    isLoading,
    attributes,
    loadDocuments,
    visibleColumns,
    toggleColumn,
    setVisibleColumns,
    loadSchemaAndInitColumns,
    saveToFilterHistory,
    applyFilterFromHistory,
    deleteFilterFromHistory,
    getNamespaceFilterHistory,
    getNamespaceRecentHistory,
    applyRecentFilter,
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
        sampleValues: attr.sampleValues || [],
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
        "flex flex-col gap-2 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Main Filter Row */}
      <div className="flex items-center gap-2 px-4">
        {/* Enhanced Search Input */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by ID..."
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {localSearchText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="default"
          className="gap-2 h-10"
          onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 min-w-[20px] h-5">
              {activeFilters.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 ml-1 transition-transform",
              isFilterPopoverOpen && "rotate-180"
            )}
          />
        </Button>
        
        {/* Filter History - Simple dropdown without tabs */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2 h-10"
            >
              <Clock className="h-4 w-4" />
              History
              {recentHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 min-w-[20px] h-5">
                  {recentHistory.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-96 max-h-[400px] overflow-y-auto" align="start">
            <DropdownMenuLabel>Recent Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentHistory.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No filter history yet
              </div>
            ) : (
              <>
                {recentHistory.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    className="flex flex-col items-start py-2 cursor-pointer"
                    onClick={() => applyRecentFilter(entry.id)}
                  >
                    <div className="text-sm font-medium">
                      {entry.description || (
                        <>
                          {entry.filters.length} filter{entry.filters.length !== 1 ? 's' : ''}
                          {entry.searchText && ` + search "${entry.searchText}"`}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
            <Button variant="outline" size="default" className="gap-2 h-10">
              <Eye className="h-4 w-4" />
              Columns ({visibleColumns.size}/{availableFields.length})
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              key="id"
              onClick={(e) => {
                e.preventDefault();
                toggleColumn("id");
                // Reload documents with updated columns
                setTimeout(() => loadDocuments(true, false, pageSize), 100);
              }}
            >
              <Checkbox
                checked={visibleColumns.has("id")}
                className="mr-2"
              />
              <span className="flex-1">id</span>
              <Badge variant="outline" className="ml-2 text-xs">
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
                    // Reload documents with updated columns
                    setTimeout(() => loadDocuments(true, false, pageSize), 100);
                  }}
                >
                  <Checkbox
                    checked={visibleColumns.has(field.name)}
                    className="mr-2"
                  />
                  <span className="flex-1">
                    {field.name}
                    {(field.name.includes("vector") ||
                      field.name === "attributes" ||
                      field.name === "$dist") && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        special
                      </Badge>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                // Select all non-special columns
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
                // Reload documents with updated columns
                setTimeout(() => loadDocuments(true, false, pageSize), 100);
              }}
            >
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* Enhanced Filter Builder */}
      {isFilterPopoverOpen && (
        <div className="mx-4 my-1">
          <FilterBuilder 
            fields={availableFields}
            activeFilters={activeFilters}
            onAddFilter={addFilter}
            onUpdateFilter={(filterId, field, operator, value) => {
              removeFilter(filterId);
              addFilter(field, operator as any, value);
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

      {/* Document Count */}
      <div className="flex items-center justify-between mt-1 px-4">
        <div className="text-sm text-muted-foreground">
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
        
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
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
        </div>
      </div>
    </div>
  );
};

// Removed inline FilterBuilderPanel component - using enhanced FilterBuilder instead

// Using enhanced FilterChip component from separate file
