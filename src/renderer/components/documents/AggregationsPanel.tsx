import React, { useState } from "react";
import { Plus, X, BarChart3, Hash } from "lucide-react";
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
  const [newAggName, setNewAggName] = useState("");

  // Add new aggregation
  const addAggregation = () => {
    const name = newAggName.trim() || `Aggregation ${aggregations.length + 1}`;
    const newAgg: AggregationConfig = {
      id: `agg-${Date.now()}-${Math.random()}`,
      name,
      type: 'count',
      groupBy: [],
      topK: 10,
    };
    onAggregationsChange([...aggregations, newAgg]);
    setNewAggName("");
  };

  // Remove aggregation
  const removeAggregation = (id: string) => {
    onAggregationsChange(aggregations.filter(a => a.id !== id));
  };

  // Update aggregation property
  const updateAggregation = (id: string, updates: Partial<AggregationConfig>) => {
    onAggregationsChange(
      aggregations.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  };

  // Add group by field
  const addGroupByField = (aggId: string, field: string) => {
    const agg = aggregations.find(a => a.id === aggId);
    if (!agg) return;

    if (!agg.groupBy.includes(field)) {
      updateAggregation(aggId, {
        groupBy: [...agg.groupBy, field],
      });
    }
  };

  // Remove group by field
  const removeGroupByField = (aggId: string, field: string) => {
    const agg = aggregations.find(a => a.id === aggId);
    if (!agg) return;

    updateAggregation(aggId, {
      groupBy: agg.groupBy.filter(f => f !== field),
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          <BarChart3 className="inline h-3 w-3 mr-1" />
          Aggregations ({aggregations.length})
        </span>
      </div>

      {/* Aggregations List */}
      {aggregations.length === 0 ? (
        <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded border border-dashed">
          No aggregations configured. Add one below to group and count results.
        </div>
      ) : (
        <div className="space-y-3">
          {aggregations.map((agg) => {
            const unusedFields = availableAttributes.filter(f => !agg.groupBy.includes(f));

            return (
              <div
                key={agg.id}
                className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded space-y-2"
              >
                {/* Aggregation Header */}
                <div className="flex items-center gap-2">
                  <Input
                    value={agg.name}
                    onChange={(e) => updateAggregation(agg.id, { name: e.target.value })}
                    className="h-6 text-xs flex-1 bg-white dark:bg-black"
                    placeholder="Aggregation name"
                    disabled={disabled}
                  />
                  <Badge variant="outline" className="text-[10px] bg-purple-100 dark:bg-purple-900">
                    {agg.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeAggregation(agg.id)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Group By Fields */}
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-purple-700 dark:text-purple-300">
                    Group by:
                  </div>
                  {agg.groupBy.length === 0 ? (
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 italic">
                      No fields selected. Add a field below.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {agg.groupBy.map((field) => (
                        <Badge
                          key={field}
                          variant="secondary"
                          className="text-[10px] bg-purple-200 dark:bg-purple-900"
                        >
                          {field}
                          <button
                            onClick={() => removeGroupByField(agg.id, field)}
                            className="ml-1 hover:text-destructive"
                            disabled={disabled}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Field Dropdown */}
                  {unusedFields.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(field) => addGroupByField(agg.id, field)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-6 text-xs w-full bg-white dark:bg-black">
                        <SelectValue placeholder="Add field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unusedFields.map((field) => (
                          <SelectItem key={field} value={field} className="text-xs">
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Top K */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300">
                    <Hash className="inline h-3 w-3 mr-0.5" />
                    Top K:
                  </span>
                  <Input
                    type="number"
                    value={agg.topK || 10}
                    onChange={(e) => updateAggregation(agg.id, { topK: parseInt(e.target.value) || 10 })}
                    className="h-6 text-xs w-20 bg-white dark:bg-black"
                    min={1}
                    max={1000}
                    disabled={disabled}
                  />
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">
                    groups to return
                  </span>
                </div>

                {/* Summary */}
                <div className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 p-2 rounded">
                  <strong>Result:</strong> Count documents grouped by{" "}
                  {agg.groupBy.length > 0 ? (
                    <>
                      <code className="bg-purple-200 dark:bg-purple-800 px-1 rounded">
                        {agg.groupBy.join(", ")}
                      </code>
                      , showing top {agg.topK} groups
                    </>
                  ) : (
                    "no fields (select fields above)"
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Aggregation */}
      <div className="flex items-center gap-2">
        <Input
          value={newAggName}
          onChange={(e) => setNewAggName(e.target.value)}
          placeholder="Aggregation name (optional)"
          className="h-7 text-xs flex-1"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addAggregation();
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={addAggregation}
          disabled={disabled}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Aggregation
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1 bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
        <p><strong>Aggregations:</strong> Group and count documents by attribute values.</p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li><strong>Group by:</strong> Select one or more attributes to group by</li>
          <li><strong>Top K:</strong> Limit results to the top K groups by count</li>
          <li><strong>Multiple:</strong> Add multiple aggregations for different groupings</li>
          <li><strong>Example:</strong> Group by <code className="text-[9px]">category</code> and <code className="text-[9px]">status</code> to see document counts per category-status combination</li>
        </ul>
      </div>
    </div>
  );
};
