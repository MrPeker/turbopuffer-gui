import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiSelectInput } from "./MultiSelectInput";
import { 
  isArrayType,
  isNumericType
} from "@/renderer/utils/filterTypeConversion";

interface SimpleFilter {
  id: string;
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "greater" | "greater_or_equal" | "less" | "less_or_equal" | "in" | "not_in" | "matches" | "not_matches" | "imatches" | "not_imatches";
  value: any;
  displayValue: string;
}

interface FilterBuilderProps {
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

// Array-specific operator labels for better UX
const arrayOperatorLabels = {
  contains: "Contains value",
  not_equals: "Does not contain",
  in: "Contains any of",
  not_in: "Contains none of",
};

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

  // Define operators for different field types
  const operators = useMemo(() => {
    if (!selectedFieldInfo) return [];

    const type = selectedFieldInfo.type;
    
    // Specialized operators for array fields with clearer labels
    if (isArrayType(type)) {
      return [
        { value: "contains", label: arrayOperatorLabels.contains },
        { value: "not_equals", label: arrayOperatorLabels.not_equals },
        { value: "in", label: arrayOperatorLabels.in },
        { value: "not_in", label: arrayOperatorLabels.not_in },
      ];
    } 
    // Operators for numeric fields
    else if (type === "number" || isNumericType(type)) {
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
    } 
    // Operators for string fields
    else {
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
    const fieldType = selectedFieldInfo?.type;
    const isArrayField = isArrayType(fieldType);
    
    // For array fields, use multi-select when appropriate
    const useMultiSelect =
      isArrayField &&
      (selectedOperator === "in" || selectedOperator === "not_in");

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
      const newOperator = isArrayType(fieldInfo?.type) ? "contains" : "equals";
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
      {isArrayType(selectedFieldInfo?.type) &&
      (selectedOperator === "in" || selectedOperator === "not_in") ? (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={(newValues) => {
            setMultiSelectValue(newValues);
            handleValueChange();
          }}
          options={selectedFieldInfo.sampleValues.map((v) => ({
            value: v, // Preserve original type (number or string)
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
                  // Store the actual typed value for later use
                  setActualValue(value);
                  // Set the display value
                  const displayValue = String(value);
                  setFilterValue(displayValue);
                  // For existing filters, update immediately
                  if (!isNew && selectedField && selectedOperator) {
                    onUpdate(selectedField, selectedOperator, value);
                  }
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
          onChange={(e) => {
            setFilterValue(e.target.value);
            // Clear actual value when user types manually
            setActualValue(null);
          }}
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
              (isArrayType(selectedFieldInfo?.type) &&
              (selectedOperator === "in" || selectedOperator === "not_in")
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

export { FilterBuilder };