import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { useNamespace } from '@/renderer/contexts/NamespaceContext';
import { useToast } from '@/hooks/use-toast';
import { RequireNamespace } from '@/renderer/components/layout/RequireNamespace';
import { namespaceService } from '@/renderer/services/namespaceService';
import { turbopufferService } from '@/renderer/services/turbopufferService';
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
  isInferred: boolean;
  isBuiltIn: boolean; // id, vector
}

interface IndexBuildingStatus {
  [attributeName: string]: {
    building: boolean;
    progress?: number;
  };
}


export const SchemaPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeConnection } = useConnection();
  const { selectedNamespace } = useNamespace();
  const { toast } = useToast();
  
  const [attributes, setAttributes] = useState<SchemaAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [indexBuildingStatus, setIndexBuildingStatus] = useState<IndexBuildingStatus>({});
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

  // Load schema when namespace changes
  useEffect(() => {
    if (selectedNamespace && activeConnection) {
      loadSchema();
    }
  }, [selectedNamespace, activeConnection]);

  const loadSchema = async () => {
    if (!selectedNamespace || !activeConnection) return;
    
    setLoading(true);
    try {
      // Get connection details with decrypted API key
      const connectionDetails = await window.electronAPI.getConnectionForUse(activeConnection.id);
      
      // Initialize client
      await turbopufferService.initializeClient(connectionDetails.apiKey, connectionDetails.region);
      
      const schema = await namespaceService.getNamespaceSchema(selectedNamespace.id);
      
      // Convert schema to our internal format
      const schemaAttributes: SchemaAttribute[] = Object.entries(schema).map(([name, attributeSchema]) => ({
        name,
        schema: attributeSchema,
        isInferred: !isExplicitlyConfigured(attributeSchema),
        isBuiltIn: name === 'id' || name === 'vector',
      }));

      setAttributes(schemaAttributes);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load schema:', error);
      toast({
        title: 'Error loading schema',
        description: error instanceof Error ? error.message : 'Failed to load namespace schema',
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
    if (!selectedNamespace) return;
    
    setSaving(true);
    try {
      // Convert back to namespace schema format
      const schema: NamespaceSchema = {};
      attributes.forEach(attr => {
        schema[attr.name] = attr.schema;
      });

      const response = await namespaceService.updateNamespaceSchema(selectedNamespace.id, schema);
      
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
        const schema = await namespaceService.getNamespaceSchema(selectedNamespace!.id);
        
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
    if (attributes.find(attr => attr.name === name)?.isBuiltIn) {
      toast({
        title: 'Cannot remove built-in attribute',
        description: 'Built-in attributes like id and vector cannot be removed',
        variant: 'destructive',
      });
      return;
    }

    setAttributes(attributes.filter(attr => attr.name !== name));
    setHasChanges(true);
  };

  if (!activeConnection) {
    return (
      <div className="flex flex-col h-full bg-tp-bg">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-tp-surface border border-tp-border-subtle flex items-center justify-center mx-auto mb-3">
            <Database className="h-8 w-8 text-tp-accent" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-tp-text mb-2">no connection</h2>
          <p className="text-xs text-tp-text-muted mb-4 max-w-sm">
            connect to turbopuffer to manage schemas
          </p>
          <Button onClick={() => navigate('/connections')} size="sm">
            <Database className="h-3 w-3 mr-1.5" />
            connections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RequireNamespace>
      <div className="flex flex-col h-full bg-tp-bg">
        {/* Header */}
        <div className="px-3 py-2 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-tp-text">schema</h1>
            <p className="text-xs text-tp-text-muted mt-0.5">
              <span className="font-mono text-tp-accent">{selectedNamespace?.id}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={loadSchema}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              refresh
            </Button>
            <Button
              onClick={handleSaveSchema}
              disabled={!hasChanges || saving}
              size="sm"
            >
              {saving ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              save
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
          {hasChanges && (
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
    </RequireNamespace>
  );
};

