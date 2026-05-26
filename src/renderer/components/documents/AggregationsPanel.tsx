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

export type AggregationType = 'count' | 'sum';

export interface AggregationConfig {
  id: string;
  name: string;
  type: AggregationType;
  // Required when type === 'sum'. Must reference a scalar numeric attribute
  // (int, uint, or float) per query.md aggregate_by docs.
  attribute?: string;
  groupBy: string[];
  topK?: number;
}

interface AggregationsPanelProps {
  availableAttributes: string[];
  aggregations: AggregationConfig[];
  onAggregationsChange: (aggregations: AggregationConfig[]) => void;
  // Used by Sum to pick a numeric attribute. When unavailable, falls back to
  // the full attribute list — the API will reject non-numeric attrs.
  numericAttributes?: string[];
  disabled?: boolean;
  className?: string;
}

export const AggregationsPanel: React.FC<AggregationsPanelProps> = ({
  availableAttributes,
  aggregations,
  onAggregationsChange,
  numericAttributes,
  disabled = false,
  className,
}) => {
  const activeAgg = aggregations[0];
  const activeType: AggregationType | 'none' = activeAgg?.type ?? 'none';

  const sumCandidates = numericAttributes && numericAttributes.length > 0
    ? numericAttributes
    : availableAttributes;

  const setAggregationType = (next: AggregationType | 'none') => {
    if (next === 'none') {
      onAggregationsChange([]);
      return;
    }
    if (next === 'count') {
      onAggregationsChange([{
        id: `agg-count-${Date.now()}`,
        name: 'count',
        type: 'count',
        groupBy: activeAgg?.groupBy ?? [],
        topK: activeAgg?.topK ?? 100,
      }]);
      return;
    }
    // Sum: default to first numeric attribute when available; otherwise the
    // user must pick before the request goes out.
    const defaultAttr = sumCandidates[0];
    onAggregationsChange([{
      id: `agg-sum-${Date.now()}`,
      name: defaultAttr ? `sum_${defaultAttr}` : 'sum',
      type: 'sum',
      attribute: defaultAttr,
      groupBy: activeAgg?.groupBy ?? [],
      topK: activeAgg?.topK ?? 100,
    }]);
  };

  const setSumAttribute = (attribute: string) => {
    if (!activeAgg || activeAgg.type !== 'sum') return;
    onAggregationsChange([{
      ...activeAgg,
      attribute,
      name: `sum_${attribute}`,
    }]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Simple Aggregation Selector */}
      <div className="flex items-center justify-between gap-2 p-2 bg-tp-surface-hover rounded border border-tp-border-subtle">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <Calculator className="h-3.5 w-3.5 text-tp-text-muted" />
          <span className="text-xs font-medium text-tp-text">Aggregate</span>

          <Select
            value={activeType}
            onValueChange={(value) => setAggregationType(value as AggregationType | 'none')}
            disabled={disabled}
          >
            <SelectTrigger className="h-6 w-28 text-xs border-tp-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              <SelectItem value="count" className="text-xs">Count</SelectItem>
              <SelectItem value="sum" className="text-xs">Sum</SelectItem>
            </SelectContent>
          </Select>

          {activeType === 'sum' && (
            <Select
              value={activeAgg?.attribute ?? ''}
              onValueChange={setSumAttribute}
              disabled={disabled || sumCandidates.length === 0}
            >
              <SelectTrigger className="h-6 w-44 text-xs border-tp-border">
                <SelectValue placeholder="Pick numeric attribute" />
              </SelectTrigger>
              <SelectContent>
                {sumCandidates.map((attr) => (
                  <SelectItem key={attr} value={attr} className="text-xs font-mono">
                    {attr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeAgg && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      {activeAgg && (
        <div className="flex items-start gap-2 p-2 bg-tp-bg rounded border border-tp-border-subtle">
          <Info className="h-3 w-3 text-tp-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-tp-text-muted leading-relaxed">
            {activeAgg.type === 'count' ? (
              <>
                <strong className="text-tp-text">Count</strong> returns the number of matching documents.
                Use <strong className="text-tp-text">Group By</strong> below to group results.
              </>
            ) : (
              <>
                <strong className="text-tp-text">Sum</strong> totals
                {' '}<code className="text-[10px] px-1 py-0.5 bg-muted rounded">{activeAgg.attribute || '?'}</code>
                {' '}across matching documents. Attribute must be a scalar
                {' '}<code className="text-[10px]">int</code>/<code className="text-[10px]">uint</code>/<code className="text-[10px]">float</code>.
              </>
            )}
          </p>
        </div>
      )}

      {/* Roadmap note: Min/Max/Avg/Quantile/CountDistinct are server roadmap
          items per turbopuffer-docs/turbopuffer.com_docs_roadmap.md
          ("Aggregates: distinct, min, max — Up Next"). They'll be added here
          once the API ships them — emitting them today would error. */}
    </div>
  );
};
