import type { Document } from '../../types/document';
import type { 
  DiscoveredAttribute, 
  AttributeType, 
  AttributeDiscoveryOptions, 
  AttributeDiscoveryResult,
  FilterUIConfig 
} from '../../types/attributeDiscovery';
import { documentService } from './documentService';

interface AttributeInfo {
  name: string;
  values: any[];
  types: Set<string>;
  frequency: number;
  sampleValues: any[];
}

export class AttributeDiscoveryService {
  private cache = new Map<string, AttributeDiscoveryResult>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async discoverAttributes(
    namespaceId: string,
    options: AttributeDiscoveryOptions = {}
  ): Promise<AttributeDiscoveryResult> {
    const cacheKey = `${namespaceId}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.discoveredAt.getTime() < this.cacheExpiry) {
      return cached;
    }

    const {
      sampleSize = 500,
      maxUniqueValues = 100,
      detectPatterns = true,
      includeVector = false
    } = options;

    try {
      // Sample documents from the namespace
      const { documents } = await documentService.listDocuments(namespaceId, {
        limit: sampleSize,
        includeAttributes: true
      });

      if (documents.length === 0) {
        const result: AttributeDiscoveryResult = {
          attributes: [],
          totalDocuments: 0,
          sampleSize: 0,
          discoveredAt: new Date()
        };
        this.cache.set(cacheKey, result);
        return result;
      }

      const attributeMap = new Map<string, AttributeInfo>();

      // Analyze all documents
      for (const doc of documents) {
        // Include vector as an attribute if requested
        if (includeVector && doc.vector) {
          this.updateAttributeInfo(attributeMap, 'vector', doc.vector);
        }

        // Process regular attributes
        if (doc.attributes) {
          for (const [key, value] of Object.entries(doc.attributes)) {
            this.updateAttributeInfo(attributeMap, key, value);
          }
        }
      }

      // Convert to DiscoveredAttribute format
      const attributes: DiscoveredAttribute[] = [];
      
      for (const [name, info] of attributeMap) {
        const discoveredAttr = this.analyzeAttribute(
          name, 
          info, 
          documents.length, 
          maxUniqueValues,
          detectPatterns
        );
        attributes.push(discoveredAttr);
      }

      // Sort by frequency (most common first)
      attributes.sort((a, b) => b.frequency - a.frequency);

      const result: AttributeDiscoveryResult = {
        attributes,
        totalDocuments: documents.length,
        sampleSize: documents.length,
        discoveredAt: new Date()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to discover attributes:', error);
      throw error;
    }
  }

  private updateAttributeInfo(
    attributeMap: Map<string, AttributeInfo>,
    key: string,
    value: any
  ): void {
    if (!attributeMap.has(key)) {
      attributeMap.set(key, {
        name: key,
        values: [],
        types: new Set(),
        frequency: 0,
        sampleValues: []
      });
    }

    const info = attributeMap.get(key)!;
    info.frequency++;
    info.values.push(value);
    info.types.add(this.getValueType(value));
    
    // Keep sample values (max 10)
    if (info.sampleValues.length < 10) {
      info.sampleValues.push(value);
    }
  }

  private getValueType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  private analyzeAttribute(
    name: string,
    info: AttributeInfo,
    totalDocuments: number,
    maxUniqueValues: number,
    detectPatterns: boolean
  ): DiscoveredAttribute {
    const types = Array.from(info.types);
    const primaryType = this.determinePrimaryType(types, info.values);
    
    // Get unique values (excluding nulls)
    const nonNullValues = info.values.filter(v => v !== null && v !== undefined);
    const uniqueValues = Array.from(new Set(nonNullValues));
    
    const result: DiscoveredAttribute = {
      name,
      type: primaryType,
      sampleValues: info.sampleValues.slice(0, 5),
      frequency: info.frequency,
      totalDocuments,
      isNullable: info.values.some(v => v === null || v === undefined)
    };

    // Add unique values if not too many
    if (uniqueValues.length <= maxUniqueValues) {
      result.uniqueValues = uniqueValues.slice(0, maxUniqueValues);
    }

    // Add range for numeric attributes
    if (primaryType === 'number') {
      const numbers = nonNullValues.filter(v => typeof v === 'number');
      if (numbers.length > 0) {
        result.range = {
          min: Math.min(...numbers),
          max: Math.max(...numbers)
        };
      }
    }

    // Detect array element type
    if (primaryType === 'array') {
      const elementTypes = new Set<string>();
      nonNullValues.forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(item => elementTypes.add(this.getValueType(item)));
        }
      });
      result.arrayElementType = this.determinePrimaryType(Array.from(elementTypes), []);
    }

    // Detect patterns for strings
    if (primaryType === 'string' && detectPatterns) {
      result.commonPatterns = this.detectStringPatterns(nonNullValues);
    }

    return result;
  }

  private determinePrimaryType(types: string[], values: any[]): AttributeType {
    // Remove null from types for primary type determination
    const nonNullTypes = types.filter(t => t !== 'null');
    
    if (nonNullTypes.length === 0) return 'string'; // Default fallback
    if (nonNullTypes.length === 1) {
      const type = nonNullTypes[0];
      if (type === 'string') {
        // Check if strings look like dates
        const stringValues = values.filter(v => typeof v === 'string');
        if (stringValues.length > 0 && this.looksLikeDate(stringValues)) {
          return 'date';
        }
      }
      return type as AttributeType;
    }
    
    // Mixed types
    if (nonNullTypes.includes('number') && nonNullTypes.includes('string')) {
      // Check if strings are numeric
      const stringValues = values.filter(v => typeof v === 'string');
      const numericStrings = stringValues.filter(v => !isNaN(Number(v)));
      if (numericStrings.length / stringValues.length > 0.8) {
        return 'number'; // Mostly numeric
      }
    }
    
    return 'mixed';
  }

  private looksLikeDate(stringValues: string[]): boolean {
    if (stringValues.length === 0) return false;
    
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // ISO date
      /^\d{2}\/\d{2}\/\d{4}/, // US date
      /^\d{2}-\d{2}-\d{4}/, // EU date
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    ];
    
    const dateMatchCount = stringValues.filter(str => 
      datePatterns.some(pattern => pattern.test(str)) ||
      !isNaN(Date.parse(str))
    ).length;
    
    return dateMatchCount / stringValues.length > 0.7;
  }

  private detectStringPatterns(stringValues: string[]): string[] {
    const patterns: string[] = [];
    
    if (stringValues.length === 0) return patterns;
    
    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailCount = stringValues.filter(v => typeof v === 'string' && emailPattern.test(v)).length;
    if (emailCount / stringValues.length > 0.5) {
      patterns.push('email');
    }
    
    // URL pattern
    const urlPattern = /^https?:\/\/.+/;
    const urlCount = stringValues.filter(v => typeof v === 'string' && urlPattern.test(v)).length;
    if (urlCount / stringValues.length > 0.5) {
      patterns.push('url');
    }
    
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidCount = stringValues.filter(v => typeof v === 'string' && uuidPattern.test(v)).length;
    if (uuidCount / stringValues.length > 0.5) {
      patterns.push('uuid');
    }
    
    return patterns;
  }

  getFilterUIConfig(attribute: DiscoveredAttribute): FilterUIConfig {
    const { type, uniqueValues, range, commonPatterns } = attribute;
    
    switch (type) {
      case 'boolean':
        return { component: 'boolean-toggle' };
        
      case 'number':
        if (uniqueValues && uniqueValues.length <= 5) {
          return { 
            component: 'checkbox-group',
            props: { options: uniqueValues }
          };
        }
        if (range && range.max - range.min <= 100) {
          return { 
            component: 'range-slider',
            props: { min: range.min, max: range.max }
          };
        }
        return { component: 'number-input' };
        
      case 'string':
        if (commonPatterns?.includes('date')) {
          return { component: 'date-picker' };
        }
        if (uniqueValues && uniqueValues.length <= 5) {
          return { 
            component: 'checkbox-group',
            props: { options: uniqueValues }
          };
        }
        if (uniqueValues && uniqueValues.length <= 20) {
          return { 
            component: 'multi-select',
            props: { options: uniqueValues }
          };
        }
        if (uniqueValues && uniqueValues.length <= 50) {
          return { 
            component: 'combobox',
            props: { options: uniqueValues }
          };
        }
        return { component: 'text-input' };
        
      case 'date':
        return { component: 'date-picker' };
        
      case 'array':
        return { 
          component: 'text-input',
          props: { placeholder: 'Search array contents...' }
        };
        
      default:
        return { component: 'text-input' };
    }
  }

  clearCache(namespaceId?: string): void {
    if (namespaceId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${namespaceId}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const attributeDiscoveryService = new AttributeDiscoveryService();