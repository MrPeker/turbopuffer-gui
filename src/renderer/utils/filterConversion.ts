import type { SimpleFilter } from '@/renderer/stores/documentsStore';
import type { Filter, DocumentsQueryParams } from '@/types/document';
import type { DiscoveredAttribute } from '@/types/attributeDiscovery';

export function convertFiltersToQuery(
  activeFilters: SimpleFilter[],
  searchText: string,
  attributes: DiscoveredAttribute[]
): DocumentsQueryParams {
  // Build query filters
  const filters: Filter[] = [];

  // Add text search filter across multiple fields
  if (searchText.trim()) {
    // For now, search in ID field with glob pattern
    // TODO: Implement full-text search across all fields
    filters.push(["id", "Glob", `*${searchText.trim()}*`]);
  }

  // Add attribute filters
  activeFilters.forEach((filter) => {
    // Check if this is an array field
    const fieldInfo = attributes.find(attr => attr.name === filter.attribute);
    const isArrayField = fieldInfo?.type && typeof fieldInfo.type === 'string' && (fieldInfo.type.startsWith('[]') || fieldInfo.type === 'array');
    
    switch (filter.operator) {
      case "equals": {
        if (isArrayField) {
          // For arrays, use "ContainsAny" to check if array contains the value
          // If value is an array, use the first element (for single-value contains)
          const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          const arrayFilter: Filter = [filter.attribute, "ContainsAny", containsValue];
          filters.push(arrayFilter);
        } else {
          // For non-arrays, use standard equality
          const nonArrayFilter: Filter = [filter.attribute, "Eq", filter.value];
          filters.push(nonArrayFilter);
        }
        break;
      }
      case "not_equals": {
        if (isArrayField) {
          // For arrays, use ["Not", ["ContainsAny", ...]] to check if array does not contain the value
          // If value is an array, use the first element
          const notContainsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          filters.push(["Not", [filter.attribute, "ContainsAny", notContainsValue]] as Filter);
        } else {
          // For non-arrays, use standard not equality
          filters.push([filter.attribute, "NotEq", filter.value] as Filter);
        }
        break;
      }
      case "contains": {
        // For array fields, we use the "ContainsAny" operator
        // For string fields, use Glob pattern matching
        if (isArrayField) {
          // For arrays, use "ContainsAny" operator for containment checking
          // If value is an array, use the first element
          const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
          filters.push([filter.attribute, "ContainsAny", containsValue] as Filter);
        } else {
          // For strings, use glob pattern
          filters.push([filter.attribute, "Glob", `*${filter.value}*`] as Filter);
        }
        break;
      }
      case "greater":
        filters.push([filter.attribute, "Gt", filter.value] as Filter);
        break;
      case "greater_or_equal":
        filters.push([filter.attribute, "Gte", filter.value] as Filter);
        break;
      case "less":
        filters.push([filter.attribute, "Lt", filter.value] as Filter);
        break;
      case "less_or_equal":
        filters.push([filter.attribute, "Lte", filter.value] as Filter);
        break;
      case "in":
        filters.push([
          filter.attribute,
          "In",
          Array.isArray(filter.value)
            ? filter.value
            : [filter.value],
        ] as Filter);
        break;
      case "not_in":
        filters.push([
          filter.attribute,
          "NotIn",
          Array.isArray(filter.value)
            ? filter.value
            : [filter.value],
        ] as Filter);
        break;
      case "matches":
        filters.push([filter.attribute, "Glob", filter.value] as Filter);
        break;
      case "not_matches":
        filters.push([filter.attribute, "NotGlob", filter.value] as Filter);
        break;
      case "imatches":
        filters.push([filter.attribute, "IGlob", filter.value] as Filter);
        break;
      case "not_imatches":
        filters.push([filter.attribute, "NotIGlob", filter.value] as Filter);
        break;
    }
  });

  // Combine filters with AND
  const combinedFilter: Filter | undefined =
    filters.length === 0
      ? undefined
      : filters.length === 1
      ? filters[0]
      : ["And", filters];

  // Return query object
  return {
    rank_by: ["id", "asc"],
    top_k: 1000,
    filters: combinedFilter,
    include_attributes: true
  };
}

// New function to convert filters to a raw query string that can be used in RawQueryBar
export function convertFiltersToRawQuery(
  activeFilters: SimpleFilter[],
  searchText: string,
  attributes: DiscoveredAttribute[]
): string {
  const queryObject = convertFiltersToQuery(activeFilters, searchText, attributes);
  return JSON.stringify(queryObject, null, 2);
}