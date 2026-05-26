import React from "react";
import { AlertTriangle, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Turbopuffer rank_by combiners. The previous math operator set
// (Add/Sub/Mul/Div/Log/Exp/Abs/Min/Pow/Sqrt) is NOT valid on the API and would
// reliably produce server errors. Restricted to documented combiners here so
// any saved-state migration stays honest about the supported surface.
export type RankingOperator = 'Sum' | 'Max' | 'Product';

const VALID_OPERATORS = new Set<RankingOperator>(['Sum', 'Max', 'Product']);

/**
 * Returns true if the saved expression contains only operators that exist in
 * the current Turbopuffer rank_by surface. Used by callers to decide whether
 * to discard pre-redesign expressions before sending them to the API.
 */
export function isRankingExpressionValid(node: RankingExprNode | null): boolean {
  if (!node) return true;
  if (node.type === 'operator') {
    if (!node.operator || !VALID_OPERATORS.has(node.operator)) return false;
    return (node.operands ?? []).every(isRankingExpressionValid);
  }
  return true;
}

export interface RankingExprNode {
  id: string;
  type: 'operator' | 'attribute' | 'constant';
  operator?: RankingOperator;
  attribute?: string;
  constant?: number;
  operands?: RankingExprNode[];
}

interface RankingExpressionBuilderProps {
  availableAttributes: string[];
  expression: RankingExprNode | null;
  onExpressionChange: (expr: RankingExprNode | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * NOTE — Custom ranking expressions are temporarily disabled.
 *
 * The previous builder emitted math operators (Add/Sub/Mul/Div/Log/Exp/Abs/Pow/
 * Sqrt) and bare attribute strings, neither of which is valid in Turbopuffer's
 * rank_by surface. Every saved Expression-mode query would error against the
 * API. We are showing a holding state until a proper redesign lands in a
 * future release with documented combiners (Sum/Max/Product) and typed leaves
 * (ANN, kNN, BM25, Attribute, Saturate, Decay, Dist). See RFC 0001 §8.5.
 *
 * For now: Simple Mode covers the common cases, and Raw Query mode supports
 * any rank_by syntax the API understands.
 */
export const RankingExpressionBuilder: React.FC<RankingExpressionBuilderProps> = ({
  expression,
  onExpressionChange,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Ranking Expression
        </span>
      </div>

      {/* Holding notice */}
      <div className="p-3 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-xs">
            <p className="font-medium text-foreground">
              Custom ranking expressions are under redesign
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The previous builder produced expressions the Turbopuffer API doesn't accept.
              While we rebuild it around the documented <code className="text-[10px] px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">Sum</code>, <code className="text-[10px] px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">Max</code>, and <code className="text-[10px] px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">Product</code> combiners,
              use <strong>Simple Mode</strong> for vector/BM25 queries, or <strong>Raw Query Mode</strong> for hand-written <code className="text-[10px] px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">rank_by</code> trees.
            </p>
          </div>
        </div>
      </div>

      {/* Existing expression (read-only) + safe clear */}
      {expression && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span>Saved expression (read-only)</span>
            <ArrowRight className="h-2.5 w-2.5" />
            <span>not sent to the API</span>
          </div>
          <pre className="text-[10px] font-mono p-2 rounded bg-muted/40 border whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto">
            {JSON.stringify(expression, null, 2)}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onExpressionChange(null)}
          >
            Discard saved expression
          </Button>
        </div>
      )}
    </div>
  );
};
