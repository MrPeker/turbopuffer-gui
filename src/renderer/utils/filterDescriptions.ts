import type { SimpleFilter, FilterOperator } from "@/renderer/stores/documentsStore";

// Maps internal operator names to Turbopuffer API operator names
const operatorToApiOperator: Record<FilterOperator, string> = {
  // Equality
  equals: "Eq",
  not_equals: "NotEq",
  // String contains (uses Glob with wildcards)
  contains: "Glob",
  // Comparisons
  greater: "Gt",
  greater_or_equal: "Gte",
  less: "Lt",
  less_or_equal: "Lte",
  // List membership
  in: "In",
  not_in: "NotIn",
  // Glob patterns
  matches: "Glob",
  not_matches: "NotGlob",
  imatches: "IGlob",
  not_imatches: "NotIGlob",
  // Array element comparisons
  any_lt: "AnyLt",
  any_lte: "AnyLte",
  any_gt: "AnyGt",
  any_gte: "AnyGte",
  // Array containment (single value)
  array_contains: "Contains",
  not_array_contains: "NotContains",
  // Array containment (multiple values)
  contains_any: "ContainsAny",
  not_contains_any: "NotContainsAny",
  // Regex
  regex: "Regex",
  // Full-text search
  contains_all_tokens: "ContainsAllTokens",
  contains_token_sequence: "ContainsTokenSequence",
};

function formatValue(value: any): string {
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    } else if (value.length === 1) {
      return String(value[0]);
    } else if (value.length <= 3) {
      return `[${value.map(v => String(v)).join(", ")}]`;
    } else {
      return `[${value.slice(0, 2).map(v => String(v)).join(", ")}, ... (${value.length} items)]`;
    }
  } else if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 30) {
      return `"${value.substring(0, 27)}..."`;
    }
    return `"${value}"`;
  } else {
    return String(value);
  }
}

export function generateFilterDescription(
  filters: SimpleFilter[],
  searchText = ""
): string {
  const parts: string[] = [];

  // Add search text if present
  if (searchText) {
    parts.push(`Search: "${searchText}"`);
  }

  // Add filters
  if (filters.length > 0) {
    const filterDescriptions = filters.map(filter => {
      const operator = operatorToApiOperator[filter.operator] || filter.operator;
      const value = formatValue(filter.value);
      return `${filter.attribute} ${operator} ${value}`;
    });

    if (filterDescriptions.length === 1) {
      parts.push(filterDescriptions[0]);
    } else if (filterDescriptions.length <= 3) {
      parts.push(filterDescriptions.join(", "));
    } else {
      parts.push(`${filterDescriptions.slice(0, 2).join(", ")}, ... (${filterDescriptions.length} filters)`);
    }
  }

  return parts.join(" + ") || "No filters";
}

export function generateShortFilterSummary(
  filters: SimpleFilter[],
  searchText = ""
): string {
  const totalItems = filters.length + (searchText ? 1 : 0);

  if (totalItems === 0) {
    return "No filters";
  } else if (totalItems === 1) {
    if (searchText) {
      return `Search: "${searchText}"`;
    } else {
      const filter = filters[0];
      return `${filter.attribute} ${operatorToApiOperator[filter.operator] || filter.operator} ${formatValue(filter.value)}`;
    }
  } else {
    const parts: string[] = [];
    if (searchText) {
      parts.push(`search`);
    }
    if (filters.length > 0) {
      parts.push(`${filters.length} filter${filters.length > 1 ? 's' : ''}`);
    }
    return parts.join(" + ");
  }
}

// Export the mapping for use in other components
export { operatorToApiOperator };