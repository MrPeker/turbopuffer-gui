import React from "react";
import { BarChart3, Hash, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AggregationResult {
  label: string; // Aggregation name
  groups: {
    key: Record<string, any>; // Group by values (e.g., { category: "tech", status: "active" })
    count: number; // Count of documents in this group
  }[];
}

interface AggregationResultsProps {
  results: AggregationResult[];
  onClose?: () => void;
  className?: string;
}

export const AggregationResults: React.FC<AggregationResultsProps> = ({
  results,
  onClose,
  className,
}) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Calculate max count for bar visualization
  const getMaxCount = (groups: AggregationResult['groups']) => {
    return Math.max(...groups.map(g => g.count), 1);
  };

  return (
    <div className={cn("space-y-4 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
            Aggregation Results
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {results.length} {results.length === 1 ? 'aggregation' : 'aggregations'}
          </Badge>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Aggregation Results */}
      <div className="space-y-4">
        {results.map((result, idx) => {
          const maxCount = getMaxCount(result.groups);
          const totalCount = result.groups.reduce((sum, g) => sum + g.count, 0);

          return (
            <div
              key={idx}
              className="space-y-2 p-3 bg-white dark:bg-black rounded border border-purple-200 dark:border-purple-800"
            >
              {/* Aggregation Name */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {result.label}
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400">
                  <Hash className="inline h-3 w-3 mr-0.5" />
                  {totalCount} total documents
                </div>
              </div>

              {/* Groups */}
              {result.groups.length === 0 ? (
                <div className="text-xs text-purple-600 dark:text-purple-400 italic p-2 text-center">
                  No groups found
                </div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {result.groups.map((group, groupIdx) => {
                    const percentage = (group.count / maxCount) * 100;
                    const groupKeys = Object.entries(group.key);

                    return (
                      <div
                        key={groupIdx}
                        className="flex items-center gap-2 p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900 rounded"
                      >
                        {/* Group Key */}
                        <div className="flex-1 flex flex-wrap items-center gap-1 min-w-0">
                          {groupKeys.map(([key, value], keyIdx) => (
                            <div key={keyIdx} className="flex items-center gap-0.5">
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                {key}:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-purple-100 dark:bg-purple-900 font-mono max-w-[150px] truncate"
                                title={String(value)}
                              >
                                {String(value)}
                              </Badge>
                              {keyIdx < groupKeys.length - 1 && (
                                <span className="text-[10px] text-purple-400 dark:text-purple-600">
                                  ·
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Bar Visualization */}
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-4 bg-purple-100 dark:bg-purple-900 rounded overflow-hidden">
                            <div
                              className="h-full bg-purple-500 dark:bg-purple-600 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-purple-700 dark:text-purple-300 w-12 text-right">
                            {group.count.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              <div className="text-[10px] text-purple-600 dark:text-purple-400 pt-2 border-t border-purple-200 dark:border-purple-800">
                Showing {result.groups.length} {result.groups.length === 1 ? 'group' : 'groups'}
                {result.groups.length > 0 && (
                  <>
                    {" · "}
                    Top group: <strong>{result.groups[0]?.count.toLocaleString()}</strong> documents
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-[10px] text-purple-600 dark:text-purple-400 space-y-1 pt-2 border-t border-purple-200 dark:border-purple-800">
        <p><strong>Reading Results:</strong></p>
        <ul className="list-disc list-inside ml-2">
          <li>Each bar shows the relative count for that group</li>
          <li>Groups are typically sorted by count (highest first)</li>
          <li>Hover over values to see full text</li>
        </ul>
      </div>
    </div>
  );
};
