import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Database, Clock } from "lucide-react";

interface QueryPerformanceMetricsProps {
  lastQueryResult: any;
  className?: string;
}

export const QueryPerformanceMetrics: React.FC<QueryPerformanceMetricsProps> = ({
  lastQueryResult,
  className,
}) => {
  if (!lastQueryResult?.performance) {
    return null;
  }

  const perf = lastQueryResult.performance;
  const queryTimeMs = perf.query_execution_ms || perf.server_total_ms || 0;
  const cacheHitRatio = perf.cache_hit_ratio !== undefined ? perf.cache_hit_ratio * 100 : null;
  const cacheTemp = perf.cache_temperature || 'unknown';

  // Determine performance class based on query time
  const getPerformanceClass = (ms: number) => {
    if (ms < 50) return 'text-green-600 dark:text-green-400';
    if (ms < 200) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Determine cache class based on hit ratio
  const getCacheClass = (ratio: number | null) => {
    if (ratio === null) return 'text-muted-foreground';
    if (ratio > 80) return 'text-green-600 dark:text-green-400';
    if (ratio > 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 bg-muted/30 border-t border-tp-border-subtle text-[10px]",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Query:</span>
        <span className={cn("font-mono font-medium", getPerformanceClass(queryTimeMs))}>
          {queryTimeMs.toFixed(1)}ms
        </span>
      </div>

      {cacheHitRatio !== null && (
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Cache:</span>
          <span className={cn("font-mono font-medium", getCacheClass(cacheHitRatio))}>
            {cacheHitRatio.toFixed(1)}%
          </span>
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            {cacheTemp}
          </Badge>
        </div>
      )}

      {perf.billable_logical_bytes_queried !== undefined && (
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Queried:</span>
          <span className="font-mono text-muted-foreground">
            {(perf.billable_logical_bytes_queried / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      )}
    </div>
  );
};
