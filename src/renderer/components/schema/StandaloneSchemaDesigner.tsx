import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Settings,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  Braces,
  AlertCircle,
  Save,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Code,
  FileText,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SchemaAttributeCard, AddAttributeDialog } from './shared';
import type { 
  NamespaceSchema, 
  AttributeSchema, 
  AttributeType, 
  VectorType 
} from '@/types/namespace';

interface SchemaAttribute {
  name: string;
  schema: AttributeSchema;
  isInferred?: boolean;
  isBuiltIn?: boolean;
}

interface ExampleData {
  [attributeName: string]: any;
}

const SUPPORTED_LANGUAGES = [
  'arabic', 'danish', 'dutch', 'english', 'finnish', 'french', 'german', 
  'greek', 'hungarian', 'italian', 'norwegian', 'portuguese', 'romanian', 
  'russian', 'spanish', 'swedish', 'tamil', 'turkish'
];

const TOKENIZERS = [
  { value: 'word_v2', label: 'Word v2 (Unicode 16.0, with emoji)' },
  { value: 'word_v1', label: 'Word v1 (Default, Unicode 10.0)' },
  { value: 'word_v0', label: 'Word v0 (Legacy, no emoji)' },
  { value: 'pre_tokenized_array', label: 'Pre-tokenized Array' },
];

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


