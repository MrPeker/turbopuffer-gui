import React from 'react';
import {
  Trash2,
  Settings,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  Braces,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AttributeSchema, AttributeType } from '@/types/namespace';

interface SchemaAttribute {
  name: string;
  schema: AttributeSchema;
  isInferred?: boolean;
  isBuiltIn?: boolean;
}

interface SchemaAttributeCardProps {
  attribute: SchemaAttribute;
  indexBuilding?: boolean;
  onUpdate?: (updates: Partial<AttributeSchema>) => void;
  onRemove: () => void;
  onEdit: () => void;
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  string: <Type className="h-4 w-4" />,
  int: <Hash className="h-4 w-4" />,
  uint: <Hash className="h-4 w-4" />,
  uuid: <Hash className="h-4 w-4" />,
  datetime: <Calendar className="h-4 w-4" />,
  bool: <ToggleLeft className="h-4 w-4" />,
  '[]string': <List className="h-4 w-4" />,
  '[]int': <List className="h-4 w-4" />,
  '[]uint': <List className="h-4 w-4" />,
  '[]uuid': <List className="h-4 w-4" />,
  '[]datetime': <List className="h-4 w-4" />,
  vector: <Braces className="h-4 w-4" />,
};

export const SchemaAttributeCard: React.FC<SchemaAttributeCardProps> = ({
  attribute,
  indexBuilding = false,
  onUpdate,
  onRemove,
  onEdit,
}) => {
  const getTypeDisplayName = (type: AttributeType): string => {
    if (typeof type === 'object') {
      return `vector ${type.type}`;
    }
    return type;
  };

  const getTypeIcon = (type: AttributeType) => {
    if (typeof type === 'object') {
      return fieldTypeIcons.vector;
    }
    return fieldTypeIcons[type] || fieldTypeIcons.string;
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(attribute.schema.type)}
          <span className="font-medium">{attribute.name}</span>
          <Badge variant="outline">{getTypeDisplayName(attribute.schema.type)}</Badge>
          
          {attribute.isBuiltIn && (
            <Badge variant="secondary">Built-in</Badge>
          )}
          {attribute.isInferred && (
            <Badge variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              Inferred
            </Badge>
          )}
          {!attribute.isInferred && !attribute.isBuiltIn && attribute.isInferred !== undefined && (
            <Badge variant="default">
              <Settings className="h-3 w-3 mr-1" />
              Explicit
            </Badge>
          )}
          
          {attribute.schema.filterable && (
            <Badge variant="default">Filterable</Badge>
          )}
          {(attribute.schema.full_text_search === true || (typeof attribute.schema.full_text_search === 'object' && attribute.schema.full_text_search !== null)) && (
            <Badge variant="default">Full-text Search</Badge>
          )}
          {indexBuilding && (
            <Badge variant="outline">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Building Index
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={attribute.isBuiltIn}
        >
          <Settings className="h-4 w-4" />
        </Button>
        {!attribute.isBuiltIn && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};