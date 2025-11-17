import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Edit, 
  Save, 
  X,
  FileJson,
  FormInput,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';

interface DocumentViewerProps {
  document: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onUpdate,
}) => {
  const { toast } = useToast();
  const { namespaceId } = useParams<{ namespaceId?: string }>();
  const { selectedConnection } = useConnection();
  const { updateDocument } = useDocumentsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState(document);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(document, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: 'Document JSON has been copied to your clipboard.',
    });
  };

  const handleSave = async () => {
    if (!selectedConnection || !namespaceId) return;

    try {
      await updateDocument(document.id, editedDocument);
      toast({
        title: 'Document updated',
        description: 'The document has been successfully updated.',
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error updating document',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleJsonEdit = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEditedDocument(parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleFieldEdit = (key: string, value: any) => {
    setEditedDocument({
      ...editedDocument,
      [key]: value,
    });
  };

  const renderValue = (value: any, key: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (Array.isArray(value)) {
      if (key.includes('vector') || key.includes('embedding')) {
        return (
          <div className="space-y-2">
            <Badge variant="secondary">
              {value.length}D vector
            </Badge>
            <details className="cursor-pointer">
              <summary className="text-sm text-muted-foreground">
                Show values
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                [{value.slice(0, 10).join(', ')}{value.length > 10 ? ', ...' : ''}]
              </pre>
            </details>
          </div>
        );
      }
      return (
        <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value.toString()}</Badge>;
    }

    if (typeof value === 'string' && value.length > 200) {
      return (
        <Textarea
          value={value}
          readOnly={!isEditing}
          onChange={(e) => isEditing && handleFieldEdit(key, e.target.value)}
          className="min-h-[100px]"
        />
      );
    }

    return isEditing ? (
      <Input
        value={value}
        onChange={(e) => handleFieldEdit(key, e.target.value)}
        type={typeof value === 'number' ? 'number' : 'text'}
      />
    ) : (
      <span>{value}</span>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col fixed top-[7.5vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider">Document Details</span>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1.5" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJson}
                className="h-7 w-7 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs text-tp-text-muted">
            <span className="font-mono">ID: {document.id || 'No ID'}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="h-3 w-3 mr-1.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="form" className="text-xs">
              <FormInput className="h-3 w-3 mr-1.5" />
              Form View
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              <FileJson className="h-3 w-3 mr-1.5" />
              JSON
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3 min-h-0">
            <TabsContent value="preview">
              <div className="space-y-4">
                {Object.entries(editedDocument).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium">{key}</Label>
                    <div className="pl-4">
                      {renderValue(value, key)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="form">
              <div className="space-y-4">
                {Object.entries(editedDocument).map(([key, value]) => {
                  // Skip complex types in form view
                  if (
                    Array.isArray(value) || 
                    (typeof value === 'object' && value !== null)
                  ) {
                    return null;
                  }

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{key}</Label>
                      {typeof value === 'string' && value.length > 200 ? (
                        <Textarea
                          id={key}
                          value={value}
                          readOnly={!isEditing}
                          onChange={(e) => isEditing && handleFieldEdit(key, e.target.value)}
                          className="min-h-[100px]"
                        />
                      ) : (
                        <Input
                          id={key}
                          value={value ?? ''}
                          readOnly={!isEditing}
                          onChange={(e) => isEditing && handleFieldEdit(key, e.target.value)}
                          type={typeof value === 'number' ? 'number' : 'text'}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="json">
              <div className="space-y-2">
                {jsonError && (
                  <div className="text-sm text-destructive">
                    {jsonError}
                  </div>
                )}
                <Textarea
                  value={JSON.stringify(editedDocument, null, 2)}
                  readOnly={!isEditing}
                  onChange={(e) => isEditing && handleJsonEdit(e.target.value)}
                  className="font-mono text-sm min-h-[400px]"
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex-shrink-0 gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedDocument(document);
                  setJsonError(null);
                }}
              >
                <X className="h-3 w-3 mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!!jsonError}>
                <Save className="h-3 w-3 mr-1.5" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};