export const StandaloneSchemaDesigner: React.FC = () => {
  const { toast } = useToast();
  
  const [attributes, setAttributes] = useState<SchemaAttribute[]>([]);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<SchemaAttribute | null>(null);
  const [newAttribute, setNewAttribute] = useState<Partial<SchemaAttribute>>({
    name: '',
    schema: {
      type: 'string',
      filterable: true,
      full_text_search: false,
    },
    isInferred: false,
    isBuiltIn: false,
  });
  const [exampleData, setExampleData] = useState<ExampleData[]>([]);
  const [activeTab, setActiveTab] = useState('design');

  const generateExampleData = () => {
    const examples: ExampleData[] = [];
    const count = 3; // Generate 3 example documents

    for (let i = 0; i < count; i++) {
      const example: ExampleData = {};
      
      // Always include id
      example.id = i + 1;
      
      // Always include vector if not already present
      if (!attributes.some(attr => attr.name === 'vector')) {
        example.vector = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      }
      
      attributes.forEach(attr => {
        example[attr.name] = generateValueForType(attr.schema.type, i);
      });
      
      examples.push(example);
    }
    
    setExampleData(examples);
  };

  const generateValueForType = (type: AttributeType, index: number): any => {
    if (typeof type === 'object') {
      // Vector type
      const dims = parseInt(type.type.match(/\[(\d+)\]/)?.[1] || '512');
      return Array(dims).fill(0).map(() => Math.random() * 2 - 1); // Random values between -1 and 1
    }

    switch (type) {
      case 'string':
        return [`Sample text ${index + 1}`, `Example string ${index + 1}`, `Demo value ${index + 1}`][index % 3];
      case 'int':
        return [42, -10, 1000][index % 3];
      case 'uint':
        return [42, 100, 1000][index % 3];
      case 'uuid':
        return crypto.randomUUID();
      case 'datetime':
        const dates = ['2024-01-15T10:30:00Z', '2024-02-20T14:15:00Z', '2024-03-10T09:45:00Z'];
        return dates[index % 3];
      case 'bool':
        return [true, false, true][index % 3];
      case '[]string':
        return [['tag1', 'tag2'], ['category1'], ['item1', 'item2', 'item3']][index % 3];
      case '[]int':
        return [[1, 2, 3], [10, 20], [100]][index % 3];
      case '[]uint':
        return [[1, 2, 3], [10, 20], [100]][index % 3];
      case '[]uuid':
        return [[crypto.randomUUID(), crypto.randomUUID()]];
      case '[]datetime':
        return [['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z']];
      default:
        return `Unknown type: ${type}`;
    }
  };



  const handleCopyAsJSON = () => {
    const schema: NamespaceSchema = {};
    attributes.forEach(attr => {
      schema[attr.name] = attr.schema;
    });
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: 'Schema JSON has been copied to clipboard',
    });
  };

  const handleCopyAsTypeScript = () => {
    const interfaceCode = generateTypeScriptInterface();
    navigator.clipboard.writeText(interfaceCode);
    toast({
      title: 'Copied to clipboard',
      description: 'TypeScript interface has been copied to clipboard',
    });
  };

  const generateTypeScriptInterface = (): string => {
    const lines = ['interface DocumentSchema {'];
    
    attributes.forEach(attr => {
      const tsType = mapToTypeScriptType(attr.schema.type);
      lines.push(`  ${attr.name}: ${tsType};`);
    });
    
    lines.push('}');
    return lines.join('\n');
  };

  const mapToTypeScriptType = (type: AttributeType): string => {
    if (typeof type === 'object') {
      return 'number[]'; // Vector as an array of numbers
    }

    switch (type) {
      case 'string': return 'string';
      case 'int':
      case 'uint': return 'number';
      case 'uuid': return 'string';
      case 'datetime': return 'string'; // ISO date string
      case 'bool': return 'boolean';
      case '[]string': return 'string[]';
      case '[]int':
      case '[]uint': return 'number[]';
      case '[]uuid': return 'string[]';
      case '[]datetime': return 'string[]';
      default: return 'unknown';
    }
  };

  const handleAddAttribute = () => {
    if (!newAttribute.name || !newAttribute.schema) {
      toast({
        title: 'Attribute name required',
        description: 'Please enter a name for the attribute',
        variant: 'destructive',
      });
      return;
    }

    if (attributes.some(attr => attr.name === newAttribute.name)) {
      toast({
        title: 'Attribute already exists',
        description: 'An attribute with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    const attribute: SchemaAttribute = {
      name: newAttribute.name,
      schema: newAttribute.schema,
      isInferred: false,
      isBuiltIn: false,
    };

    setAttributes([...attributes, attribute]);
    setNewAttribute({
      name: '',
      schema: {
        type: 'string',
        filterable: true,
        full_text_search: false,
      },
      isInferred: false,
      isBuiltIn: false,
    });
    setShowAddAttribute(false);
  };

  const handleUpdateAttribute = (name: string, updates: Partial<AttributeSchema>) => {
    setAttributes(attributes.map(attr => 
      attr.name === name 
        ? { ...attr, schema: { ...attr.schema, ...updates } }
        : attr
    ));
  };

  const handleRemoveAttribute = (name: string) => {
    setAttributes(attributes.filter(attr => attr.name !== name));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schema Designer</h1>
          <p className="text-muted-foreground">
            Design and explore TurboPuffer schemas offline. No connection required.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-6">
          {/* Schema Attributes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Schema Attributes</CardTitle>
                  <CardDescription>Design your document structure and indexing behavior</CardDescription>
                </div>
                <Button onClick={() => setShowAddAttribute(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attributes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Braces className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No attributes defined yet. Start designing your schema!</p>
                    <Button onClick={() => setShowAddAttribute(true)} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attribute
                    </Button>
                  </div>
                ) : (
                  attributes.map(attribute => (
                    <SchemaAttributeCard
                      key={attribute.name}
                      attribute={attribute}
                      onUpdate={(updates) => handleUpdateAttribute(attribute.name, updates)}
                      onRemove={() => handleRemoveAttribute(attribute.name)}
                      onEdit={() => {
                        setEditingAttribute(attribute);
                        setShowAddAttribute(true);
                      }}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schema Summary</CardTitle>
                <CardDescription>Overview of your schema configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{attributes.length}</div>
                    <div className="text-sm text-muted-foreground">Attributes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {attributes.filter(attr => attr.schema.filterable).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Filterable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {attributes.filter(attr => attr.schema.full_text_search).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Full-text Search</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {attributes.filter(attr => typeof attr.schema.type === 'object').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Vector Fields</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Example Data</CardTitle>
                  <CardDescription>See how your schema would look with sample data</CardDescription>
                </div>
                <Button onClick={generateExampleData} disabled={attributes.length === 0}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Examples
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exampleData.length > 0 ? (
                <div className="space-y-4">
                  {exampleData.map((example, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Document {index + 1}</h4>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(example, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate example data to see how your schema works with real documents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>JSON Schema</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopyAsJSON}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
                <CardDescription>TurboPuffer schema configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded overflow-x-auto max-h-96">
                  {attributes.length > 0 ? JSON.stringify(
                    attributes.reduce((schema, attr) => {
                      schema[attr.name] = attr.schema;
                      return schema;
                    }, {} as NamespaceSchema),
                    null,
                    2
                  ) : '{\n  // Add attributes to see schema JSON\n}'}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>TypeScript Interface</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopyAsTypeScript}>
                    <Code className="h-4 w-4 mr-2" />
                    Copy TypeScript
                  </Button>
                </div>
                <CardDescription>TypeScript interface for your documents</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded overflow-x-auto max-h-96">
                  {attributes.length > 0 ? generateTypeScriptInterface() : 'interface DocumentSchema {\n  // Add attributes to see TypeScript interface\n}'}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Attribute Dialog */}
      <AddAttributeDialog
        open={showAddAttribute}
        attribute={editingAttribute || newAttribute}
        isEditing={!!editingAttribute}
        onOpenChange={(open) => {
          setShowAddAttribute(open);
          if (!open) {
            setEditingAttribute(null);
            setNewAttribute({
              name: '',
              schema: {
                type: 'string',
                filterable: true,
                full_text_search: false,
              },
              isInferred: false,
              isBuiltIn: false,
            });
          }
        }}
        onSave={editingAttribute ? 
          (updates) => {
            if (updates.schema) {
              handleUpdateAttribute(editingAttribute.name, updates.schema);
            }
            setShowAddAttribute(false);
            setEditingAttribute(null);
          } : 
          () => {
            handleAddAttribute();
          }
        }
        onAttributeChange={editingAttribute ? 
          (updates) => {
            setEditingAttribute({ ...editingAttribute, ...updates });
          } : 
          setNewAttribute
        }
      />

    </div>
  );
};
