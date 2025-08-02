interface SimpleFilter {
  id: string;
  attribute: string;
  operator: string;
  value: any;
  displayValue: string;
}

const operatorLabels: Record<string, string> = {
  equals: "=",
  not_equals: "≠",
  contains: "contains",
  greater: ">",
  greater_or_equal: "≥",
  less: "<",
  less_or_equal: "≤",
  in: "in",
  not_in: "not in",
  matches: "matches",
  not_matches: "not matches",
  imatches: "matches (i)",
  not_imatches: "not matches (i)",
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
  searchText: string = ""
): string {
  const parts: string[] = [];

  // Add search text if present
  if (searchText) {
    parts.push(`Search: "${searchText}"`);
  }

  // Add filters
  if (filters.length > 0) {
    const filterDescriptions = filters.map(filter => {
      const operator = operatorLabels[filter.operator] || filter.operator;
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
  searchText: string = ""
): string {
  const totalItems = filters.length + (searchText ? 1 : 0);
  
  if (totalItems === 0) {
    return "No filters";
  } else if (totalItems === 1) {
    if (searchText) {
      return `Search: "${searchText}"`;
    } else {
      const filter = filters[0];
      return `${filter.attribute} ${operatorLabels[filter.operator] || filter.operator} ${formatValue(filter.value)}`;
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