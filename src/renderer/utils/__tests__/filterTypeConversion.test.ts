import { describe, it, expect } from 'vitest';
import {
  isIntegerArrayType,
  isNumericType,
  isArrayType,
  getArrayElementType,
  convertValueToFieldType,
  parseValueForFieldType,
  convertFilterValues,
} from '../filterTypeConversion';

describe('filterTypeConversion', () => {
  describe('isIntegerArrayType', () => {
    it('returns true for []int32', () => {
      expect(isIntegerArrayType('[]int32')).toBe(true);
    });

    it('returns true for []int64', () => {
      expect(isIntegerArrayType('[]int64')).toBe(true);
    });

    it('returns true for []uint', () => {
      expect(isIntegerArrayType('[]uint')).toBe(true);
    });

    it('returns true for []uint32', () => {
      expect(isIntegerArrayType('[]uint32')).toBe(true);
    });

    it('returns false for []string', () => {
      expect(isIntegerArrayType('[]string')).toBe(false);
    });

    it('returns false for []float64', () => {
      expect(isIntegerArrayType('[]float64')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isIntegerArrayType(undefined)).toBe(false);
    });

    it('returns false for non-array types', () => {
      expect(isIntegerArrayType('int32')).toBe(false);
    });
  });

  describe('isNumericType', () => {
    it('returns true for number', () => {
      expect(isNumericType('number')).toBe(true);
    });

    it('returns true for int', () => {
      expect(isNumericType('int')).toBe(true);
    });

    it('returns true for int32', () => {
      expect(isNumericType('int32')).toBe(true);
    });

    it('returns true for uint64', () => {
      expect(isNumericType('uint64')).toBe(true);
    });

    it('returns true for integer array types', () => {
      expect(isNumericType('[]int32')).toBe(true);
    });

    it('returns false for string', () => {
      expect(isNumericType('string')).toBe(false);
    });

    it('returns false for boolean', () => {
      expect(isNumericType('boolean')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isNumericType(undefined)).toBe(false);
    });
  });

  describe('isArrayType', () => {
    it('returns true for array', () => {
      expect(isArrayType('array')).toBe(true);
    });

    it('returns true for []string', () => {
      expect(isArrayType('[]string')).toBe(true);
    });

    it('returns true for []int32', () => {
      expect(isArrayType('[]int32')).toBe(true);
    });

    it('returns false for string', () => {
      expect(isArrayType('string')).toBe(false);
    });

    it('returns false for int32', () => {
      expect(isArrayType('int32')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isArrayType(undefined)).toBe(false);
    });
  });

  describe('getArrayElementType', () => {
    it('returns string for generic array type', () => {
      expect(getArrayElementType('array')).toBe('string');
    });

    it('returns element type for []string', () => {
      expect(getArrayElementType('[]string')).toBe('string');
    });

    it('returns element type for []int32', () => {
      expect(getArrayElementType('[]int32')).toBe('int32');
    });

    it('returns element type for []float64', () => {
      expect(getArrayElementType('[]float64')).toBe('float64');
    });

    it('returns null for non-array types', () => {
      expect(getArrayElementType('string')).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(getArrayElementType(undefined)).toBeNull();
    });
  });

  describe('convertValueToFieldType', () => {
    it('returns value unchanged when fieldType is undefined', () => {
      expect(convertValueToFieldType('test', undefined)).toBe('test');
    });

    it('returns null unchanged', () => {
      expect(convertValueToFieldType(null, 'string')).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(convertValueToFieldType(undefined, 'string')).toBeUndefined();
    });

    it('converts string to integer for int32 type', () => {
      expect(convertValueToFieldType('42', 'int32')).toBe(42);
    });

    it('converts string to integer for int type', () => {
      expect(convertValueToFieldType('123', 'int')).toBe(123);
    });

    it('floors float to integer for int types', () => {
      expect(convertValueToFieldType('42.7', 'int32')).toBe(42);
    });

    it('converts string to number for number type', () => {
      expect(convertValueToFieldType('3.14', 'number')).toBe(3.14);
    });

    it('converts string to boolean for bool type', () => {
      expect(convertValueToFieldType('true', 'bool')).toBe(true);
      expect(convertValueToFieldType('false', 'bool')).toBe(false);
    });

    it('converts "1" to true for boolean type', () => {
      expect(convertValueToFieldType('1', 'boolean')).toBe(true);
    });

    it('converts value to string for string type', () => {
      expect(convertValueToFieldType(123, 'string')).toBe('123');
    });

    it('handles array element conversion for []int32', () => {
      expect(convertValueToFieldType(['1', '2', '3'], '[]int32')).toEqual([1, 2, 3]);
    });

    it('handles single value for array type', () => {
      expect(convertValueToFieldType('42', '[]int32')).toBe(42);
    });

    it('preserves already correct number types', () => {
      expect(convertValueToFieldType(42, 'int32')).toBe(42);
    });
  });

  describe('parseValueForFieldType', () => {
    it('returns value unchanged when empty', () => {
      expect(parseValueForFieldType('', 'string')).toBe('');
    });

    it('returns value unchanged when fieldType is undefined', () => {
      expect(parseValueForFieldType('test', undefined)).toBe('test');
    });

    it('converts "null" string to null value', () => {
      expect(parseValueForFieldType('null', 'string')).toBeNull();
    });

    it('converts "NULL" string to null value (case insensitive)', () => {
      expect(parseValueForFieldType('NULL', 'string')).toBeNull();
    });

    it('parses comma-separated values', () => {
      const result = parseValueForFieldType('a, b, c', 'string');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('parses comma-separated integers for array type', () => {
      const result = parseValueForFieldType('1, 2, 3', '[]int32');
      expect(result).toEqual([1, 2, 3]);
    });

    it('filters empty values from comma-separated list', () => {
      const result = parseValueForFieldType('a, , b', 'string');
      expect(result).toEqual(['a', 'b']);
    });

    it('converts single numeric string for int type', () => {
      expect(parseValueForFieldType('42', 'int32')).toBe(42);
    });
  });

  describe('convertFilterValues', () => {
    it('converts filter values based on attribute type map', () => {
      const filters = [
        { attribute: 'count', value: '42' },
        { attribute: 'name', value: 'test' },
      ];
      const typeMap = new Map([
        ['count', 'int32'],
        ['name', 'string'],
      ]);

      const result = convertFilterValues(filters, typeMap);

      expect(result).toEqual([
        { attribute: 'count', value: 42 },
        { attribute: 'name', value: 'test' },
      ]);
    });

    it('preserves value when attribute not in type map', () => {
      const filters = [{ attribute: 'unknown', value: '123' }];
      const typeMap = new Map<string, string>();

      const result = convertFilterValues(filters, typeMap);

      expect(result).toEqual([{ attribute: 'unknown', value: '123' }]);
    });
  });
});
