import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Database,
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
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  FileJson,
  FileText,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useConnections } from '@/renderer/contexts/ConnectionContext';
import { useToast } from '@/hooks/use-toast';
import { namespaceService } from '@/renderer/services/namespaceService';
import { turbopufferService } from '@/renderer/services/turbopufferService';
import { useNamespacesStore } from '@/renderer/stores/namespacesStore';
import { SchemaAttributeCard, AddAttributeDialog } from './shared';
import { ConnectionErrorState, NamespaceNotFoundState } from '../shared/ErrorStates';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  NamespaceSchema,
  AttributeSchema,
  AttributeType,
  VectorType
} from '@/types/namespace';

interface SchemaAttribute {
  name: string;
  schema: AttributeSchema;
  isInferred: boolean;
  isBuiltIn: boolean; // id only
}

interface IndexBuildingStatus {
  [attributeName: string]: {
    building: boolean;
    progress?: number;
  };
}


export const SchemaPage: React.FC = () => {
  const navigate = useNavigate();
  const { connectionId, namespaceId } = useParams<{ connectionId: string; namespaceId: string }>();
  const [searchParams] = useSearchParams();
  const regionId = searchParams.get('region');
  const { getConnectionById, turbopufferClient, clientError, setActiveConnection, isActiveConnectionReadOnly, activeConnectionId } = useConnections();
  const connection = connectionId ? getConnectionById(connectionId) : null;
  const { toast } = useToast();
  const { createNamespace } = useNamespacesStore();

  const isCreateMode = namespaceId === 'new';
  const [newNamespaceName, setNewNamespaceName] = useState('');
  const [initialDocsJson, setInitialDocsJson] = useState('');
  const [initialDocsFiles, setInitialDocsFiles] = useState<Array<{ name: string; docs: any[] }>>([]);
  const [initialDocsTab, setInitialDocsTab] = useState<'json' | 'file'>('json');
  const [attributes, setAttributes] = useState<SchemaAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [indexBuildingStatus, setIndexBuildingStatus] = useState<IndexBuildingStatus>({});
  const [error, setError] = useState<Error | null>(null);
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

  // Initialize connection when connectionId changes (only if not already active)
  useEffect(() => {
    const initConnection = async () => {
      if (!connectionId) return;
      if (connectionId === activeConnectionId) return;

      try {
        await setActiveConnection(connectionId);
      } catch (err) {
        console.error('Failed to initialize connection:', err);
        if (isCreateMode) {
          toast({
            title: 'Connection failed',
            description: err instanceof Error ? err.message : 'Could not connect. Go back and select your connection.',
            variant: 'destructive',
          });
        }
      }
    };

    initConnection();
  }, [connectionId, activeConnectionId, setActiveConnection]);

  useEffect(() => {
    if (namespaceId && namespaceId !== 'new' && connection && turbopufferClient) {
      loadSchema();
    }
  }, [namespaceId, connection, turbopufferClient, regionId]);

  const loadSchema = async () => {
    if (!namespaceId || !connection || !turbopufferClient) return;

    setLoading(true);
    setError(null);
    try {
      // Use region-specific client if regionId is provided, otherwise use primary client
      const client = regionId
        ? turbopufferService.getClientForRegion(regionId) || turbopufferClient
        : turbopufferClient;

      // Set the client for namespaceService
      namespaceService.setClient(client);

      const schema = await namespaceService.getNamespaceSchema(namespaceId);

      // Convert schema to our internal format and sort for stable ordering
      const schemaAttributes: SchemaAttribute[] = Object.entries(schema)
        .map(([name, attributeSchema]) => ({
          name,
          schema: attributeSchema,
          isInferred: !isExplicitlyConfigured(attributeSchema),
          isBuiltIn: name === 'id',
        }))
        .sort((a, b) => {
          // Built-in attributes first (id before vector)
          if (a.isBuiltIn && !b.isBuiltIn) return -1;
          if (!a.isBuiltIn && b.isBuiltIn) return 1;
          if (a.isBuiltIn && b.isBuiltIn) {
            if (a.name === 'id') return -1;
            if (b.name === 'id') return 1;
            return a.name.localeCompare(b.name);
          }
          // Alphabetical for the rest
          return a.name.localeCompare(b.name);
        });

      setAttributes(schemaAttributes);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load schema:', err);
      const error = err instanceof Error ? err : new Error('Failed to load namespace schema');
      setError(error);
      toast({
        title: 'Error loading schema',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isExplicitlyConfigured = (schema: AttributeSchema): boolean => {
    // An attribute is considered explicitly configured if it has non-default settings
    if (typeof schema.full_text_search === 'object') return true;
    if (schema.full_text_search === true) return true;
    if (schema.filterable === false) return true;
    if (typeof schema.type === 'object') return true; // Vector type
    
    // UUID, datetime, and array types are considered explicitly configured
    // as they represent specific type choices beyond simple string/int
    if (schema.type === 'uuid') return true;
    if (schema.type === 'datetime') return true;
    if (typeof schema.type === 'string' && schema.type.startsWith('[]')) return true; // Array types
    
    return false;
  };

  const handleSaveSchema = async () => {
    if (!namespaceId) return;

    setSaving(true);
    try {
      // Convert back to namespace schema format
      const schema: NamespaceSchema = {};
      attributes.forEach(attr => {
        schema[attr.name] = attr.schema;
      });

      const response = await namespaceService.updateNamespaceSchema(namespaceId, schema);
      
      // Check for HTTP 202 response (index building)
      if (response && typeof response === 'object' && 'status' in response && response.status === 202) {
        // Start polling for index building status
        startIndexBuildingPolling();
        toast({
          title: 'Schema update initiated',
          description: 'Schema changes are being applied. Index building may take some time.',
        });
      } else {
        toast({
          title: 'Schema saved',
          description: 'Your schema changes have been saved successfully',
        });
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save schema:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save schema changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const startIndexBuildingPolling = () => {
    // Mark all non-inferred attributes as having building indexes
    const buildingStatus: IndexBuildingStatus = {};
    attributes.forEach(attr => {
      if (!attr.isInferred && !attr.isBuiltIn) {
        buildingStatus[attr.name] = { building: true };
      }
    });
    setIndexBuildingStatus(buildingStatus);

    const pollInterval = setInterval(async () => {
      try {
        // Try to get the schema to see if indexes are ready
        // The TurboPuffer API will return HTTP 202 if indexes are still building
        const schema = await namespaceService.getNamespaceSchema(namespaceId!);
        
        // If we successfully get the schema without a 202 status, indexes are ready
        setIndexBuildingStatus({});
        clearInterval(pollInterval);
        toast({
          title: 'Schema update complete',
          description: 'All indexes have been built and are ready for use.',
        });
      } catch (error) {
        // Check if the error indicates that indexes are still building (HTTP 202)
        if (error instanceof Error) {
          // Continue polling if we get 202-related errors
          if (error.message.includes('202') || error.message.includes('building')) {
            return; // Keep polling
          }
          // For other errors, stop polling
          console.warn('Polling error:', error);
          clearInterval(pollInterval);
          setIndexBuildingStatus({});
        }
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes to prevent indefinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      setIndexBuildingStatus({});
      toast({
        title: 'Polling timeout',
        description: 'Index building status polling has timed out. Indexes may still be building.',
        variant: 'destructive',
      });
    }, 300000);
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
    setHasChanges(true);
  };

  const handleUpdateAttribute = (name: string, updates: Partial<AttributeSchema>) => {
    setAttributes(attributes.map(attr => 
      attr.name === name 
        ? { 
            ...attr, 
            schema: { ...attr.schema, ...updates },
            isInferred: false // Mark as explicitly configured
          }
        : attr
    ));
    setHasChanges(true);
  };

  const handleRemoveAttribute = (name: string) => {
    if (name === 'id') {
      toast({
        title: 'Cannot remove id attribute',
        description: 'The id attribute is required and cannot be removed',
        variant: 'destructive',
      });
      return;
    }

    setAttributes(attributes.filter(attr => attr.name !== name));
    setHasChanges(true);
  };

  const getInitialDocuments = (): any[] => {
    let docs: any[] = [];

    // From JSON input
    if (initialDocsJson.trim()) {
      try {
        const parsed = JSON.parse(initialDocsJson);
        docs = docs.concat(Array.isArray(parsed) ? parsed : [parsed]);
      } catch {
        // validation happens at submit time
      }
    }

    // From file imports
    initialDocsFiles.forEach(f => {
      docs = docs.concat(f.docs);
    });

    return docs;
  };

  const onDropFiles = async (acceptedFiles: File[]) => {
    const parsed: Array<{ name: string; docs: any[] }> = [];

    for (const file of acceptedFiles) {
      try {
        const content = await file.text();
        let docs: any[] = [];

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          docs = Array.isArray(data) ? data : [data];
        } else if (file.name.endsWith('.csv')) {
          const result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true });
          if (result.errors.length > 0) {
            const msgs = result.errors.slice(0, 3).map(e => `Row ${e.row}: ${e.message}`).join('; ');
            toast({ title: `CSV warnings in ${file.name}`, description: msgs, variant: 'destructive' });
          }
          docs = (result.data as any[]).filter(row =>
            Object.values(row).some(v => v !== null && v !== undefined && v !== '')
          );
        } else if (file.name.endsWith('.ndjson') || file.name.endsWith('.jsonl')) {
          const lines = content.trim().split('\n');
          const errors: string[] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            try {
              docs.push(JSON.parse(line));
            } catch (e) {
              errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
            }
          }
          if (errors.length > 0) {
            toast({ title: `${errors.length} parse error(s) in ${file.name}`, description: errors.slice(0, 3).join('; '), variant: 'destructive' });
          }
        }

        if (docs.length > 0) {
          parsed.push({ name: file.name, docs });
        } else {
          toast({ title: `No documents found in ${file.name}`, description: 'The file was parsed but contained no documents', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: `Failed to parse ${file.name}`, description: e instanceof Error ? e.message : 'Invalid format', variant: 'destructive' });
      }
    }

    setInitialDocsFiles(prev => [...prev, ...parsed]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropFiles,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/x-ndjson': ['.ndjson', '.jsonl'],
    },
    noClick: !isCreateMode,
    noDrag: !isCreateMode,
  });

  const handleCreateNamespace = async () => {
    if (!newNamespaceName.trim()) {
      toast({ title: 'Namespace name required', description: 'Please enter a namespace name', variant: 'destructive' });
      return;
    }

    const validRegex = /^[A-Za-z0-9-_.]{1,128}$/;
    if (!validRegex.test(newNamespaceName)) {
      toast({
        title: 'Invalid namespace name',
        description: 'Can only contain ASCII alphanumeric, hyphens, underscores, periods (max 128 chars)',
        variant: 'destructive',
      });
      return;
    }

    // Validate JSON input before collecting documents
    if (initialDocsJson.trim()) {
      try {
        JSON.parse(initialDocsJson);
      } catch (e) {
        toast({
          title: 'Invalid JSON',
          description: e instanceof Error ? e.message : 'Could not parse JSON input',
          variant: 'destructive',
        });
        return;
      }
    }

    const allDocs = getInitialDocuments();
    if (allDocs.length === 0) {
      toast({ title: 'Documents required', description: 'Add at least one document to create the namespace', variant: 'destructive' });
      return;
    }

    // Ensure every doc has an id
    const documents = allDocs.map((doc, i) => {
      const { id, vector, ...rest } = doc;
      return {
        id: id ?? crypto.randomUUID(),
        ...(vector ? { vector } : {}),
        ...rest,
      };
    });

    setSaving(true);
    try {
      const schema: NamespaceSchema = {};
      attributes.forEach(attr => {
        schema[attr.name] = attr.schema;
      });

      await createNamespace(newNamespaceName, documents, schema);
      toast({ title: 'Namespace created', description: `Created "${newNamespaceName}" with ${documents.length} document${documents.length > 1 ? 's' : ''}` });
      navigate(`/connections/${connectionId}/namespaces`);
    } catch (err) {
      console.error('Failed to create namespace:', err);
      toast({
        title: 'Failed to create namespace',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Early return: Connection error from context (skip in create mode — client comes from the store)
  if (!isCreateMode && clientError) {
    return <ConnectionErrorState error={clientError} />;
  }

  // Early return: Client not ready yet (skip in create mode — client comes from the store)
  if (!isCreateMode && !turbopufferClient) {
    return (
      <div className="flex flex-col h-full bg-tp-bg">
        <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Early return: Namespace not found (404 error) — skip in create mode
  if (!isCreateMode && error && (error.message.includes('404') || error.message.includes('not found')) && namespaceId) {
    return <NamespaceNotFoundState namespaceId={namespaceId} connectionId={connectionId} />;
  }

  return (
    <>
      <div className="flex flex-col h-full bg-tp-bg">
        {/* Header */}
        <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-tp-text">
              {isCreateMode ? 'create namespace' : 'schema'}
            </h1>
            {!isCreateMode && (
              <p className="text-xs text-tp-text-muted mt-0.5">
                <span className="font-mono text-tp-accent">{namespaceId}</span>
                {regionId && (
                  <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1.5 font-mono">
                    {regionId}
                  </Badge>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!isCreateMode && (
              <Button
                variant="ghost"
                onClick={loadSchema}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                refresh
              </Button>
            )}
            <Button
              onClick={isCreateMode ? handleCreateNamespace : handleSaveSchema}
              disabled={
                isCreateMode
                  ? !newNamespaceName.trim() || saving || getInitialDocuments().length === 0
                  : !hasChanges || saving || isActiveConnectionReadOnly
              }
              title={!isCreateMode && isActiveConnectionReadOnly ? "Read-only connection: write operations disabled" : undefined}
              size="sm"
            >
              {saving ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              {isCreateMode ? 'create' : 'save'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
          {isCreateMode && (
            <Card className="border-tp-border-subtle bg-tp-surface">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="ns-name" className="text-xs font-bold uppercase tracking-wider">Namespace Name</Label>
                  <Input
                    id="ns-name"
                    value={newNamespaceName}
                    onChange={(e) => setNewNamespaceName(e.target.value)}
                    placeholder="my-namespace"
                    className="font-mono"
                  />
                  <p className="text-[11px] text-tp-text-muted">
                    ASCII alphanumeric, hyphens, underscores, periods (max 128 chars)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {hasChanges && !isCreateMode && (
            <Alert className="bg-tp-surface-alt border-tp-border-strong">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-[11px] text-tp-text-muted">
                unsaved changes • click save to persist
              </AlertDescription>
            </Alert>
          )}

          {Object.keys(indexBuildingStatus).length > 0 && (
            <Alert className="bg-tp-surface-alt border-tp-border-strong">
              <Clock className="h-3 w-3" />
              <AlertDescription className="text-[11px] text-tp-text-muted">
                building indexes for modified attributes
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-tp-border-subtle bg-tp-surface">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider">schema attributes</CardTitle>
                  <CardDescription className="text-[11px] text-tp-text-muted">define attributes and indexing behavior</CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddAttribute(true)}
                  disabled={!isCreateMode && isActiveConnectionReadOnly}
                  title={!isCreateMode && isActiveConnectionReadOnly ? "Read-only connection: write operations disabled" : undefined}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-tp-text-muted">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-tp-accent" />
                    <p className="text-xs">loading schema</p>
                  </div>
                ) : attributes.length === 0 ? (
                  <div className="text-center py-8 text-tp-text-muted">
                    <p className="text-xs">no attributes defined • add one to start</p>
                  </div>
                ) : (
                  attributes.map(attribute => (
                    <SchemaAttributeCard
                      key={attribute.name}
                      attribute={attribute}
                      indexBuilding={indexBuildingStatus[attribute.name]?.building || false}
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

          {isCreateMode && (
            <Card className="border-tp-border-subtle bg-tp-surface">
              <CardHeader>
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider">initial documents</CardTitle>
                  <CardDescription className="text-[11px] text-tp-text-muted">
                    add documents to create the namespace — at least one required
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={initialDocsTab} onValueChange={(v) => setInitialDocsTab(v as 'json' | 'file')}>
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="json" className="text-xs">JSON Input</TabsTrigger>
                    <TabsTrigger value="file" className="text-xs">File Import</TabsTrigger>
                  </TabsList>

                  <TabsContent value="json" className="space-y-2 mt-3">
                    <Textarea
                      placeholder={'[\n  { "id": 1, "title": "First document" },\n  { "id": 2, "title": "Second document" }\n]'}
                      value={initialDocsJson}
                      onChange={(e) => setInitialDocsJson(e.target.value)}
                      className="font-mono text-xs min-h-[160px]"
                    />
                    {initialDocsJson.trim() && (() => {
                      try {
                        const parsed = JSON.parse(initialDocsJson);
                        const count = Array.isArray(parsed) ? parsed.length : 1;
                        return (
                          <p className="text-[11px] text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {count} document{count !== 1 ? 's' : ''} detected
                          </p>
                        );
                      } catch (e) {
                        return (
                          <p className="text-[11px] text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {e instanceof SyntaxError ? e.message : 'Invalid JSON'}
                          </p>
                        );
                      }
                    })()}
                  </TabsContent>

                  <TabsContent value="file" className="space-y-3 mt-3">
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-colors duration-200
                        ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                        hover:border-primary hover:bg-primary/5
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {isDragActive ? 'Drop files here...' : 'Drag & drop or click to select'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">JSON, CSV, NDJSON</p>
                    </div>

                    {initialDocsFiles.length > 0 && (
                      <div className="space-y-2">
                        {initialDocsFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {f.name.endsWith('.json') ? (
                                <FileJson className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-green-500" />
                              )}
                              <div>
                                <p className="text-xs font-medium">{f.name}</p>
                                <p className="text-[10px] text-muted-foreground">{f.docs.length} document{f.docs.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setInitialDocsFiles(prev => prev.filter((_, j) => j !== i))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <p className="text-[11px] text-muted-foreground">
                          {initialDocsFiles.reduce((sum, f) => sum + f.docs.length, 0)} total documents from files
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
    </>
  );
};

