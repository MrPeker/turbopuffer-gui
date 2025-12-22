import type { Document } from '../../types/document';

export class SearchService {
  /**
   * Performs a case-insensitive search across all text fields in documents
   * This is a client-side search implementation for better UX
   */
  static searchDocuments(
    documents: Document[], 
    searchText: string
  ): Document[] {
    if (!searchText || !searchText.trim()) {
      return documents;
    }

    const searchLower = searchText.toLowerCase().trim();
    
    return documents.filter(doc => {
      // Search in ID
      if (doc.id && String(doc.id).toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in all document fields
      for (const [key, value] of Object.entries(doc)) {
        // Skip special fields
        if (key === 'attributes' || key === 'vector' || key.includes('embedding') || key === '$dist') {
          continue;
        }

        // Handle different value types
        if (value === null || value === undefined) {
          continue;
        }

        // Array values
        if (Array.isArray(value)) {
          const arrayMatch = value.some(item => 
            String(item).toLowerCase().includes(searchLower)
          );
          if (arrayMatch) return true;
        } 
        // String or number values
        else if (typeof value === 'string' || typeof value === 'number') {
          if (String(value).toLowerCase().includes(searchLower)) {
            return true;
          }
        }
      }

      // Search in attributes if present
      if (doc.attributes && typeof doc.attributes === 'object') {
        for (const [key, value] of Object.entries(doc.attributes)) {
          if (value === null || value === undefined) {
            continue;
          }

          // Array values in attributes
          if (Array.isArray(value)) {
            const arrayMatch = value.some(item => 
              String(item).toLowerCase().includes(searchLower)
            );
            if (arrayMatch) return true;
          } 
          // String or number values in attributes
          else if (typeof value === 'string' || typeof value === 'number') {
            if (String(value).toLowerCase().includes(searchLower)) {
              return true;
            }
          }
        }
      }

      return false;
    });
  }

  /**
   * Get all searchable fields from a set of documents
   */
  static getSearchableFields(documents: Document[]): string[] {
    const fields = new Set<string>();

    documents.forEach(doc => {
      // Add document fields
      Object.keys(doc).forEach(key => {
        if (key !== 'attributes' && key !== 'vector' && 
            !key.includes('embedding') && key !== '$dist') {
          fields.add(key);
        }
      });

      // Add attribute fields
      if (doc.attributes && typeof doc.attributes === 'object') {
        Object.keys(doc.attributes).forEach(key => {
          fields.add(key);
        });
      }
    });

    return Array.from(fields).sort();
  }
}