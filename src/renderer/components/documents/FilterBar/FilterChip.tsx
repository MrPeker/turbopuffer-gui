import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterChipProps {
  filter: {
    id: string;
    attribute: string;
    operator: string;
    value: any;
    displayValue: string;
  };
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ filter, onRemove }) => {
  const operatorLabels: Record<string, string> = {
    equals: "=",
    not_equals: "≠",
    contains: "∋",
    greater: ">",
    greater_or_equal: "≥",
    less: "<",
    less_or_equal: "≤",
    in: "∈",
    not_in: "∉",
    matches: "≈",
    not_matches: "≉",
    imatches: "≈i",
    not_imatches: "≉i",
  };

  // Format display value more nicely
  const formatDisplayValue = () => {
    if (filter.value === null) {
      return "null";
    } else if (Array.isArray(filter.value)) {
      if (filter.value.length > 3) {
        return `[${filter.value.slice(0, 3).join(", ")}, ...]`;
      }
      return `[${filter.value.join(", ")}]`;
    } else {
      return String(filter.value);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/60 hover:bg-secondary/80 rounded-md border border-border/50 transition-colors group">
      <span className="text-xs font-medium">{filter.attribute}</span>
      <span className="text-xs text-muted-foreground">
        {operatorLabels[filter.operator] || filter.operator}
      </span>
      <span
        className="text-xs max-w-[120px] truncate"
        title={formatDisplayValue()}
      >
        {formatDisplayValue()}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="h-3.5 w-3.5 p-0 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};