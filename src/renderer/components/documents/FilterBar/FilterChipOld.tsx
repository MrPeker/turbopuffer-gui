import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SimpleFilter {
  id: string;
  attribute: string;
  operator: string;
  value: any;
  displayValue: string;
}

interface EnhancedFilterChipProps {
  filter: SimpleFilter;
  onRemove: () => void;
  matchCount?: number;
  className?: string;
}

const OPERATOR_SYMBOLS: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  contains: '∋',
  greater: '>',
  less: '<',
  greater_than: '>',
  less_than: '<',
  in: '∈',
  not_in: '∉',
};

export const EnhancedFilterChip: React.FC<EnhancedFilterChipProps> = ({
  filter,
  onRemove,
  matchCount,
  className,
}) => {
  const operatorSymbol = OPERATOR_SYMBOLS[filter.operator] || filter.operator;
  
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.length > 2 
        ? `[${value.slice(0, 2).join(', ')}... +${value.length - 2}]`
        : `[${value.join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    const strValue = String(value);
    return strValue.length > 20 ? strValue.substring(0, 20) + '...' : strValue;
  };

  const chipContent = (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/15 rounded-md border border-primary/20 transition-colors group",
      className
    )}>
      <span className="text-sm font-medium text-primary">{filter.attribute}</span>
      <span className="text-xs text-muted-foreground">{operatorSymbol}</span>
      <span className="text-sm text-foreground max-w-[100px] truncate">
        {formatValue(filter.value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="h-4 w-4 p-0 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{filter.attribute} {filter.operator} {filter.displayValue}</div>
      {matchCount !== undefined && (
        <div className="text-xs text-muted-foreground">
          {matchCount} matching document{matchCount !== 1 ? 's' : ''}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">Click × to remove</div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {chipContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};