import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';

interface SimpleFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SimpleFilterBuilderProps {
  filters: SimpleFilter[];
  onChange: (filters: SimpleFilter[]) => void;
  availableFields?: string[];
}

export const SimpleFilterBuilder: React.FC<SimpleFilterBuilderProps> = ({
  filters,
  onChange,
  availableFields,
}) => {
  const { documents, attributes } = useDocumentsStore();

  // Get available fields from documents and attributes
  const detectedFields = useMemo(() => {
    if (availableFields && availableFields.length > 0) {
      return availableFields;
    }

    const fieldSet = new Set<string>(['id']);
    
    // Get fields from discovered attributes
    attributes.forEach(attr => {
      fieldSet.add(attr.name);
    });
    
    // Also check documents for any additional fields
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (key !== 'attributes' && key !== '$dist' && key !== 'vector') {
          fieldSet.add(key);
        }
      });
      if (doc.attributes) {
        Object.keys(doc.attributes).forEach(key => {
          fieldSet.add(key);
        });
      }
    });
    
    return Array.from(fieldSet).sort();
  }, [documents, attributes, availableFields]);

  // Get unique values for a field from the loaded documents
  const getFieldValues = (field: string): string[] => {
    const values = new Set<string>();
    
    documents.forEach(doc => {
      let value = doc[field];
      if (value === undefined && doc.attributes) {
        value = doc.attributes[field];
      }
      
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(String(v)));
        } else {
          values.add(String(value));
        }
      }
    });
    
    return Array.from(values).sort().slice(0, 100); // Limit to 100 values
  };

  // Get the type of a field from attributes
  const getFieldType = (field: string): string => {
    const attr = attributes.find(a => a.name === field);
    return attr?.type || 'string';
  };
  const addFilter = () => {
    const newFilter: SimpleFilter = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: '',
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, field: keyof SimpleFilter, value: string) => {
    const updated = filters.map(filter =>
      filter.id === id ? { ...filter, [field]: value } : filter
    );
    onChange(updated);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(filter => filter.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="gap-1">
          <span>{detectedFields.length}</span> fields available
        </Badge>
        <Badge variant="outline" className="gap-1">
          <span>{documents.length}</span> documents loaded
        </Badge>
      </div>

      {filters.map((filter) => {
        const fieldValues = filter.field ? getFieldValues(filter.field) : [];
        const fieldType = filter.field ? getFieldType(filter.field) : 'string';
        
        return (
          <div key={filter.id} className="flex items-center gap-2">
            <Select
              value={filter.field}
              onValueChange={(value) => updateFilter(filter.id, 'field', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {detectedFields.map((field) => {
                  const type = getFieldType(field);
                  return (
                    <SelectItem key={field} value={field}>
                      <div className="flex items-center justify-between w-full">
                        <span>{field}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {type}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              value={filter.operator}
              onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                {fieldType === 'string' && (
                  <SelectItem value="contains">Contains</SelectItem>
                )}
                {(fieldType === 'number' || fieldType === 'int') && (
                  <>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {fieldValues.length > 0 ? (
              <Select
                value={filter.value}
                onValueChange={(value) => updateFilter(filter.id, 'value', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select or type value" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                      placeholder="Type custom value..."
                      className="mb-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {fieldValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        <span className="truncate max-w-[300px]">{value}</span>
                      </SelectItem>
                    ))}
                  </div>
                  {fieldValues.length === 100 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Showing first 100 values
                    </div>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                placeholder="Enter value..."
                className="flex-1"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFilter(filter.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button variant="outline" onClick={addFilter} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Filter
      </Button>
    </div>
  );
};