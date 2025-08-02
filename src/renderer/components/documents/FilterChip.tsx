import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SimpleFilter {
  id: string;
  attribute: string;
  operator: string;
  value: any;
  displayValue: string;
}

interface FilterChipProps {
  filter: SimpleFilter;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ filter, onRemove }) => {
  return (
    <div className="flex items-center gap-1 p-1 pr-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
      <Badge variant="secondary" className="font-mono text-xs px-2">
        {filter.attribute}
      </Badge>
      <span className="text-xs text-muted-foreground mx-1">
        {filter.operator}
      </span>
      <span
        className="text-xs font-medium max-w-[100px] truncate"
        title={String(filter.value)}
      >
        {typeof filter.value === "object"
          ? JSON.stringify(filter.value)
          : String(filter.value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-4 w-4 ml-1 text-muted-foreground hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
