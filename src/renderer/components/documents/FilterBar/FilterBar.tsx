import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";
import { cn } from "@/lib/utils";
import { FilterBuilder } from "./FilterBuilder";
import { FilterChip } from "./FilterChip";
import { VectorSearchInput } from "../VectorSearchInput";
import { BM25ConfigPanel } from "../BM25ConfigPanel";
import { RankingExpressionBuilder } from "../RankingExpressionBuilder";
import { AggregationsPanel } from "../AggregationsPanel";
import { AggregationResults } from "../AggregationResults";
import { GroupBySelector } from "./GroupBySelector"; // NEW: Import GroupBySelector

interface FilterBarProps {
  className?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export const FilterBar: React.FC<FilterBarProps> = (
  { className, pageSize = 1000, onPageSizeChange },
) => {
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
    queryMode,
    searchField,
    setQueryMode,
    setSearchField,
    vectorQuery,
    vectorField,
    setVectorQuery,
    bm25Fields,
    bm25Operator,
    setBM25Config,
    rankingMode,
    rankingExpression,
    setRankingMode,
    setRankingExpression,
    aggregations,
    setAggregations,
    aggregationResults,
    wrapCellText,
    toggleWrapCellText,
    shrinkLargeText,
    toggleShrinkLargeText,
  } = useDocumentsStore();

  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isAggregationsOpen, setIsAggregationsOpen] = useState(false);
  const [showBM25Advanced, setShowBM25Advanced] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // BM25 mode state
  const [localBM25Fields, setLocalBM25Fields] = useState<string[]>(
    bm25Fields.map((f) => f.field),
  );
  const [localBM25Operator, setLocalBM25Operator] = useState<
    "sum" | "max" | "product"
  >(
    bm25Operator,
  );

  // Vector mode state
  const [localVectorInput, setLocalVectorInput] = useState<string>(
    vectorQuery ? JSON.stringify(vectorQuery) : "",
  );
  const [localVectorField, setLocalVectorField] = useState<string>(
    vectorField || "embedding",
  );

  // Subscribe to store for currentNamespaceId and client initialization changes
  const currentNamespaceId = useDocumentsStore((state) =>
    state.currentNamespaceId
  );
  const isClientInitialized = useDocumentsStore((state) =>
    state.isClientInitialized
  );

  // Subscribe directly to recentFilterHistory from store
  const recentFilterHistory = useDocumentsStore((state) =>
    state.recentFilterHistory
  );

  // Get filter history reactively
  const recentHistory = useMemo(() => {
    if (!currentNamespaceId) return [];
    const history = recentFilterHistory.get(currentNamespaceId) || [];
    console.log("🔄 FilterBar: Computing recent history", {
      currentNamespaceId,
      historyCount: history.length,
      mapSize: recentFilterHistory.size,
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

  // Load schema when namespace changes or client becomes initialized
  useEffect(() => {
    if (currentNamespaceId && isClientInitialized) {
      loadSchemaAndInitColumns();
    }
  }, [currentNamespaceId, isClientInitialized, loadSchemaAndInitColumns]);

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

  // Sync BM25 fields with store
  useEffect(() => {
    setLocalBM25Fields(bm25Fields.map((f) => f.field));
  }, [bm25Fields]);

  // Sync BM25 operator with store
  useEffect(() => {
    setLocalBM25Operator(bm25Operator);
  }, [bm25Operator]);

  // Apply BM25 config when changed
  useEffect(() => {
    if (queryMode === "bm25") {
      const fields = localBM25Fields.map((field) => ({ field, weight: 1.0 }));

      // Only update if values have actually changed (avoid infinite loop)
      const fieldsChanged =
        fields.length !== bm25Fields.length ||
        fields.some((f, i) => f.field !== bm25Fields[i]?.field);
      const operatorChanged = localBM25Operator !== bm25Operator;

      if (fieldsChanged || operatorChanged) {
        setBM25Config(fields, localBM25Operator);
      }
    }
  }, [localBM25Fields, localBM25Operator, queryMode, bm25Fields, bm25Operator]);

  // Sync vector input with store
  useEffect(() => {
    setLocalVectorInput(vectorQuery ? JSON.stringify(vectorQuery) : "");
  }, [vectorQuery]);

  // Sync vector field with store
  useEffect(() => {
    setLocalVectorField(vectorField || "embedding");
  }, [vectorField]);

  // Apply vector query when changed
  useEffect(() => {
    if (queryMode === "vector" && localVectorInput.trim()) {
      try {
        const parsed = JSON.parse(localVectorInput);
        if (
          Array.isArray(parsed) && parsed.every((n) => typeof n === "number")
        ) {
          setVectorQuery(parsed, localVectorField);
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [localVectorInput, localVectorField, queryMode]);

  // Reset BM25 advanced panel when switching modes
  useEffect(() => {
    if (queryMode !== "bm25") {
      setShowBM25Advanced(false);
    }
  }, [queryMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to open filter
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !isFilterPopoverOpen) {
        e.preventDefault();
        setIsFilterPopoverOpen(true);
      } // / to focus search when not in input
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

  const hasActiveFiltersOrSearch = activeFilters.length > 0 ||
    searchText.length > 0;
  const filteredCount = documents.length;
  const totalDocCount = unfilteredTotalCount || totalCount || documents.length;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-3 py-2 bg-tp-surface border-b border-tp-border-subtle",
        className,
      )}
    >
      {/* Row 1: Query Mode & Search */}
      <div className="flex items-start gap-2">
        {/* Query Mode Selector - Tier 1 Primary (FIRST) */}
        <div className="flex items-center gap-1 p-1 bg-muted/30">
          <Button
            variant={queryMode === "browse" ? "default" : "ghost"}
            size="sm"
            className={queryMode === "browse"
              ? "h-8 px-3 text-xs font-medium"
              : "h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"}
            onClick={() => {
              setQueryMode("browse");
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
            title="Browse all documents with filters and sorting"
          >
            browse
          </Button>
          <Button
            variant={queryMode === "bm25" ? "default" : "ghost"}
            size="sm"
            className={queryMode === "bm25"
              ? "h-8 px-3 text-xs font-medium"
              : "h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"}
            onClick={() => {
              setQueryMode("bm25");
              // Auto-select text fields if none are configured
              if (localBM25Fields.length === 0) {
                const textFields = attributes
                  .filter(attr => attr.type === 'string' || attr.type === '[]string')
                  .filter(attr => !['id', 'uuid', 'key'].includes(attr.name.toLowerCase()))
                  .slice(0, 3) // Select up to 3 text fields
                  .map(attr => attr.name);
                if (textFields.length > 0) {
                  setLocalBM25Fields(textFields);
                  setBM25Config(textFields.map(f => ({ field: f, weight: 1.0 })), localBM25Operator);
                }
              }
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
            title="Full-text search (BM25 ranking)"
          >
            full-text
          </Button>
          <Button
            variant={queryMode === "vector" ? "default" : "ghost"}
            size="sm"
            className={queryMode === "vector"
              ? "h-8 px-3 text-xs font-medium"
              : "h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"}
            onClick={() => {
              setQueryMode("vector");
              setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
            }}
            disabled={isLoading}
            title="Vector similarity search (ANN)"
          >
            vector
          </Button>
        </div>

        <Separator orientation="vertical" className="h-10 bg-tp-border" />

        {/* Mode-Specific Interfaces */}
        {queryMode === "browse" && (
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="relative w-full">
              <Search className="absolute w-3 h-3 -translate-y-1/2 left-2 top-1/2 text-tp-text-muted" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search by ID..."
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                className="h-8 pr-8 text-xs pl-7"
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
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Use <button
                className="underline hover:text-foreground"
                onClick={() => {
                  setQueryMode("bm25");
                  // Auto-select text fields if none are configured
                  if (localBM25Fields.length === 0) {
                    const textFields = attributes
                      .filter(attr => attr.type === 'string' || attr.type === '[]string')
                      .filter(attr => !['id', 'uuid', 'key'].includes(attr.name.toLowerCase()))
                      .slice(0, 3)
                      .map(attr => attr.name);
                    if (textFields.length > 0) {
                      setLocalBM25Fields(textFields);
                      setBM25Config(textFields.map(f => ({ field: f, weight: 1.0 })), localBM25Operator);
                    }
                  }
                  setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
                }}
              >
                full-text mode
              </button> for content search
            </div>
          </div>
        )}

        {queryMode === "bm25" && (
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="relative w-full">
              <Search className="absolute w-3 h-3 -translate-y-1/2 left-2 top-1/2 text-tp-text-muted" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Full-text search..."
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                className="h-8 pr-8 text-xs pl-7"
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
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Fields:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-xs">
                    {localBM25Fields.length > 0
                      ? `${localBM25Fields.length} field${localBM25Fields.length > 1 ? "s" : ""
                      }`
                      : "All fields"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {availableFields.slice(0, 20).map((field) => (
                    <DropdownMenuItem
                      key={field.name}
                      onSelect={(e) => {
                        e.preventDefault();
                        setLocalBM25Fields((prev) =>
                          prev.includes(field.name)
                            ? prev.filter((f) => f !== field.name)
                            : [...prev, field.name]
                        );
                      }}
                    >
                      <Checkbox
                        checked={localBM25Fields.includes(field.name)}
                        className="mr-2"
                      />
                      {field.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-4" />
              <RadioGroup
                value={localBM25Operator}
                onValueChange={(value) =>
                  setLocalBM25Operator(value as "sum" | "max" | "product")}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="sum" id="op-sum" className="w-3 h-3" />
                  <Label
                    htmlFor="op-sum"
                    className="text-[10px] text-muted-foreground cursor-pointer"
                  >
                    Any field
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value="product"
                    id="op-product"
                    className="w-3 h-3"
                  />
                  <Label
                    htmlFor="op-product"
                    className="text-[10px] text-muted-foreground cursor-pointer"
                  >
                    All fields
                  </Label>
                </div>
              </RadioGroup>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant={showBM25Advanced ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-[10px]"
                onClick={() => setShowBM25Advanced(!showBM25Advanced)}
              >
                {showBM25Advanced ? "Hide" : "Show"} Advanced
              </Button>
            </div>
          </div>
        )}

        {queryMode === "vector" && (
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Textarea
                placeholder="Enter vector: [1.2, 3.4, 5.6, ...]"
                value={localVectorInput}
                onChange={(e) => setLocalVectorInput(e.target.value)}
                className="w-full h-8 max-w-md text-xs resize-none min-h-8"
                disabled={isLoading}
              />
              {localVectorInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={() => setLocalVectorInput("")}
                  disabled={isLoading}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                Vector field:
              </span>
              <Select
                value={localVectorField}
                onValueChange={setLocalVectorField}
              >
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFields
                    .filter((f) =>
                      f.name.toLowerCase().includes("vector") ||
                      f.name.toLowerCase().includes("embedding")
                    )
                    .map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.name}
                      </SelectItem>
                    ))}
                  {availableFields.filter((f) =>
                    f.name.toLowerCase().includes("vector") ||
                    f.name.toLowerCase().includes("embedding")
                  ).length === 0 && (
                      <SelectItem value="embedding">embedding</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Unified Order Controls - Tier 2 */}
        <div className="flex items-center gap-1">
          <Select
            value={rankingMode === "expression"
              ? "custom"
              : (sortAttribute || "id")}
            onValueChange={(value) => {
              if (value === "custom") {
                setRankingMode("expression");
              } else if (value === "relevance") {
                setRankingMode("simple");
              } else if (value === "similarity") {
                setRankingMode("simple");
              } else {
                setSortAttribute(value, sortDirection);
                setRankingMode("simple");
                setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Browse Mode */}
              {queryMode === "browse" && (
                <>
                  <SelectItem value="id">id</SelectItem>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.name} value={attr.name}>
                      {attr.name}
                    </SelectItem>
                  ))}
                  <DropdownMenuSeparator />
                  <SelectItem value="custom">Custom expression...</SelectItem>
                </>
              )}

              {/* BM25 Mode */}
              {queryMode === "bm25" && (
                <>
                  <SelectItem value="relevance">Relevance (BM25)</SelectItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] px-2 py-1.5 text-muted-foreground">
                    Then by:
                  </DropdownMenuLabel>
                  <SelectItem value="id">id</SelectItem>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.name} value={attr.name}>
                      {attr.name}
                    </SelectItem>
                  ))}
                  <DropdownMenuSeparator />
                  <SelectItem value="custom">Custom expression...</SelectItem>
                </>
              )}

              {/* Vector Mode */}
              {queryMode === "vector" && (
                <>
                  <SelectItem value="similarity">
                    Similarity (distance)
                  </SelectItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] px-2 py-1.5 text-muted-foreground">
                    Then by:
                  </DropdownMenuLabel>
                  <SelectItem value="id">id</SelectItem>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.name} value={attr.name}>
                      {attr.name}
                    </SelectItem>
                  ))}
                  <DropdownMenuSeparator />
                  <SelectItem value="custom">Custom expression...</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Direction Toggle - only show when not using relevance/similarity/custom */}
          {rankingMode === "simple" &&
            sortAttribute !== "relevance" &&
            sortAttribute !== "similarity" && (
              <Button
                variant="outline"
                size="sm"
                className="h-[2rem] px-2 text-xs font-mono leading-none"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortAttribute(sortAttribute || "id", newDirection);
                  setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
                }}
                disabled={isLoading}
                title={`Toggle sort direction (currently ${sortDirection.toUpperCase()})`}
              >
                {sortDirection === "asc"
                  ? (
                    <>
                      ASC <ArrowUp className="w-3 h-3 ml-1" />
                    </>
                  )
                  : (
                    <>
                      DESC <ArrowDown className="w-3 h-3 ml-1" />
                    </>
                  )}
              </Button>
            )}
        </div>
      </div>

      {/* Row 2: Utility Controls (Filters, History, Aggregations, Columns) */}
      <div className="flex items-center gap-1.5">
        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-7"
          onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
        >
          <Filter className="w-3 h-3" />
          filters
          {activeFilters.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 px-1 min-w-[16px] h-4 text-[9px]"
            >
              {activeFilters.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 ml-0.5 transition-transform",
              isFilterPopoverOpen && "rotate-180",
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
              <Clock className="w-3 h-3" />
              history
              {recentHistory.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 px-1 min-w-[16px] h-4 text-[9px]"
                >
                  {recentHistory.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-96 max-h-[400px] overflow-y-auto bg-tp-surface border-tp-border-strong"
            align="start"
          >
            <DropdownMenuLabel className="text-xs tracking-wider uppercase">
              recent filters
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-tp-border-subtle" />
            {recentHistory.length === 0
              ? (
                <div className="px-2 py-4 text-center text-[11px] text-tp-text-muted">
                  no filter history yet
                </div>
              )
              : (
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
                            {entry.filters.length}{" "}
                            filter{entry.filters.length !== 1 ? "s" : ""}
                            {entry.searchText &&
                              ` + search "${entry.searchText}"`}
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

        {/* Aggregations Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-7"
          onClick={() => setIsAggregationsOpen(!isAggregationsOpen)}
        >
          <BarChart3 className="w-3 h-3" />
          aggregations
          {aggregations.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 px-1 min-w-[16px] h-4 text-[9px]"
            >
              {aggregations.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 ml-0.5 transition-transform",
              isAggregationsOpen && "rotate-180",
            )}
          />
        </Button>

        {/* Column Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 font-mono text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {/* Count only fields that are in availableFields */}
              {availableFields.filter(f => visibleColumns.has(f.name)).length}/{availableFields.length}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 overflow-y-auto max-h-96 bg-tp-surface border-tp-border-strong">
            {/* Search and quick actions */}
            <div className="px-2 py-2 flex items-center gap-2">
              <Input
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Search columns..."
                className="text-xs h-8"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  const all = new Set(availableFields.map((f) => f.name));
                  setVisibleColumns(all);
                  setTimeout(() => loadDocuments(true, false, pageSize), 100);
                }}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  setVisibleColumns(new Set());
                  setTimeout(() => loadDocuments(true, false, pageSize), 100);
                }}
              >
                Clear
              </Button>
            </div>

            <DropdownMenuLabel className="text-xs tracking-wider uppercase px-2">
              toggle columns
            </DropdownMenuLabel>
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
                className="mr-2 h-4 w-4 pointer-events-none focus:ring-0 focus-visible:ring-0"
              />
              <span className="flex-1">id</span>
              <Badge variant="outline" className="ml-1.5">
                required
              </Badge>
            </DropdownMenuItem>

            {availableFields
              .filter((field) => field.name !== "id")
              .filter((field) => field.name.toLowerCase().includes(columnSearch.toLowerCase()))
              .map((field) => (
                <DropdownMenuItem
                  key={field.name}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(field.name);
                    setTimeout(
                      () => loadDocuments(true, false, pageSize),
                      100,
                    );
                  }}
                  className="text-xs"
                >
                  <Checkbox
                    checked={visibleColumns.has(field.name)}
                    className="mr-2 h-4 w-4 pointer-events-none focus:ring-0 focus-visible:ring-0"
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

            {availableFields.filter((field) => field.name !== "id").filter((field) => field.name.toLowerCase().includes(columnSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-xs text-tp-text-muted">no columns match</div>
            )}

            <DropdownMenuSeparator className="bg-tp-border-subtle" />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                // Toggle wrap text option
                toggleWrapCellText();
              }}
              className="text-xs"
            >
              <Checkbox
                checked={wrapCellText}
                className="mr-2 h-4 w-4 pointer-events-none focus:ring-0 focus-visible:ring-0"
              />
              <span className="flex-1">wrap text</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                // Toggle shrink large text
                toggleShrinkLargeText();
              }}
              className="text-xs"
            >
              <Checkbox
                checked={shrinkLargeText}
                className="mr-2 h-4 w-4 pointer-events-none focus:ring-0 focus-visible:ring-0"
              />
              <span className="flex-1">shrink large text</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                const newColumns = new Set<string>(["id"]);
                availableFields.forEach((field) => {
                  if (
                    !field.name.includes("vector") &&
                    !field.name.includes("embedding") &&
                    field.name !== "$dist" &&
                    field.name !== "attributes" &&
                    field.name !== "long_text"
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

      {/* BM25 Configuration Panel - Advanced Mode */}
      {queryMode === "bm25" && showBM25Advanced && (
        <div className="px-3 pb-2">
          <BM25ConfigPanel
            availableFields={attributes
              .filter((attr) => attr.type === "string")
              .map((attr) => attr.name)}
            selectedFields={bm25Fields}
            onFieldsChange={(fields) => {
              setBM25Config(fields, bm25Operator);
              if (searchText.trim() && fields.length > 0) {
                setTimeout(
                  () => loadDocuments(true, false, pageSize, 1),
                  100,
                );
              }
            }}
            operator={bm25Operator}
            onOperatorChange={(op) => {
              setBM25Config(bm25Fields, op);
              if (searchText.trim() && bm25Fields.length > 0) {
                setTimeout(
                  () => loadDocuments(true, false, pageSize, 1),
                  100,
                );
              }
            }}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Vector Search Input */}
      {queryMode === "vector" && (
        <div className="px-3 pb-2">
          <VectorSearchInput
            onVectorChange={(vector, field) => {
              setVectorQuery(vector, field);
              if (vector && vector.length > 0) {
                setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
              }
            }}
            vectorFields={
              attributes
                .filter((attr) =>
                  attr.name.toLowerCase().includes("vector") ||
                  attr.name.toLowerCase().includes("embedding")
                )
                .map((attr) => attr.name)
                .concat(["vector"]) // Add default 'vector' field
            }
            disabled={isLoading}
          />
        </div>
      )}

      {/* Custom Ranking Expression Builder - Collapsible */}
      {rankingMode === "expression" && (
        <div className="p-3 mx-3 mb-2 border rounded-md bg-muted/30 border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">
                Custom Ranking Expression
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setRankingMode("simple");
                setTimeout(() => loadDocuments(true, false, pageSize, 1), 0);
              }}
            >
              Switch to simple
            </Button>
          </div>
          <RankingExpressionBuilder
            availableAttributes={[
              "id",
              ...attributes.map((attr) => attr.name),
            ]}
            expression={rankingExpression}
            onExpressionChange={(expr) => {
              setRankingExpression(expr);
              if (expr) {
                setTimeout(
                  () => loadDocuments(true, false, pageSize, 1),
                  100,
                );
              }
            }}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Aggregations Panel */}
      {isAggregationsOpen && (
        <div className="px-3 pb-2">
          <AggregationsPanel
            availableAttributes={[
              "id",
              ...attributes.map((attr) => attr.name),
            ]}
            aggregations={aggregations}
            onAggregationsChange={(aggs) => {
              setAggregations(aggs);
              if (aggs.length > 0) {
                setTimeout(
                  () => loadDocuments(true, false, pageSize, 1),
                  100,
                );
              }
            }}
            disabled={isLoading}
          />

          {/* NEW: Group By Selector */}
          <div className="mt-2">
            <GroupBySelector />
          </div>
        </div>
      )}

      {/* Aggregation Results */}
      {aggregationResults && aggregationResults.length > 0 && (
        <div className="px-3 pb-2">
          <AggregationResults
            results={aggregationResults}
            onClose={() => {
              // Keep the results visible, user can clear aggregations to hide
            }}
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
          <span className="text-sm text-muted-foreground">
            Active filters:
          </span>
          <div className="flex flex-wrap items-center flex-1 gap-2">
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

      {/* Results Summary & Pagination */}
      <div className="flex items-center justify-between gap-2 px-4 mt-1 text-xs text-muted-foreground">
        {isLoading
          ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading documents...</span>
            </div>
          )
          : (
            <>
              {/* Left: Document count */}
              <div className="flex items-center gap-1.5">
                {hasActiveFiltersOrSearch
                  ? (
                    <>
                      <span className="font-medium text-foreground">
                        {filteredCount >= 1000
                          ? "1000+"
                          : filteredCount.toLocaleString()}
                      </span>
                      <span>matching</span>
                      {unfilteredTotalCount && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-foreground">
                            {totalDocCount.toLocaleString()}
                          </span>
                          <span>total</span>
                        </>
                      )}
                    </>
                  )
                  : (
                    <>
                      <span className="font-medium text-foreground">
                        {totalDocCount.toLocaleString()}
                      </span>
                      <span>documents</span>
                    </>
                  )}
              </div>

              {/* Right: Page controls */}
              <div className="flex items-center gap-2">
                <span>Page {currentPage} of {totalPages || 1}</span>
                <span>•</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    const newSize = Number(value);
                    if (onPageSizeChange) {
                      onPageSizeChange(newSize);
                    }
                    loadDocuments(false, false, newSize, 1); // Reset to page 1 when changing page size
                  }}
                >
                  <SelectTrigger className="w-[5rem] h-6 py-0 text-xs bg-transparent border-0 hover:bg-muted">
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
                <span>per page</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) {
                      loadDocuments(false, false, pageSize, currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1 || isLoading}
                  className="w-6 h-6 p-0"
                  title="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    loadDocuments(false, false, pageSize, currentPage + 1);
                  }}
                  disabled={currentPage >= (totalPages || 1) || isLoading}
                  className="w-6 h-6 p-0"
                  title="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

// Removed inline FilterBuilderPanel component - using enhanced FilterBuilder instead

// Using enhanced FilterChip component from separate file
