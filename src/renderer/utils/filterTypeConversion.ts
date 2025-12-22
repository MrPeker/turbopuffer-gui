/**
 * Utility functions for converting filter values to the appropriate type
 * based on the field's schema type
 */

/**
 * Check if a field type is an integer array type
 */
export function isIntegerArrayType(type: string | undefined): boolean {
  if (!type) return false;
  return type === '[]int' || type === '[]int32' || type === '[]uint' || 
         type === '[]uint32' || type === '[]int64' || type === '[]uint64';
}

/**
 * Check if a field type is a numeric type (including arrays)
 */
export function isNumericType(type: string | undefined): boolean {
  if (!type) return false;
  return type === 'number' || type === 'int' || type === 'int32' || 
         type === 'uint' || type === 'uint32' || type === 'int64' || 
         type === 'uint64' || isIntegerArrayType(type);
}

/**
 * Check if a field type is an array type
 */
export function isArrayType(type: string | undefined): boolean {
  if (!type) return false;
  return type === 'array' || type.startsWith('[]');
}

/**
 * Get the element type of an array field
 */
export function getArrayElementType(type: string | undefined): string | null {
  if (!type || !isArrayType(type)) return null;
  
  if (type === 'array') return 'string'; // Default to string for generic array
  
  // Extract element type from []type format
  if (type.startsWith('[]')) {
    return type.substring(2);
  }
  
  return null;
}

/**
 * Convert a value to the appropriate type based on field type
 */
export function convertValueToFieldType(value: any, fieldType: string | undefined): any {
  if (value === null || value === undefined || !fieldType) {
    return value;
  }

  // Handle array types
  if (isArrayType(fieldType)) {
    const elementType = getArrayElementType(fieldType);
    
    // If value is already an array, convert each element
    if (Array.isArray(value)) {
      return value.map(v => convertSingleValue(v, elementType));
    }
    
    // Single value for array field (e.g., for ContainsAny)
    return convertSingleValue(value, elementType);
  }

  // Handle non-array types
  return convertSingleValue(value, fieldType);
}

/**
 * Convert a single value to the appropriate type
 */
function convertSingleValue(value: any, type: string | null): any {
  if (value === null || value === undefined || !type) {
    return value;
  }

  // Already the correct type in many cases
  if (typeof value === 'number' && isNumericElementType(type)) {
    return value;
  }

  switch (type) {
    case 'int':
    case 'int32':
    case 'int64':
    case 'uint':
    case 'uint32':
    case 'uint64':
    case 'number':
      // Convert string to number
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (!isNaN(parsed)) {
          // For integer types, ensure it's an integer
          if (type.includes('int')) {
            return Math.floor(parsed);
          }
          return parsed;
        }
      }
      return value;

    case 'bool':
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);

    case 'string':
    case 'uuid':
    case 'datetime':
      return String(value);

    default:
      return value;
  }
}

/**
 * Check if a type is a numeric element type
 */
function isNumericElementType(type: string | null): boolean {
  if (!type) return false;
  return ['int', 'int32', 'int64', 'uint', 'uint32', 'uint64', 'number'].includes(type);
}

/**
 * Parse a string value to the appropriate type based on field type
 * Used for manual input in filter fields
 */
export function parseValueForFieldType(value: string, fieldType: string | undefined): any {
  if (!value || !fieldType) return value;

  // Handle special null case
  if (value.toLowerCase() === 'null') {
    return null;
  }

  // For array operators like 'in' or 'not_in', parse comma-separated values
  if (value.includes(',')) {
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    if (isArrayType(fieldType)) {
      const elementType = getArrayElementType(fieldType);
      return values.map(v => convertSingleValue(v, elementType));
    }
    return values;
  }

  return convertValueToFieldType(value, fieldType);
}

/**
 * Convert filter values in batch for multiple filters
 */
export function convertFilterValues(
  filters: Array<{ attribute: string; value: any }>,
  attributeTypeMap: Map<string, string>
): Array<{ attribute: string; value: any }> {
  return filters.map(filter => ({
    ...filter,
    value: convertValueToFieldType(filter.value, attributeTypeMap.get(filter.attribute))
  }));
}