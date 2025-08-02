import React, { useMemo, useState } from "react";
import Select, { components } from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Filter } from "lucide-react";
import { useDocumentsStore } from "@/renderer/stores/documentsStore";

interface FilterBuilderProps {
  // No props needed - component will use store directly
}

const operators = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In" },
  { value: "not_in", label: "Not In" },
];

// Array-specific operator labels for better UX
const arrayOperatorLabels = {
  contains: "Contains value",
  not_equals: "Does not contain",
  in: "Contains any of",
  not_in: "Contains none of",
};

const stringOperators = ["equals", "not_equals", "contains", "in", "not_in"];
const numberOperators = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "in",
  "not_in",
];
const arrayOperators = ["contains", "not_equals", "in", "not_in"]; // Array operators

// Custom option component to show field type
const FieldOption = (props: any) => (
  <components.Option {...props}>
    <div className="flex items-center justify-between">
      <span>{props.data.label}</span>
      <div className="flex gap-1">
        <Badge variant="outline" className="text-xs">
          {props.data.type}
        </Badge>
        {props.data.isArray && (
          <Badge variant="secondary" className="text-xs">
            array
          </Badge>
        )}
      </div>
    </div>
  </components.Option>
);

// Custom styles for react-select to match shadcn/ui
const customStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "2.5rem",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    backgroundColor: "hsl(var(--background))",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring))" : "none",
    "&:hover": {
      borderColor: "hsl(var(--border))",
    },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 50,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--accent))"
      : state.isFocused
      ? "hsl(var(--accent) / 0.5)"
      : "transparent",
    color: "hsl(var(--foreground))",
    cursor: "pointer",
    padding: "0.5rem 0.75rem",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
  input: (base: any) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "hsl(var(--accent))",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "hsl(var(--accent-foreground))",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "hsl(var(--accent-foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
    },
  }),
  menuList: (base: any) => ({
    ...base,
    padding: "0.25rem",
    maxHeight: "300px",
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  clearIndicator: (base: any) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  indicatorSeparator: (base: any) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
};

export const FilterBuilder: React.FC<FilterBuilderProps> = () => {
  const { documents, attributes, activeFilters, addFilter, removeFilter } =
    useDocumentsStore();

  // Get available fields from documents and attributes
  const fieldOptions = useMemo(() => {
    const fieldMap = new Map<
      string,
      { type: string; values: Set<any>; isArray: boolean }
    >();

    // Always include id
    fieldMap.set("id", { type: "string", values: new Set(), isArray: false });

    // Get fields from discovered attributes
    attributes.forEach((attr) => {
      fieldMap.set(attr.name, {
        type: attr.type || "string",
        values: new Set(attr.sampleValues || []),
        isArray: false, // Will be updated if we find arrays
      });
    });

    // Also check documents for any additional fields and collect values
    documents.forEach((doc) => {
      // Check root level fields
      Object.entries(doc).forEach(([key, value]) => {
        if (key !== "attributes" && key !== "$dist" && key !== "vector") {
          const isArray = Array.isArray(value);
          console.log(`🔍 Root field ${key}:`, { value, isArray, type: typeof value });
          
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              type: isArray ? "array" : typeof value,
              values: new Set(),
              isArray,
            });
          }

          const field = fieldMap.get(key)!;
          if (isArray) {
            field.isArray = true;
            field.type = "array";
            // For arrays, add individual values (excluding null/undefined)
            value.forEach((v) => {
              if (v !== null && v !== undefined && v !== "") {
                field.values.add(v);
              }
            });
          } else {
            field.values.add(value);
          }
        }
      });

      // Check attributes
      if (doc.attributes) {
        Object.entries(doc.attributes).forEach(([key, value]) => {
          const isArray = Array.isArray(value);
          console.log(`🔍 Attributes field ${key}:`, { value, isArray, type: typeof value });
          
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              type: isArray ? "array" : typeof value,
              values: new Set(),
              isArray,
            });
          }

          const field = fieldMap.get(key)!;
          if (isArray) {
            field.isArray = true;
            field.type = "array";
            // For arrays, add individual values (excluding null/undefined)
            value.forEach((v) => {
              if (v !== null && v !== undefined && v !== "") {
                field.values.add(v);
              }
            });
          } else {
            field.values.add(value);
          }
        });
      }
    });

    const fieldOptionsResult = Array.from(fieldMap.entries())
      .map(([name, info]) => ({
        value: name,
        label: name,
        type: info.type,
        isArray: info.isArray,
        values: Array.from(info.values)
          .filter(
            (v) =>
              v !== null && v !== undefined && v !== "" && !Array.isArray(v)
          ) // Exclude array values that slipped through
          .slice(0, 100),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    
    console.log("🔍 Field Options Generated:", fieldOptionsResult);
    return fieldOptionsResult;
  }, [documents, attributes]);

  // Local state for the filter being built
  const [newFilter, setNewFilter] = useState<{
    field: string;
    operator: string;
    value: string | string[];
  }>({
    field: "",
    operator: "equals",
    value: "",
  });
  // Debug state changes
  console.log("🔍 FilterBuilder State Debug:", {
    newFilter,
    fieldExists: !!newFilter.field,
    valueExists: !!newFilter.value,
    buttonDisabled: !newFilter.field || !newFilter.value,
    valueType: typeof newFilter.value,
    valueLength:
      typeof newFilter.value === "string"
        ? newFilter.value.length
        : Array.isArray(newFilter.value)
        ? newFilter.value.length
        : "unknown",
  });

  // Check if current filter is complete and valid
  const isCompleteFilter = (filter: typeof newFilter): boolean => {
    return !!(
      filter.field &&
      filter.operator &&
      filter.value !== undefined &&
      filter.value !== "" &&
      !(Array.isArray(filter.value) && filter.value.length === 0)
    );
  };

  // Auto-apply filter when it becomes complete
  const autoApplyFilter = (filter: typeof newFilter) => {
    if (isCompleteFilter(filter)) {
      const operatorMap: Record<string, string> = {
        equals: "equals",
        not_equals: "not_equals",
        contains: "contains",
        greater_than: "greater",
        less_than: "less",
        in: "in",
        not_in: "not_in",
      };

      // Check field type for debugging
      const field = fieldOptions.find((f) => f.value === filter.field);
      const isArrayField = field?.isArray || false;

      console.log("🔍 CHECKPOINT 1: Auto-Apply Filter Creation");
      console.log("Filter being auto-applied:", {
        field: filter.field,
        operator: filter.operator,
        mappedOperator: operatorMap[filter.operator],
        value: filter.value,
        valueType: typeof filter.value,
        isArray: Array.isArray(filter.value),
        fieldIsArray: isArrayField,
        fieldInfo: field,
      });

      // Check for duplicate filters
      const isDuplicate = activeFilters.some(
        (existing) =>
          existing.attribute === filter.field &&
          existing.operator === operatorMap[filter.operator] &&
          JSON.stringify(existing.value) === JSON.stringify(filter.value)
      );

      if (!isDuplicate) {
        addFilter(
          filter.field, // attribute
          operatorMap[filter.operator] as any, // operator
          filter.value // value
        );

        // Reset the form for next filter
        setNewFilter({
          field: "",
          operator: "equals",
          value: "",
        });
      }
    }
  };

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      autoApplyFilter(newFilter);
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    removeFilter(filterId);
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = fieldOptions.find((f) => f.value === fieldName);
    const fieldType = field?.type || "string";
    const isArray = field?.isArray || false;

    console.log("🔍 getOperatorsForField Debug:", {
      fieldName,
      field,
      fieldType,
      isArray,
      arrayOperators,
    });

    // For array fields, use array-specific operators with clearer labels
    if (isArray || fieldType === "array") {
      const arrayOps = operators
        .filter((op) => arrayOperators.includes(op.value))
        .map((op) => ({
          ...op,
          label: arrayOperatorLabels[op.value as keyof typeof arrayOperatorLabels] || op.label
        }));
      console.log("🔍 Array operators for", fieldName, ":", arrayOps);
      return arrayOps;
    }

    const availableOps =
      fieldType === "number" || fieldType === "int"
        ? numberOperators
        : stringOperators;

    return operators.filter((op) => availableOps.includes(op.value));
  };

  const getValueOptions = (fieldName: string) => {
    const field = fieldOptions.find((f) => f.value === fieldName);
    if (!field || !field.values || field.values.length === 0) return [];

    // Filter out null/undefined values and ensure unique values
    const uniqueValues = Array.from(
      new Set(
        field.values
          .filter((v) => v !== null && v !== undefined && v !== "")
          .map((v) => String(v))
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // Sort alphanumerically

    return uniqueValues.map((v) => ({
      value: v,
      label: v,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters</span>
        <Badge variant="outline">{fieldOptions.length} fields</Badge>
      </div>

      {/* Display existing filters */}
      {activeFilters.map((filter) => (
        <div
          key={filter.id}
          className="flex items-center gap-2 p-2 bg-background rounded-md border"
        >
          <Badge variant="secondary" className="font-mono text-xs">
            {filter.attribute} {filter.operator} {filter.displayValue}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveFilter(filter.id)}
            className="ml-auto h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* New filter form */}
      <div className="flex items-center gap-2">
        {/* Field selector */}
        <Select
          value={fieldOptions.find((f) => f.value === newFilter.field)}
          onChange={(option) => {
            const field = fieldOptions.find((f) => f.value === option?.value);
            const isArray = field?.isArray || false;
            console.log("🔍 Field Selection Debug:", {
              fieldName: option?.value,
              isArray,
              fieldInfo: field,
            });
            setNewFilter({
              ...newFilter,
              field: option?.value || "",
              operator: isArray ? "contains" : "equals",
              value: isArray ? [] : "",
            });
          }}
          options={fieldOptions}
          placeholder="Select field..."
          className="flex-1"
          styles={customStyles}
          components={{ Option: FieldOption }}
          isClearable={false}
        />

        {/* Operator selector */}
        <Select
          value={operators.find((op) => op.value === newFilter.operator)}
          onChange={(option) => {
            const field = fieldOptions.find((f) => f.value === newFilter.field);
            const isArray = field?.isArray || false;
            const defaultOperator = isArray ? "contains" : "equals";
            setNewFilter({
              ...newFilter,
              operator: option?.value || defaultOperator,
            });
          }}
          options={getOperatorsForField(newFilter.field)}
          placeholder="Operator"
          className="w-40"
          styles={customStyles}
          isDisabled={!newFilter.field}
          isClearable={false}
        />

        {/* Value selector/input */}
        {(() => {
          const field = fieldOptions.find((f) => f.value === newFilter.field);
          const isArrayField = field?.isArray || false;
          const valueOptions = getValueOptions(newFilter.field);

          if (valueOptions.length > 0) {
            return (
              <CreatableSelect
                value={
                  Array.isArray(newFilter.value)
                    ? newFilter.value.map((v) => ({ value: v, label: v }))
                    : newFilter.value
                    ? { value: newFilter.value, label: newFilter.value }
                    : null
                }
                onChange={(option) => {
                  let updatedFilter;
                  if (isArrayField) {
                    // For array fields, handle multi-select
                    const values = Array.isArray(option)
                      ? option.map((o: any) => o.value)
                      : option &&
                        typeof option === "object" &&
                        "value" in option
                      ? [option.value]
                      : [];
                    updatedFilter = { ...newFilter, value: values };
                  } else {
                    // For non-array fields, single select
                    updatedFilter = {
                      ...newFilter,
                      value:
                        option &&
                        typeof option === "object" &&
                        "value" in option
                          ? option.value
                          : "",
                    };
                  }
                  setNewFilter(updatedFilter);

                  // Auto-apply if filter is complete
                  autoApplyFilter(updatedFilter);
                }}
                options={valueOptions}
                placeholder={
                  isArrayField ? "Select values..." : "Select or type value..."
                }
                className="flex-1 min-w-[200px]"
                styles={customStyles}
                isDisabled={!newFilter.field}
                isClearable
                isMulti={isArrayField}
                formatCreateLabel={(inputValue) => `Use: "${inputValue}"`}
              />
            );
          } else {
            return (
              <input
                type="text"
                value={
                  Array.isArray(newFilter.value)
                    ? newFilter.value.join(", ")
                    : newFilter.value
                }
                onChange={(e) => {
                  let updatedFilter;
                  if (isArrayField) {
                    // For manual input on array fields, split by comma
                    const values = e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter((v) => v);
                    updatedFilter = { ...newFilter, value: values };
                  } else {
                    updatedFilter = { ...newFilter, value: e.target.value };
                  }
                  setNewFilter(updatedFilter);

                  // Auto-apply if filter is complete
                  autoApplyFilter(updatedFilter);
                }}
                placeholder={
                  isArrayField
                    ? "Enter values (comma-separated)..."
                    : "Enter value..."
                }
                className="flex-1 min-w-[200px] h-10 px-3 rounded-md border border-input bg-background text-sm"
                disabled={!newFilter.field}
              />
            );
          }
        })()}

        {/* Add button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            console.log("🔍 ADD BUTTON CLICKED - Pre-check Debug:");
            console.log("  newFilter state:", newFilter);
            console.log(
              "  newFilter.field:",
              newFilter.field,
              "exists:",
              !!newFilter.field
            );
            console.log(
              "  newFilter.value:",
              newFilter.value,
              "exists:",
              !!newFilter.value
            );
            console.log(
              "  button should be disabled:",
              !newFilter.field || !newFilter.value
            );
            handleAddFilter();
          }}
          disabled={!newFilter.field || !newFilter.value}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
