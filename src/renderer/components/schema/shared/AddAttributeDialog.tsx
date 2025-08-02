import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { FullTextSearchConfig } from './FullTextSearchConfig';
import type { 
  AttributeSchema, 
  AttributeType, 
  VectorType 
} from '@/types/namespace';

interface SchemaAttribute {
  name: string;
  schema: AttributeSchema;
  isInferred?: boolean;
  isBuiltIn?: boolean;
}

interface AddAttributeDialogProps {
  open: boolean;
  attribute: Partial<SchemaAttribute>;
  onOpenChange: (open: boolean) => void;
  onSave: (attribute: Partial<SchemaAttribute>) => void;
  onAttributeChange: (attribute: Partial<SchemaAttribute>) => void;
  isEditing?: boolean;
}

// Utility function to get vector dimensions
export const getVectorDimensions = (vectorType: VectorType): number => {
  return parseInt(vectorType.type.match(/\[(\d+)\]/)?.[1] || '1536');
};

// Utility function to get vector precision
export const getVectorPrecision = (vectorType: VectorType): 'f16' | 'f32' => {
  return vectorType.type.includes('f16') ? 'f16' : 'f32';
};

export const AddAttributeDialog: React.FC<AddAttributeDialogProps> = ({
  open,
  attribute,
  onOpenChange,
  onSave,
  onAttributeChange,
  isEditing = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = () => {
    onSave(attribute);
  };

  const updateAttribute = (updates: Partial<SchemaAttribute>) => {
    onAttributeChange({ ...attribute, ...updates });
  };

  const updateSchema = (updates: Partial<AttributeSchema>) => {
    updateAttribute({
      schema: { ...attribute.schema, ...updates }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Attribute</DialogTitle>
          <DialogDescription>
            Define the properties and indexing behavior for your schema attribute
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Attribute Name */}
          <div className="space-y-2">
            <Label htmlFor="attr-name">Attribute Name</Label>
            <Input
              id="attr-name"
              value={attribute.name || ''}
              onChange={(e) => updateAttribute({ name: e.target.value })}
              placeholder="Enter attribute name..."
              disabled={isEditing}
            />
          </div>

          {/* Attribute Type */}
          <div className="space-y-2">
            <Label htmlFor="attr-type">Data Type</Label>
            <Select
              value={typeof attribute.schema?.type === 'object' ? 'vector' : attribute.schema?.type}
              onValueChange={(value) => {
                if (value === 'vector') {
                  updateSchema({ type: { type: '[1536]f32', ann: true } as VectorType });
                } else {
                  updateSchema({ type: value as AttributeType });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="int">Integer (signed)</SelectItem>
                <SelectItem value="uint">Integer (unsigned)</SelectItem>
                <SelectItem value="uuid">UUID</SelectItem>
                <SelectItem value="datetime">DateTime</SelectItem>
                <SelectItem value="bool">Boolean</SelectItem>
                <SelectItem value="[]string">Array of Strings</SelectItem>
                <SelectItem value="[]int">Array of Integers</SelectItem>
                <SelectItem value="[]uint">Array of Unsigned Integers</SelectItem>
                <SelectItem value="[]uuid">Array of UUIDs</SelectItem>
                <SelectItem value="[]datetime">Array of DateTimes</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vector Configuration */}
          {typeof attribute.schema?.type === 'object' && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium text-sm">Vector Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vector-dims">Dimensions</Label>
                  <Input
                    id="vector-dims"
                    type="number"
                    min="1"
                    max="4096"
                    value={
                      typeof attribute.schema.type === 'object' 
                        ? getVectorDimensions(attribute.schema.type)
                        : 1536
                    }
                    onChange={(e) => {
                      const dims = parseInt(e.target.value);
                      if (dims > 0) {
                        const vectorType = attribute.schema?.type as VectorType;
                        const precision = getVectorPrecision(vectorType);
                        updateSchema({ 
                          type: { 
                            ...vectorType, 
                            type: `[${dims}]${precision}` 
                          } 
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vector-precision">Precision</Label>
                  <Select
                    value={
                      typeof attribute.schema?.type === 'object' 
                        ? getVectorPrecision(attribute.schema.type)
                        : 'f32'
                    }
                    onValueChange={(precision: 'f16' | 'f32') => {
                      const vectorType = attribute.schema?.type as VectorType;
                      const dims = getVectorDimensions(vectorType);
                      updateSchema({ 
                        type: { 
                          ...vectorType, 
                          type: `[${dims}]${precision}` 
                        } 
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f32">f32 (32-bit float)</SelectItem>
                      <SelectItem value="f16">f16 (16-bit float)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Indexing Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Indexing Options</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="attr-filterable"
                  checked={attribute.schema?.filterable ?? true}
                  onCheckedChange={(checked) => updateSchema({ filterable: checked as boolean })}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="attr-filterable" className="text-sm font-medium">
                    Filterable
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Can be used in WHERE clauses for filtering documents
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="attr-fulltext"
                  checked={!!attribute.schema?.full_text_search}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateSchema({ 
                        full_text_search: true,
                        filterable: false // Full-text search attributes are not filterable by default
                      });
                    } else {
                      updateSchema({ 
                        full_text_search: false
                        // Don't automatically change filterable when disabling full-text search
                        // Let user explicitly control filterable setting
                      });
                    }
                  }}
                  disabled={!['string', '[]string'].includes(attribute.schema?.type as string)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="attr-fulltext" className="text-sm font-medium">
                    Full-text search (BM25)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {['string', '[]string'].includes(attribute.schema?.type as string) 
                      ? 'Enable semantic text search with BM25 ranking'
                      : 'Only available for string or string array types'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Full-Text Search Options */}
          {attribute.schema?.full_text_search && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>Advanced Full-Text Search Options</span>
                  {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <FullTextSearchConfig
                  config={typeof attribute.schema.full_text_search === 'object' 
                    ? attribute.schema.full_text_search 
                    : {}
                  }
                  onChange={(config) => updateSchema({ full_text_search: config })}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Attribute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};