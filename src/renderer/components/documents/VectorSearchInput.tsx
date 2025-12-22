import React, { useState, useCallback } from "react";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface VectorSearchInputProps {
  onVectorChange: (vector: number[] | null, field: string) => void;
  vectorFields: string[]; // Available vector fields from schema
  disabled?: boolean;
  className?: string;
}

export const VectorSearchInput: React.FC<VectorSearchInputProps> = ({
  onVectorChange,
  vectorFields,
  disabled = false,
  className,
}) => {
  const [vectorText, setVectorText] = useState("");
  const [selectedField, setSelectedField] = useState(vectorFields[0] || "");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedVector, setParsedVector] = useState<number[] | null>(null);

  // Parse vector from text input
  const parseVector = useCallback((text: string): number[] | null => {
    if (!text.trim()) {
      return null;
    }

    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed) && parsed.every(v => typeof v === 'number')) {
        return parsed;
      }

      // Try to parse as comma-separated numbers
      const numbers = text
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseFloat(s));

      if (numbers.every(n => !isNaN(n))) {
        return numbers;
      }

      return null;
    } catch {
      // Try comma-separated as fallback
      const numbers = text
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseFloat(s));

      if (numbers.length > 0 && numbers.every(n => !isNaN(n))) {
        return numbers;
      }

      return null;
    }
  }, []);

  // Handle text change
  const handleTextChange = (text: string) => {
    setVectorText(text);

    if (!text.trim()) {
      setParseError(null);
      setParsedVector(null);
      onVectorChange(null, selectedField);
      return;
    }

    const vector = parseVector(text);
    if (vector) {
      setParseError(null);
      setParsedVector(vector);
      onVectorChange(vector, selectedField);
    } else {
      setParseError("Invalid vector format. Use JSON array or comma-separated numbers.");
      setParsedVector(null);
      onVectorChange(null, selectedField);
    }
  };

  // Handle field change
  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    if (parsedVector) {
      onVectorChange(parsedVector, field);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleTextChange(text);
    };
    reader.readAsText(file);
  };

  // Clear vector
  const handleClear = () => {
    setVectorText("");
    setParseError(null);
    setParsedVector(null);
    onVectorChange(null, selectedField);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Vector Field Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Vector field:</span>
        <Select
          value={selectedField}
          onValueChange={handleFieldChange}
          disabled={disabled || vectorFields.length === 0}
        >
          <SelectTrigger className="h-7 w-[160px] text-xs">
            <SelectValue placeholder="Select field..." />
          </SelectTrigger>
          <SelectContent>
            {vectorFields.map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {parsedVector && (
          <Badge variant="outline" className="text-[10px]">
            {parsedVector.length} dimensions
          </Badge>
        )}
      </div>

      {/* Vector Input */}
      <div className="relative">
        <Textarea
          value={vectorText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter query vector as JSON array or comma-separated numbers&#10;Example: [0.1, 0.2, 0.3, ...] or 0.1, 0.2, 0.3, ..."
          className="min-h-[100px] text-xs font-mono resize-y"
          disabled={disabled}
        />

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {vectorText && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => document.getElementById('vector-file-input')?.click()}
            disabled={disabled}
          >
            <Upload className="h-3 w-3" />
          </Button>

          <input
            id="vector-file-input"
            type="file"
            accept=".json,.txt,.csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Parse Status */}
      {parseError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs">{parseError}</AlertDescription>
        </Alert>
      )}

      {parsedVector && !parseError && (
        <Alert className="py-2 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-xs text-green-800 dark:text-green-200">
            Vector parsed successfully ({parsedVector.length} dimensions)
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1">
        <p>Supported formats:</p>
        <ul className="list-disc list-inside ml-2">
          <li>JSON array: [0.1, 0.2, 0.3, ...]</li>
          <li>Comma-separated: 0.1, 0.2, 0.3, ...</li>
          <li>Upload from file (.json, .txt, .csv)</li>
        </ul>
      </div>
    </div>
  );
};
