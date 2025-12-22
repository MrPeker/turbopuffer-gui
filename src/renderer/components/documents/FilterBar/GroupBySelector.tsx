import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ListTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';
import { Badge } from '@/components/ui/badge';

export const GroupBySelector: React.FC = () => {
  const {
    attributes,
    groupByAttributes,
    setGroupByAttributes,
  } = useDocumentsStore();

  const [isOpen, setIsOpen] = useState(false);

  // Filter attributes that are suitable for grouping (exclude vectors)
  const groupableAttributes = attributes.filter(
    (attr) => attr.type !== 'vector' && attr.name !== 'vector'
  );

  const handleToggleAttribute = (attributeName: string) => {
    if (groupByAttributes.includes(attributeName)) {
      // Remove attribute
      setGroupByAttributes(groupByAttributes.filter((a) => a !== attributeName));
    } else {
      // Add attribute (limit to 3 for UX)
      if (groupByAttributes.length < 3) {
        setGroupByAttributes([...groupByAttributes, attributeName]);
      }
    }
  };

  const handleClearAll = () => {
    setGroupByAttributes([]);
  };

  if (groupableAttributes.length === 0) {
    return null; // No attributes to group by
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between py-1.5 px-2 bg-tp-surface hover:bg-tp-surface-hover rounded transition-colors">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 h-6 px-1.5 text-xs font-medium text-tp-text hover:bg-transparent"
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <ListTree className="h-3 w-3" />
            <span>Group By</span>
            {groupByAttributes.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                {groupByAttributes.length}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>

        {groupByAttributes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-5 px-1.5 text-[10px] text-tp-text-muted hover:text-tp-text"
          >
            Clear
          </Button>
        )}
      </div>

      <CollapsibleContent className="px-2 pb-2">
        <div className="mt-1 p-2 bg-tp-bg rounded border border-tp-border-subtle">
          <div className="text-[10px] text-tp-text-muted mb-2">
            Select up to 3 attributes to group results
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {groupableAttributes.map((attr) => {
              const isChecked = groupByAttributes.includes(attr.name);
              const isDisabled = !isChecked && groupByAttributes.length >= 3;

              return (
                <div
                  key={attr.name}
                  className={`flex items-center space-x-1.5 p-1 rounded hover:bg-tp-surface-hover transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && handleToggleAttribute(attr.name)}
                >
                  <Checkbox
                    id={`group-${attr.name}`}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={() => handleToggleAttribute(attr.name)}
                    className="h-3 w-3"
                  />
                  <Label
                    htmlFor={`group-${attr.name}`}
                    className={`text-xs font-mono cursor-pointer ${
                      isDisabled ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {attr.name}
                    <span className="text-[10px] text-tp-text-muted ml-1">
                      ({attr.type})
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>

          {groupByAttributes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-tp-border-subtle">
              <div className="text-[10px] text-tp-text-muted mb-1">
                Grouping by:
              </div>
              <div className="flex flex-wrap gap-1">
                {groupByAttributes.map((attr, index) => (
                  <Badge
                    key={attr}
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] font-mono"
                  >
                    {index + 1}. {attr}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
