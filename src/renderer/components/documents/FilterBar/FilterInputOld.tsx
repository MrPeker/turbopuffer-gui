import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, ChevronRight } from 'lucide-react';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';
import { cn } from '@/lib/utils';

interface FilterInputProps {
  onClose: () => void;
}

const OPERATORS = {
  string: [
    { value: 'equals', label: '=', description: 'Equals' },
    { value: 'not_equals', label: '≠', description: 'Not equals' },
    { value: 'contains', label: '∋', description: 'Contains' },
  ],
  number: [
    { value: 'equals', label: '=', description: 'Equals' },
    { value: 'not_equals', label: '≠', description: 'Not equals' },
    { value: 'greater_than', label: '>', description: 'Greater than' },
    { value: 'less_than', label: '<', description: 'Less than' },
  ],
  array: [
    { value: 'contains', label: '∋', description: 'Contains' },
    { value: 'equals', label: '=', description: 'Equals' },
  ],
};

export const FilterInput: React.FC<FilterInputProps> = ({ onClose }) => {
  const { documents, attributes, addFilter } = useDocumentsStore();
  
  const [stage, setStage] = useState<'field' | 'operator' | 'value'>('field');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('equals');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isOpen, setIsOpen] = useState(true);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Get available fields
  const fieldOptions = useMemo(() => {
    const fieldMap = new Map<string, { type: string; values: Set<any>; isArray: boolean }>();
    
    // Always include id
    fieldMap.set('id', { type: 'string', values: new Set(), isArray: false });
    
    // Get fields from attributes
    attributes.forEach((attr) => {
      fieldMap.set(attr.name, {
        type: attr.type || 'string',
        values: new Set(attr.sampleValues || []),
        isArray: false,
      });
    });
    
    // Get fields from documents
    documents.forEach((doc) => {
      Object.entries(doc).forEach(([key, value]) => {
        if (key !== 'attributes' && key !== '$dist' && key !== 'vector') {
          const isArray = Array.isArray(value);
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              type: isArray ? 'array' : typeof value === 'number' ? 'number' : 'string',
              values: new Set(),
              isArray,
            });
          }
          const field = fieldMap.get(key)!;
          if (isArray) {
            value.forEach((v) => {
              if (v !== null && v !== undefined) field.values.add(v);
            });
          } else if (value !== null && value !== undefined) {
            field.values.add(value);
          }
        }
      });
      
      // Check attributes
      if (doc.attributes) {
        Object.entries(doc.attributes).forEach(([key, value]) => {
          const isArray = Array.isArray(value);
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              type: isArray ? 'array' : typeof value === 'number' ? 'number' : 'string',
              values: new Set(),
              isArray,
            });
          }
          const field = fieldMap.get(key)!;
          if (isArray) {
            value.forEach((v) => {
              if (v !== null && v !== undefined) field.values.add(v);
            });
          } else if (value !== null && value !== undefined) {
            field.values.add(value);
          }
        });
      }
    });
    
    return Array.from(fieldMap.entries()).map(([name, info]) => ({
      value: name,
      label: name,
      type: info.type,
      isArray: info.isArray,
      values: Array.from(info.values).slice(0, 50),
    }));
  }, [documents, attributes]);

  const selectedFieldInfo = fieldOptions.find(f => f.value === selectedField);
  const fieldType = selectedFieldInfo?.isArray ? 'array' : selectedFieldInfo?.type || 'string';
  const operators = OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.string;

  const handleFieldSelect = (field: string) => {
    setSelectedField(field);
    const fieldInfo = fieldOptions.find(f => f.value === field);
    const type = fieldInfo?.isArray ? 'array' : fieldInfo?.type || 'string';
    setSelectedOperator(type === 'array' ? 'contains' : 'equals');
    setStage('operator');
  };

  const handleOperatorSelect = (operator: string) => {
    setSelectedOperator(operator);
    setStage('value');
  };

  const handleValueSubmit = (value: string | string[]) => {
    if (selectedField && selectedOperator && value) {
      // For array fields with 'in' operator, ensure value is an array
      const finalValue = selectedOperator === 'in' && !Array.isArray(value) ? [value] : value;
      addFilter(selectedField, selectedOperator as any, finalValue);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex items-center gap-1 min-w-[400px]">
      {/* Field Selection */}
      <Popover open={isOpen && stage === 'field'} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedField ? 'secondary' : 'outline'}
            size="sm"
            className="justify-start"
          >
            {selectedField || 'Select field...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          <Command>
            <CommandInput 
              ref={inputRef}
              placeholder="Search fields..." 
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              <CommandEmpty>No fields found</CommandEmpty>
              <CommandGroup>
                {fieldOptions.map((field) => (
                  <CommandItem
                    key={field.value}
                    value={field.value}
                    onSelect={handleFieldSelect}
                  >
                    <span className="flex-1">{field.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Operator Selection */}
      {stage !== 'field' && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedOperator}
            onValueChange={handleOperatorSelect}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{op.label}</span>
                    <span className="text-muted-foreground">{op.description}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Value Input */}
      {stage === 'value' && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {selectedFieldInfo?.values.length ? (
            <Popover open={isOpen && stage === 'value'} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start min-w-[150px]"
                >
                  {selectedValue || 'Select or type value...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px]" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Type or select value..."
                    value={selectedValue}
                    onValueChange={setSelectedValue}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && selectedValue) {
                        handleValueSubmit(String(value));
                      } else if (e.key === 'Escape') {
                        onClose();
                      }
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>Type a custom value and press Enter</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                      {selectedFieldInfo.values.map((value) => (
                        <CommandItem
                          key={String(value)}
                          value={String(value)}
                          onSelect={(v) => handleValueSubmit(v)}
                        >
                          {String(value)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              placeholder="Enter value..."
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selectedValue) {
                  handleValueSubmit(selectedValue);
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              className="min-w-[150px]"
              autoFocus
            />
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-2">
        {selectedField && selectedOperator && selectedValue && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => handleValueSubmit(selectedValue)}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};