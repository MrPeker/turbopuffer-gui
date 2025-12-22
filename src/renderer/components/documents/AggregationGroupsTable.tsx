import React, { useMemo } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AggregationGroup } from '@/types/document';

interface AggregationGroupsTableProps {
  groups: AggregationGroup[];
  groupByAttributes: string[];
}

export const AggregationGroupsTable: React.FC<AggregationGroupsTableProps> = ({
  groups,
  groupByAttributes,
}) => {
  // Extract all column names from the first group
  const columns = useMemo(() => {
    if (groups.length === 0) return [];
    const firstGroup = groups[0];
    return Object.keys(firstGroup);
  }, [groups]);

  // Separate group keys from aggregation values
  const groupKeyColumns = useMemo(() => {
    return columns.filter((col) => groupByAttributes.includes(col));
  }, [columns, groupByAttributes]);

  const aggregationColumns = useMemo(() => {
    return columns.filter((col) => !groupByAttributes.includes(col));
  }, [columns, groupByAttributes]);

  const handleExportCSV = () => {
    // Build CSV content
    const headers = columns.join(',');
    const rows = groups.map((group) =>
      columns.map((col) => {
        const value = group[col];
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        // Escape and quote strings
        if (typeof value === 'string') {
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
            ? `"${escaped}"`
            : escaped;
        }
        return String(value);
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Download as file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `grouped-aggregations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (groups.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Grouped Aggregations
          </CardTitle>
          <CardDescription>No grouped results to display</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grouped Aggregations
            </CardTitle>
            <CardDescription>
              {groups.length} group{groups.length !== 1 ? 's' : ''} • Grouped by:{' '}
              {groupByAttributes.map((attr, i) => (
                <Badge key={attr} variant="outline" className="ml-1 text-xs font-mono">
                  {attr}
                </Badge>
              ))}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-tp-border-subtle overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-tp-surface z-10">
                <TableRow>
                  {groupKeyColumns.map((col) => (
                    <TableHead
                      key={col}
                      className="font-semibold bg-tp-surface-hover border-b border-tp-border"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{col}</span>
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                          GROUP
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                  {aggregationColumns.map((col) => (
                    <TableHead
                      key={col}
                      className="font-semibold text-right bg-tp-surface border-b border-tp-border"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-mono text-xs">{col}</span>
                        <Badge variant="default" className="h-4 px-1 text-[9px]">
                          AGG
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group, index) => (
                  <TableRow key={index} className="hover:bg-tp-surface-hover">
                    {groupKeyColumns.map((col) => (
                      <TableCell key={col} className="font-mono text-sm">
                        {formatValue(group[col])}
                      </TableCell>
                    ))}
                    {aggregationColumns.map((col) => (
                      <TableCell key={col} className="text-right font-semibold">
                        {formatValue(group[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary Stats */}
        {aggregationColumns.length > 0 && (
          <div className="mt-4 p-3 bg-tp-bg rounded border border-tp-border-subtle">
            <div className="text-xs text-tp-text-muted mb-2">Summary</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {aggregationColumns.map((col) => {
                const values = groups.map((g) => Number(g[col]) || 0);
                const total = values.reduce((sum, v) => sum + v, 0);
                const avg = total / values.length;

                return (
                  <div key={col} className="flex justify-between">
                    <span className="text-tp-text-muted font-mono text-xs">{col}:</span>
                    <span className="font-semibold">
                      Total: {total.toLocaleString()} | Avg: {avg.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to format values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
