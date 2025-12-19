import React from "react";
import { Calculator, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AggregationConfig {
  id: string;
  name: string;
  type: 'count';
  groupBy: string[];
  topK?: number;
}

interface AggregationsPanelProps {
  availableAttributes: string[];
  aggregations: AggregationConfig[];
  onAggregationsChange: (aggregations: AggregationConfig[]) => void;
  disabled?: boolean;
  className?: string;
}

export const AggregationsPanel: React.FC<AggregationsPanelProps> = ({
  availableAttributes,
  aggregations,
  onAggregationsChange,
  disabled = false,
  className,
}) => {
  // Quick add count aggregation (the only type available)
  const hasCountAggregation = aggregations.some(a => a.type === 'count');

  const addCountAggregation = () => {
    if (hasCountAggregation) return; // Only one count aggregation needed

    const newAgg: AggregationConfig = {
      id: `agg-count-${Date.now()}`,
      name: 'count',
      type: 'count',
      groupBy: [],
      topK: 100,
    };
    onAggregationsChange([newAgg]);
  };

  const removeAggregation = () => {
    onAggregationsChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Simple Aggregation Selector */}
      <div className="flex items-center justify-between gap-2 p-2 bg-tp-surface-hover rounded border border-tp-border-subtle">
        <div className="flex items-center gap-2 flex-1">
          <Calculator className="h-3.5 w-3.5 text-tp-text-muted" />
          <span className="text-xs font-medium text-tp-text">Aggregate</span>

          <Select
            value={hasCountAggregation ? "count" : "none"}
            onValueChange={(value) => {
              if (value === "count") {
                addCountAggregation();
              } else {
                removeAggregation();
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-6 w-28 text-xs border-tp-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">
                None
              </SelectItem>
              <SelectItem value="count" className="text-xs">
                Count
              </SelectItem>
            </SelectContent>
          </Select>

          {hasCountAggregation && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      {hasCountAggregation && (
        <div className="flex items-start gap-2 p-2 bg-tp-bg rounded border border-tp-border-subtle">
          <Info className="h-3 w-3 text-tp-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-tp-text-muted leading-relaxed">
            <strong className="text-tp-text">Count</strong> will compute the number of documents.
            Use <strong className="text-tp-text">Group By</strong> below to group results by attributes.
          </p>
        </div>
      )}
    </div>
  );
};
