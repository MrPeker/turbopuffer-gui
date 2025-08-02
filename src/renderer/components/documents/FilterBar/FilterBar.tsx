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
        count: attr.count || 0,
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

      {/* Inline Filter Builder Panel */}
      {isFilterPopoverOpen && (
        <div className="mx-4 my-1">
          <FilterBuilderPanel
            fields={availableFields}
            activeFilters={activeFilters}
            onAddFilter={(field, operator, value) => {
              addFilter(field, operator as any, value);
            }}
            onUpdateFilter={(filterId, field, operator, value) => {
              // Remove old filter and add new one
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

// Filter Builder Panel Component
interface FilterBuilderPanelProps {
  fields: Array<{
    name: string;
    type: string;
    sampleValues: any[];
    count: number;
  }>;
  activeFilters: SimpleFilter[];
  onAddFilter: (field: string, operator: string, value: any) => void;
  onUpdateFilter: (
    filterId: string,
    field: string,
    operator: string,
    value: any
  ) => void;
  onRemoveFilter: (filterId: string) => void;
}

const FilterBuilderPanel: React.FC<FilterBuilderPanelProps> = ({
  fields,
  activeFilters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
}) => {
  // Create a list that includes all active filters plus one empty row for adding new
  const filterRows = [
    ...activeFilters.map((filter) => ({
      id: filter.id,
      field: filter.attribute,
      operator: filter.operator,
      value: filter.value,
      isExisting: true,
    })),
    {
      id: "new-filter",
      field: "",
      operator: "equals",
      value: "",
      isExisting: false,
    },
  ];

  return (
    <div className="space-y-3">
      {filterRows.map((row) => (
        <FilterRow
          key={row.id}
          filter={row}
          fields={fields}
          onUpdate={(field, operator, value) => {
            if (row.isExisting) {
              onUpdateFilter(row.id, field, operator, value);
            } else {
              onAddFilter(field, operator, value);
            }
          }}
          onRemove={() => onRemoveFilter(row.id)}
          isNew={!row.isExisting}
        />
      ))}
    </div>
  );
};

// Single Filter Row Component
interface FilterRowProps {
  filter: {
    id: string;
    field: string;
    operator: string;
    value: any;
    isExisting: boolean;
  };
  fields: Array<{
    name: string;
    type: string;
    sampleValues: any[];
    count: number;
  }>;
  onUpdate: (field: string, operator: string, value: any) => void;
  onRemove: () => void;
  isNew: boolean;
}

const FilterRow: React.FC<FilterRowProps> = ({
  filter,
  fields,
  onUpdate,
  onRemove,
  isNew,
}) => {
  const [selectedField, setSelectedField] = useState<string>(filter.field);
  const [selectedOperator, setSelectedOperator] = useState<string>(
    filter.operator
  );
  const [filterValue, setFilterValue] = useState<string>(
    Array.isArray(filter.value) ? "" : String(filter.value || "")
  );
  const [multiSelectValue, setMultiSelectValue] = useState<(string | number)[]>(
    Array.isArray(filter.value) ? filter.value : []
  );

  const selectedFieldInfo = fields.find((f) => f.name === selectedField);

  // Dynamic placeholder based on operator
  const getPlaceholder = (operator: string) => {
    switch (operator) {
      case "matches":
      case "not_matches":
      case "imatches":
      case "not_imatches":
        return "e.g., *.tsx, /src/**, file-?.js";
      case "in":
      case "not_in":
        return "Comma-separated values";
      case "equals":
      case "not_equals":
        return "Enter exact value or null";
      case "contains":
        return "Text to search for";
      default:
        return "Enter value...";
    }
  };

  const operators = useMemo(() => {
    if (!selectedFieldInfo) return [];

    const type = selectedFieldInfo.type;
    if (type === "number") {
      return [
        { value: "equals", label: "Equals (=)" },
        { value: "not_equals", label: "Not equals (≠)" },
        { value: "greater", label: "Greater than (>)" },
        { value: "greater_or_equal", label: "Greater or equal (≥)" },
        { value: "less", label: "Less than (<)" },
        { value: "less_or_equal", label: "Less or equal (≤)" },
        { value: "in", label: "In list" },
        { value: "not_in", label: "Not in list" },
      ];
    } else if (type === "array") {
      return [
        { value: "contains", label: "Contains" },
        { value: "equals", label: "Contains value" },
        { value: "not_equals", label: "Does not contain" },
        { value: "in", label: "Contains any of" },
        { value: "not_in", label: "Contains none of" },
      ];
    } else {
      return [
        { value: "equals", label: "Equals (=)" },
        { value: "not_equals", label: "Not equals (≠)" },
        { value: "contains", label: "Contains text" },
        { value: "matches", label: "Matches pattern" },
        { value: "not_matches", label: "Not matches pattern" },
        { value: "imatches", label: "Matches (case insensitive)" },
        { value: "not_imatches", label: "Not matches (case insensitive)" },
        { value: "in", label: "In list" },
        { value: "not_in", label: "Not in list" },
        { value: "greater", label: "Greater than (>)" },
        { value: "greater_or_equal", label: "Greater or equal (≥)" },
        { value: "less", label: "Less than (<)" },
        { value: "less_or_equal", label: "Less or equal (≤)" },
      ];
    }
  }, [selectedFieldInfo]);

  const handleApply = () => {
    const isArrayField = selectedFieldInfo?.type === "array";
    const useMultiSelect =
      isArrayField &&
      (selectedOperator === "contains" ||
        selectedOperator === "in" ||
        selectedOperator === "not_in" ||
        selectedOperator === "equals" ||
        selectedOperator === "not_equals");

    if (
      selectedField &&
      selectedOperator &&
      (useMultiSelect ? multiSelectValue.length > 0 : filterValue)
    ) {
      // Process value based on operator and field type
      let processedValue: any = filterValue;

      if (useMultiSelect) {
        // For array fields with multi-select
        processedValue = multiSelectValue;
      } else if (selectedOperator === "in" || selectedOperator === "not_in") {
        // Handle comma-separated values for non-array fields
        processedValue = filterValue
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
      }
      // Handle null value
      else if (
        filterValue.toLowerCase() === "null" &&
        (selectedOperator === "equals" || selectedOperator === "not_equals")
      ) {
        processedValue = null;
      }

      onUpdate(selectedField, selectedOperator, processedValue);

      // Reset new filter row
      if (isNew) {
        setSelectedField("");
        setSelectedOperator("equals");
        setFilterValue("");
        setMultiSelectValue([]);
      }
    }
  };

  // Update filter when field or operator changes for existing filters
  useEffect(() => {
    if (!isNew && filter.field !== selectedField) {
      setSelectedField(filter.field);
    }
    if (!isNew && filter.operator !== selectedOperator) {
      setSelectedOperator(filter.operator);
    }
  }, [filter.field, filter.operator, isNew]);

  // Auto-apply changes for existing filters
  const handleFieldChange = (newField: string) => {
    setSelectedField(newField);
    if (!isNew) {
      // Reset operator based on field type
      const fieldInfo = fields.find((f) => f.name === newField);
      const newOperator = fieldInfo?.type === "array" ? "contains" : "equals";
      setSelectedOperator(newOperator);
      // Clear values
      setFilterValue("");
      setMultiSelectValue([]);
      // Apply immediately for existing filters
      handleApply();
    }
  };

  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator);
    if (!isNew && selectedField) {
      handleApply();
    }
  };

  const handleValueChange = () => {
    if (!isNew && selectedField && selectedOperator) {
      handleApply();
    }
  };

  return (
    <div className="grid grid-cols-[1fr,180px,1fr,auto] gap-3 items-center">
      {/* Field Selection */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-9"
          >
            {selectedField || "Select field..."}
            <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[200px] max-h-[300px] overflow-y-auto"
          align="start"
        >
          {fields.map((field) => (
            <DropdownMenuItem
              key={field.name}
              onClick={() => handleFieldChange(field.name)}
            >
              <span className="flex-1">{field.name}</span>
              <Badge variant="outline" className="text-xs ml-2">
                {field.type}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Operator Selection */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-9"
            disabled={!selectedField}
          >
            {operators.find((op) => op.value === selectedOperator)?.label ||
              "Select..."}
            <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px]" align="start">
          {operators.map((op) => (
            <DropdownMenuItem
              key={op.value}
              onClick={() => handleOperatorChange(op.value)}
            >
              {op.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Value Input */}
      {selectedFieldInfo?.type === "array" &&
      (selectedOperator === "contains" ||
        selectedOperator === "in" ||
        selectedOperator === "not_in" ||
        selectedOperator === "equals" ||
        selectedOperator === "not_equals") ? (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={(newValues) => {
            setMultiSelectValue(newValues);
            handleValueChange();
          }}
          options={selectedFieldInfo.sampleValues.map((v) => ({
            value: v,
            label: String(v),
          }))}
          placeholder={getPlaceholder(selectedOperator)}
          disabled={!selectedField || !selectedOperator}
          className="w-full"
          allowCreate={true}
        />
      ) : selectedFieldInfo && selectedFieldInfo.sampleValues.length > 0 ? (
        // Show dropdown for string fields with sample values
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Input
                placeholder={getPlaceholder(selectedOperator)}
                value={filterValue}
                className="h-9 pr-8"
                disabled={!selectedField || !selectedOperator}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApply();
                  }
                }}
                onBlur={handleValueChange}
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[300px] max-h-[300px] overflow-y-auto"
            align="start"
          >
            {selectedFieldInfo.sampleValues.map((value, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={() => {
                  setFilterValue(String(value));
                  handleValueChange();
                }}
              >
                <span className="truncate">{String(value)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Input
          placeholder={getPlaceholder(selectedOperator)}
          value={filterValue}
          className="h-9"
          disabled={!selectedField || !selectedOperator}
          onChange={(e) => setFilterValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleApply();
            }
          }}
          onBlur={handleValueChange}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-1">
        {isNew ? (
          <Button
            size="sm"
            onClick={handleApply}
            disabled={
              !selectedField ||
              !selectedOperator ||
              (selectedFieldInfo?.type === "array" &&
              (selectedOperator === "contains" ||
                selectedOperator === "in" ||
                selectedOperator === "not_in" ||
                selectedOperator === "equals" ||
                selectedOperator === "not_equals")
                ? multiSelectValue.length === 0
                : !filterValue)
            }
            className="h-9"
          >
            <Plus className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="h-9 w-9 p-0 rounded-md hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced Filter Chip Component
interface FilterChipProps {
  filter: {
    id: string;
    attribute: string;
    operator: string;
    value: any;
    displayValue: string;
  };
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ filter, onRemove }) => {
  const operatorLabels: Record<string, string> = {
    equals: "=",
    not_equals: "≠",
    contains: "∋",
    greater: ">",
    greater_or_equal: "≥",
    less: "<",
    less_or_equal: "≤",
    in: "∈",
    not_in: "∉",
    matches: "≈",
    not_matches: "≉",
    imatches: "≈i",
    not_imatches: "≉i",
  };

  // Format display value more nicely
  const formatDisplayValue = () => {
    if (filter.value === null) {
      return "null";
    } else if (Array.isArray(filter.value)) {
      if (filter.value.length > 3) {
        return `[${filter.value.slice(0, 3).join(", ")}, ...]`;
      }
      return `[${filter.value.join(", ")}]`;
    } else {
      return String(filter.value);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/60 hover:bg-secondary/80 rounded-md border border-border/50 transition-colors group">
      <span className="text-xs font-medium">{filter.attribute}</span>
      <span className="text-xs text-muted-foreground">
        {operatorLabels[filter.operator] || filter.operator}
      </span>
      <span
        className="text-xs max-w-[120px] truncate"
        title={formatDisplayValue()}
      >
        {formatDisplayValue()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="h-3.5 w-3.5 p-0 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
