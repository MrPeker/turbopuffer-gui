import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, X, Check, CornerDownLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelectInput } from "./MultiSelectInput";
import {
  isArrayType,
  isNumericType
} from "@/renderer/utils/filterTypeConversion";
import type { FilterOperator, SimpleFilter } from "@/renderer/stores/documentsStore";

interface FieldInfo {
  name: string;
  type: string;
  sampleValues: any[];
  count: number;
  isFts?: boolean; // Whether this field has full-text search enabled
}

interface FilterBuilderProps {
  fields: FieldInfo[];
  activeFilters: SimpleFilter[];
  onAddFilter: (field: string, operator: FilterOperator, value: any) => void;
  onUpdateFilter: (
    filterId: string,
    field: string,
    operator: FilterOperator,
    value: any
  ) => void;
  onRemoveFilter: (filterId: string) => void;
}

interface OperatorOption {
  value: FilterOperator;
  label: string;          // Human-readable description
  apiOperator: string;    // The actual Turbopuffer API operator
  group?: string;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
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
  // Store the actual typed value from dropdown selection
  const [actualValue, setActualValue] = useState<any>(null);
  // Popover state for value suggestions
  const [valuePopoverOpen, setValuePopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedFieldInfo = fields.find((f) => f.name === selectedField);

  // Deduplicate and filter sample values based on input
  const filteredSampleValues = useMemo(() => {
    if (!selectedFieldInfo?.sampleValues) return [];

    // Deduplicate sample values (preserving original types)
    const seen = new Set<string>();
    const uniqueValues = selectedFieldInfo.sampleValues.filter(v => {
      const key = JSON.stringify(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!filterValue.trim()) return uniqueValues;

    const searchLower = filterValue.toLowerCase();
    return uniqueValues.filter(v =>
      String(v).toLowerCase().includes(searchLower)
    );
  }, [selectedFieldInfo?.sampleValues, filterValue]);

  // Dynamic placeholder based on operator
  const getPlaceholder = (operator: string) => {
    switch (operator) {
      case "matches":
      case "not_matches":
      case "imatches":
      case "not_imatches":
        return "e.g., *.tsx, /src/**, file-?.js";
      case "regex":
        return "e.g., ^error.*500$, [a-z]+@[a-z]+\\.com";
      case "in":
      case "not_in":
      case "contains_any":
      case "not_contains_any":
        return "Comma-separated values";
      case "equals":
      case "not_equals":
        return "Enter exact value or null";
      case "contains":
      case "array_contains":
      case "not_array_contains":
        return "Value to search for";
      case "contains_all_tokens":
        return "Space-separated words";
      case "contains_token_sequence":
        return "Exact phrase to match";
      default:
        return "Enter value...";
    }
  };

  // Define operators for different field types
  const operators: OperatorOption[] = useMemo(() => {
    if (!selectedFieldInfo) return [];

    const type = selectedFieldInfo.type;
    const isFts = selectedFieldInfo.isFts;
    const isNumericArray = type.includes('int') || type.includes('uint') || type.includes('float') || type === '[]number';

    // Operators for array fields
    if (isArrayType(type)) {
      const ops: OperatorOption[] = [
        // Containment (single value)
        { value: "array_contains", apiOperator: "Contains", label: "Array contains value", group: "containment" },
        { value: "not_array_contains", apiOperator: "NotContains", label: "Array does not contain", group: "containment" },
        // Containment (multiple values)
        { value: "contains_any", apiOperator: "ContainsAny", label: "Contains any of values", group: "containment" },
        { value: "not_contains_any", apiOperator: "NotContainsAny", label: "Contains none of values", group: "containment" },
      ];

      // Add numeric array comparison operators
      if (isNumericArray) {
        ops.push(
          { value: "any_lt", apiOperator: "AnyLt", label: "Any element less than", group: "comparison" },
          { value: "any_lte", apiOperator: "AnyLte", label: "Any element less or equal", group: "comparison" },
          { value: "any_gt", apiOperator: "AnyGt", label: "Any element greater than", group: "comparison" },
          { value: "any_gte", apiOperator: "AnyGte", label: "Any element greater or equal", group: "comparison" }
        );
      }

      return ops;
    }

    // Operators for numeric fields
    if (type === "number" || isNumericType(type)) {
      return [
        { value: "equals", apiOperator: "Eq", label: "Equal to", group: "equality" },
        { value: "not_equals", apiOperator: "NotEq", label: "Not equal to", group: "equality" },
        { value: "greater", apiOperator: "Gt", label: "Greater than", group: "comparison" },
        { value: "greater_or_equal", apiOperator: "Gte", label: "Greater or equal", group: "comparison" },
        { value: "less", apiOperator: "Lt", label: "Less than", group: "comparison" },
        { value: "less_or_equal", apiOperator: "Lte", label: "Less or equal", group: "comparison" },
        { value: "in", apiOperator: "In", label: "Value in list", group: "list" },
        { value: "not_in", apiOperator: "NotIn", label: "Value not in list", group: "list" },
      ];
    }

    // Operators for string fields
    const stringOps: OperatorOption[] = [
      { value: "equals", apiOperator: "Eq", label: "Exact match", group: "equality" },
      { value: "not_equals", apiOperator: "NotEq", label: "Not equal", group: "equality" },
      { value: "contains", apiOperator: "Glob", label: "Contains substring (*val*)", group: "pattern" },
      { value: "matches", apiOperator: "Glob", label: "Unix glob pattern", group: "pattern" },
      { value: "not_matches", apiOperator: "NotGlob", label: "Does not match glob", group: "pattern" },
      { value: "imatches", apiOperator: "IGlob", label: "Case-insensitive glob", group: "pattern" },
      { value: "not_imatches", apiOperator: "NotIGlob", label: "Not case-insensitive glob", group: "pattern" },
      { value: "regex", apiOperator: "Regex", label: "Regular expression", group: "pattern" },
      { value: "in", apiOperator: "In", label: "Value in list", group: "list" },
      { value: "not_in", apiOperator: "NotIn", label: "Value not in list", group: "list" },
      { value: "greater", apiOperator: "Gt", label: "Lexicographic greater", group: "comparison" },
      { value: "greater_or_equal", apiOperator: "Gte", label: "Lexicographic greater or equal", group: "comparison" },
      { value: "less", apiOperator: "Lt", label: "Lexicographic less", group: "comparison" },
      { value: "less_or_equal", apiOperator: "Lte", label: "Lexicographic less or equal", group: "comparison" },
    ];

    // Add FTS operators if the field has full-text search enabled
    if (isFts) {
      stringOps.push(
        { value: "contains_all_tokens", apiOperator: "ContainsAllTokens", label: "All words present (any order)", group: "fts" },
        { value: "contains_token_sequence", apiOperator: "ContainsTokenSequence", label: "Exact phrase match", group: "fts" }
      );
    }

    return stringOps;
  }, [selectedFieldInfo]);

  const handleApply = () => {
    const fieldType = selectedFieldInfo?.type;
    const isArrayField = isArrayType(fieldType);

    // Operators that require multiple values (multi-select input)
    const multiValueOperators = ["in", "not_in", "contains_any", "not_contains_any"];
    const useMultiSelect = multiValueOperators.includes(selectedOperator);

    if (
      selectedField &&
      selectedOperator &&
      (useMultiSelect ? multiSelectValue.length > 0 : filterValue || actualValue !== null)
    ) {
      // Use the actual typed value if available (from dropdown selection),
      // otherwise use the string value from manual input
      let rawValue: any;
      if (useMultiSelect) {
        rawValue = multiSelectValue;
      } else if (actualValue !== null) {
        // Use the actual typed value from dropdown
        rawValue = actualValue;
      } else {
        // Use the string value from manual input
        rawValue = filterValue;
      }

      onUpdate(selectedField, selectedOperator, rawValue);

      // Reset new filter row
      if (isNew) {
        setSelectedField("");
        setSelectedOperator("equals");
        setFilterValue("");
        setMultiSelectValue([]);
        setActualValue(null);
      }
    }
  };

  // Update filter when field or operator changes for existing filters
  React.useEffect(() => {
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
    // Clear actual value when field changes
    setActualValue(null);
    if (!isNew) {
      // Reset operator based on field type
      const fieldInfo = fields.find((f) => f.name === newField);
      const newOperator: FilterOperator = isArrayType(fieldInfo?.type) ? "array_contains" : "equals";
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
            className="w-full justify-between h-9 font-mono"
            disabled={!selectedField}
          >
            {operators.find((op) => op.value === selectedOperator)?.apiOperator ||
              "Select..."}
            <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px]" align="start">
          {operators.map((op) => (
            <DropdownMenuItem
              key={op.value}
              onClick={() => handleOperatorChange(op.value)}
              className="flex flex-col items-start py-2"
            >
              <span className="font-mono font-medium">{op.apiOperator}</span>
              <span className="text-xs text-muted-foreground">{op.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Value Input */}
      {["in", "not_in", "contains_any", "not_contains_any"].includes(selectedOperator) ? (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={(newValues) => {
            setMultiSelectValue(newValues);
            handleValueChange();
          }}
          options={(selectedFieldInfo?.sampleValues || []).map((v) => ({
            value: v,
            label: String(v),
          }))}
          placeholder={getPlaceholder(selectedOperator)}
          disabled={!selectedField || !selectedOperator}
          className="w-full"
          allowCreate={true}
        />
      ) : (
        // Combobox: type to enter value, with suggestions from sample values
        <Popover open={valuePopoverOpen} onOpenChange={setValuePopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Input
                ref={inputRef}
                placeholder={getPlaceholder(selectedOperator)}
                value={filterValue}
                className="h-9 pr-8"
                disabled={!selectedField || !selectedOperator}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setActualValue(null);
                  if (!valuePopoverOpen && e.target.value) {
                    setValuePopoverOpen(true);
                  }
                }}
                onFocus={() => {
                  if (selectedFieldInfo?.sampleValues?.length) {
                    setValuePopoverOpen(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setValuePopoverOpen(false);
                    handleApply();
                  } else if (e.key === "Escape") {
                    setValuePopoverOpen(false);
                  }
                }}
              />
              {selectedFieldInfo?.sampleValues?.length ? (
                <ChevronDown
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-50 cursor-pointer"
                  onClick={() => setValuePopoverOpen(!valuePopoverOpen)}
                />
              ) : null}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[300px] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="max-h-[300px] overflow-y-auto">
              {/* Exact value option - always first when there's input */}
              {filterValue.trim() && (
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent border-b text-sm"
                  onClick={() => {
                    setActualValue(null);
                    setValuePopoverOpen(false);
                    if (!isNew && selectedField && selectedOperator) {
                      onUpdate(selectedField, selectedOperator, filterValue);
                    }
                  }}
                >
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Use exact:</span>
                  <span className="font-mono font-medium truncate">{filterValue}</span>
                </div>
              )}

              {/* Filtered sample values */}
              {filteredSampleValues.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs text-muted-foreground">
                    Sample values
                  </div>
                  {filteredSampleValues.slice(0, 20).map((value, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => {
                        setActualValue(value);
                        setFilterValue(String(value));
                        setValuePopoverOpen(false);
                        if (!isNew && selectedField && selectedOperator) {
                          onUpdate(selectedField, selectedOperator, value);
                        }
                      }}
                    >
                      <span className="truncate font-mono">{String(value)}</span>
                      {typeof value === "number" && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          num
                        </Badge>
                      )}
                    </div>
                  ))}
                  {filteredSampleValues.length > 20 && (
                    <div className="px-3 py-1.5 text-xs text-muted-foreground">
                      +{filteredSampleValues.length - 20} more...
                    </div>
                  )}
                </div>
              ) : filterValue.trim() ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No matching values
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Type to enter a value
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
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
              (["in", "not_in", "contains_any", "not_contains_any"].includes(selectedOperator)
                ? multiSelectValue.length === 0
                : !filterValue && actualValue === null)
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

export { FilterBuilder };
