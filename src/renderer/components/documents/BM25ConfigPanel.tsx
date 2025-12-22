import React, { useState } from "react";
import { Plus, X, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface BM25FieldWeight {
  field: string;
  weight: number;
}

interface BM25ConfigPanelProps {
  availableFields: string[]; // String fields from schema
  selectedFields: BM25FieldWeight[];
  onFieldsChange: (fields: BM25FieldWeight[]) => void;
  operator: 'sum' | 'max' | 'product';
  onOperatorChange: (op: 'sum' | 'max' | 'product') => void;
  disabled?: boolean;
  className?: string;
}

export const BM25ConfigPanel: React.FC<BM25ConfigPanelProps> = ({
  availableFields,
  selectedFields,
  onFieldsChange,
  operator,
  onOperatorChange,
  disabled = false,
  className,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addField = (field: string) => {
    if (!selectedFields.find(f => f.field === field)) {
      onFieldsChange([...selectedFields, { field, weight: 1.0 }]);
    }
  };

  const removeField = (field: string) => {
    onFieldsChange(selectedFields.filter(f => f.field !== field));
  };

  const updateWeight = (field: string, weight: number) => {
    onFieldsChange(
      selectedFields.map(f =>
        f.field === field ? { ...f, weight } : f
      )
    );
  };

  const unusedFields = availableFields.filter(
    f => !selectedFields.find(sf => sf.field === f)
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Search Fields ({selectedFields.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Weights
          </Button>
        </div>

        {selectedFields.length === 0 ? (
          <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded border border-dashed">
            No fields selected. Add a field below.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFields.map(({ field, weight }) => (
              <div
                key={field}
                className="flex items-center gap-2 p-2 bg-muted/30 rounded border"
              >
                <span className="text-xs font-mono flex-1">{field}</span>

                {showAdvanced && (
                  <>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Weight className="h-3 w-3 text-muted-foreground" />
                      <Slider
                        value={[weight]}
                        onValueChange={([v]) => updateWeight(field, v)}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="flex-1"
                        disabled={disabled}
                      />
                      <span className="text-xs font-mono w-8 text-right">
                        {weight.toFixed(1)}
                      </span>
                    </div>
                  </>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeField(field)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Field */}
      {unusedFields.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            value=""
            onValueChange={addField}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Add field..." />
            </SelectTrigger>
            <SelectContent>
              {unusedFields.map(field => (
                <SelectItem key={field} value={field} className="text-xs">
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Multi-field Operator */}
      {selectedFields.length > 1 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Combine Scores
          </span>
          <div className="flex gap-1">
            <Button
              variant={operator === 'sum' ? 'default' : 'outline'}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onOperatorChange('sum')}
              disabled={disabled}
            >
              Sum
            </Button>
            <Button
              variant={operator === 'max' ? 'default' : 'outline'}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onOperatorChange('max')}
              disabled={disabled}
            >
              Max
            </Button>
            <Button
              variant={operator === 'product' ? 'default' : 'outline'}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onOperatorChange('product')}
              disabled={disabled}
            >
              Product
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p><strong>Sum:</strong> Add scores from all fields (default)</p>
            <p><strong>Max:</strong> Use highest score from any field</p>
            <p><strong>Product:</strong> Multiply scores (penalizes missing matches)</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedFields.length > 0 && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-[10px] text-blue-800 dark:text-blue-200">
          <strong>BM25 Query:</strong> Searching {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''}
          {selectedFields.length > 1 && ` using ${operator}`}
          {showAdvanced && selectedFields.some(f => f.weight !== 1.0) && (
            <> with custom weights</>
          )}
        </div>
      )}
    </div>
  );
};
