import React, { useState } from "react";
import { Plus, X, Code2, ArrowUp, ArrowDown, Calculator } from "lucide-react";
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

// Ranking expression types (matching UnifiedQuery model)
export type RankingOperator =
  | 'Add' | 'Sub' | 'Mul' | 'Div'
  | 'Log' | 'Exp' | 'Abs'
  | 'Min' | 'Max'
  | 'Pow' | 'Sqrt';

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

const OPERATORS: { value: RankingOperator; label: string; arity: number }[] = [
  { value: 'Add', label: 'Add (+)', arity: 2 },
  { value: 'Sub', label: 'Subtract (−)', arity: 2 },
  { value: 'Mul', label: 'Multiply (×)', arity: 2 },
  { value: 'Div', label: 'Divide (÷)', arity: 2 },
  { value: 'Min', label: 'Min', arity: 2 },
  { value: 'Max', label: 'Max', arity: 2 },
  { value: 'Pow', label: 'Power (^)', arity: 2 },
  { value: 'Log', label: 'Log', arity: 1 },
  { value: 'Exp', label: 'Exp', arity: 1 },
  { value: 'Abs', label: 'Abs', arity: 1 },
  { value: 'Sqrt', label: 'Sqrt', arity: 1 },
];

export const RankingExpressionBuilder: React.FC<RankingExpressionBuilderProps> = ({
  availableAttributes,
  expression,
  onExpressionChange,
  disabled = false,
  className,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Create a new empty operator node
  const createOperatorNode = (operator: RankingOperator): RankingExprNode => {
    const operatorDef = OPERATORS.find(op => op.value === operator);
    const arity = operatorDef?.arity || 2;

    return {
      id: `node-${Date.now()}-${Math.random()}`,
      type: 'operator',
      operator,
      operands: Array(arity).fill(null).map(() => createAttributeNode(availableAttributes[0] || 'id')),
    };
  };

  // Create a new attribute node
  const createAttributeNode = (attribute: string): RankingExprNode => ({
    id: `node-${Date.now()}-${Math.random()}`,
    type: 'attribute',
    attribute,
  });

  // Create a new constant node
  const createConstantNode = (value: number): RankingExprNode => ({
    id: `node-${Date.now()}-${Math.random()}`,
    type: 'constant',
    constant: value,
  });

  // Update a node by ID
  const updateNode = (nodeId: string, updates: Partial<RankingExprNode>) => {
    if (!expression) return;

    const updateRecursive = (node: RankingExprNode): RankingExprNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.operands) {
        return {
          ...node,
          operands: node.operands.map(updateRecursive),
        };
      }
      return node;
    };

    onExpressionChange(updateRecursive(expression));
  };

  // Remove a node by ID
  const removeNode = (nodeId: string) => {
    if (!expression || expression.id === nodeId) {
      onExpressionChange(null);
      return;
    }

    const removeRecursive = (node: RankingExprNode): RankingExprNode | null => {
      if (!node.operands) return node;

      const newOperands = node.operands
        .map(operand => {
          if (operand.id === nodeId) return null;
          return removeRecursive(operand);
        })
        .filter((op): op is RankingExprNode => op !== null);

      return { ...node, operands: newOperands };
    };

    const updated = removeRecursive(expression);
    onExpressionChange(updated);
  };

  // Add operand to operator node
  const addOperand = (nodeId: string) => {
    if (!expression) return;

    const addRecursive = (node: RankingExprNode): RankingExprNode => {
      if (node.id === nodeId && node.type === 'operator') {
        return {
          ...node,
          operands: [...(node.operands || []), createAttributeNode(availableAttributes[0] || 'id')],
        };
      }
      if (node.operands) {
        return {
          ...node,
          operands: node.operands.map(addRecursive),
        };
      }
      return node;
    };

    onExpressionChange(addRecursive(expression));
  };

  // Convert expression to Turbopuffer format for preview
  const convertToTurbopuffer = (node: RankingExprNode | null): any => {
    if (!node) return null;

    if (node.type === 'attribute') {
      return node.attribute;
    }

    if (node.type === 'constant') {
      return node.constant;
    }

    if (node.type === 'operator' && node.operator && node.operands) {
      return [
        node.operator,
        ...node.operands.map(convertToTurbopuffer),
      ];
    }

    return null;
  };

  // Render a single node
  const renderNode = (node: RankingExprNode, depth = 0): React.ReactNode => {
    const indent = depth * 20;

    if (node.type === 'attribute') {
      return (
        <div
          key={node.id}
          className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded"
          style={{ marginLeft: `${indent}px` }}
        >
          <Badge variant="outline" className="text-[10px] bg-blue-100 dark:bg-blue-900">
            Attribute
          </Badge>
          <Select
            value={node.attribute}
            onValueChange={(value) => updateNode(node.id, { attribute: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-6 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes.map((attr) => (
                <SelectItem key={attr} value={attr} className="text-xs">
                  {attr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => removeNode(node.id)}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (node.type === 'constant') {
      return (
        <div
          key={node.id}
          className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded"
          style={{ marginLeft: `${indent}px` }}
        >
          <Badge variant="outline" className="text-[10px] bg-purple-100 dark:bg-purple-900">
            Constant
          </Badge>
          <Input
            type="number"
            value={node.constant || 0}
            onChange={(e) => updateNode(node.id, { constant: parseFloat(e.target.value) || 0 })}
            className="h-6 text-xs w-24"
            disabled={disabled}
            step="0.1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => removeNode(node.id)}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (node.type === 'operator') {
      return (
        <div key={node.id} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
            <Badge variant="outline" className="text-[10px] bg-green-100 dark:bg-green-900">
              Operator
            </Badge>
            <Select
              value={node.operator}
              onValueChange={(value) => {
                const operatorDef = OPERATORS.find(op => op.value === value);
                const arity = operatorDef?.arity || 2;
                const currentOperands = node.operands || [];

                // Adjust operands to match arity
                let newOperands = [...currentOperands];
                if (newOperands.length < arity) {
                  while (newOperands.length < arity) {
                    newOperands.push(createAttributeNode(availableAttributes[0] || 'id'));
                  }
                } else if (newOperands.length > arity) {
                  newOperands = newOperands.slice(0, arity);
                }

                updateNode(node.id, { operator: value as RankingOperator, operands: newOperands });
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-6 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-xs">
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => removeNode(node.id)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Operands */}
          <div className="space-y-2 pl-4 border-l-2 border-green-200 dark:border-green-800">
            {node.operands?.map((operand) => renderNode(operand, depth + 1))}

            {/* Add operand button (for variadic operators) */}
            {node.operator && ['Add', 'Mul', 'Min', 'Max'].includes(node.operator) && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs ml-4"
                onClick={() => addOperand(node.id)}
                disabled={disabled}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add operand
              </Button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          <Calculator className="inline h-3 w-3 mr-1" />
          Ranking Expression
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px]"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Code2 className="h-3 w-3 mr-1" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      {/* Expression Builder */}
      {!expression ? (
        <div className="p-4 bg-muted/30 rounded border border-dashed text-center space-y-2">
          <p className="text-xs text-muted-foreground">No expression defined</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onExpressionChange(createOperatorNode('Add'))}
              disabled={disabled}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Expression
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 bg-muted/20 rounded border">
          {renderNode(expression)}
        </div>
      )}

      {/* Quick Add Buttons */}
      {expression && (
        <div className="flex gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground mr-2 self-center">Quick add:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => onExpressionChange(createOperatorNode('Add'))}
            disabled={disabled}
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            New Expression
          </Button>
        </div>
      )}

      {/* Preview */}
      {showPreview && expression && (
        <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-1">
            Turbopuffer format:
          </div>
          <pre className="text-[10px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all">
            {JSON.stringify(convertToTurbopuffer(expression), null, 2)}
          </pre>
        </div>
      )}

      {/* Help Text */}
      <div className="text-[10px] text-muted-foreground space-y-1 bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
        <p><strong>Expression Ranking:</strong> Build custom scoring formulas using attributes and math operators.</p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li><strong>Operators:</strong> Add, Subtract, Multiply, Divide, Log, Exp, Abs, Min, Max, Power, Sqrt</li>
          <li><strong>Attributes:</strong> Reference any numeric attribute from your schema</li>
          <li><strong>Constants:</strong> Add fixed numeric values</li>
          <li><strong>Example:</strong> <code className="text-[9px]">["Add", ["Mul", 2, "relevance"], "popularity"]</code></li>
        </ul>
      </div>
    </div>
  );
};
