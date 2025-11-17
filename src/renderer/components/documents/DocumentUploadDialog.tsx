import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileJson,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';
import Papa from 'papaparse';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  preview: any[];
  error?: string;
}

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { namespaceId } = useParams<{ namespaceId?: string }>();
  const { selectedConnection } = useConnection();
  const { uploadDocuments } = useDocumentsStore();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('file');
  const [vectorConfig, setVectorConfig] = useState({
    enabled: false,
    dimension: 1536,
    generateFrom: 'text' as 'text' | 'description' | 'custom',
    customField: '',
  });
  const [batchSize, setBatchSize] = useState(100);
  const [idStrategy, setIdStrategy] = useState<'preserve' | 'generate' | 'field'>('preserve');
  const [idField, setIdField] = useState('id');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = [];

    for (const file of acceptedFiles) {
      try {
        const content = await file.text();
        let preview: any[] = [];
        let error: string | undefined;

        if (file.name.endsWith('.json')) {
          try {
            const data = JSON.parse(content);
            preview = Array.isArray(data) ? data.slice(0, 5) : [data];
          } catch (e) {
            error = 'Invalid JSON format';
          }
        } else if (file.name.endsWith('.csv')) {
          Papa.parse(content, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              preview = results.data.slice(0, 5) as any[];
            },
            error: (err) => {
              error = `CSV parse error: ${err.message}`;
            },
          });
        } else if (file.name.endsWith('.ndjson') || file.name.endsWith('.jsonl')) {
          try {
            const lines = content.trim().split('\n');
            preview = lines.slice(0, 5).map(line => JSON.parse(line));
          } catch (e) {
            error = 'Invalid NDJSON format';
          }
        } else {
          error = 'Unsupported file format';
        }

        newFiles.push({ file, preview, error });
      } catch (e) {
        newFiles.push({
          file,
          preview: [],
          error: 'Failed to read file',
        });
      }
    }

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/x-ndjson': ['.ndjson', '.jsonl'],
    },
  });

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedConnection || !namespaceId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let allDocuments: any[] = [];

      // Process file uploads
      for (const uploadFile of uploadFiles) {
        if (uploadFile.error) continue;

        const content = await uploadFile.file.text();

        if (uploadFile.file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          allDocuments = allDocuments.concat(Array.isArray(data) ? data : [data]);
        } else if (uploadFile.file.name.endsWith('.csv')) {
          await new Promise<void>((resolve) => {
            Papa.parse(content, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                allDocuments = allDocuments.concat(results.data as any[]);
                resolve();
              },
            });
          });
        } else if (uploadFile.file.name.endsWith('.ndjson') || uploadFile.file.name.endsWith('.jsonl')) {
          const lines = content.trim().split('\n');
          allDocuments = allDocuments.concat(lines.map(line => JSON.parse(line)));
        }
      }

      // Process JSON text
      if (activeTab === 'json' && jsonText.trim()) {
        try {
          const data = JSON.parse(jsonText);
          allDocuments = allDocuments.concat(Array.isArray(data) ? data : [data]);
        } catch (e) {
          throw new Error('Invalid JSON in text input');
        }
      }

      if (allDocuments.length === 0) {
        throw new Error('No documents to upload');
      }

      // Transform documents to match expected format
      allDocuments = allDocuments.map((doc, index) => {
        const { id, vector, ...rest } = doc;
        
        // Handle ID based on strategy
        let documentId: string;
        if (idStrategy === 'generate') {
          documentId = `doc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        } else if (idStrategy === 'field' && idField) {
          documentId = String(doc[idField] || rest[idField] || `doc_${Date.now()}_${index}`);
        } else {
          documentId = id || `doc_${Date.now()}_${index}`;
        }
        
        // Handle vector generation if enabled
        let documentVector = vector;
        if (vectorConfig.enabled && !vector) {
          // TODO: Implement actual vector generation
          // For now, just create a placeholder vector
          const textField = vectorConfig.generateFrom === 'custom' 
            ? doc[vectorConfig.customField] || rest[vectorConfig.customField]
            : doc[vectorConfig.generateFrom] || rest[vectorConfig.generateFrom];
            
          if (textField) {
            // Placeholder: In real implementation, this would call an embedding service
            documentVector = Array(vectorConfig.dimension).fill(0).map(() => Math.random() * 2 - 1);
          }
        }
        
        return {
          id: documentId,
          vector: documentVector || undefined,
          attributes: rest
        };
      });

      // Upload documents in batches
      const batches = [];
      for (let i = 0; i < allDocuments.length; i += batchSize) {
        batches.push(allDocuments.slice(i, i + batchSize));
      }
      
      for (let i = 0; i < batches.length; i++) {
        await uploadDocuments(batches[i]);
        setUploadProgress(((i + 1) / batches.length) * 100);
      }
      setUploadProgress(100);

      toast.success('Upload successful', {
        description: `Successfully uploaded ${allDocuments.length} documents in ${batches.length} batch${batches.length > 1 ? 'es' : ''}.`,
      });

      onSuccess();
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const validateJsonText = () => {
    if (!jsonText.trim()) return null;

    try {
      JSON.parse(jsonText);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  };

  const jsonValidation = validateJsonText();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents to the namespace in JSON, CSV, or NDJSON format.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="json">JSON Input</TabsTrigger>
            <TabsTrigger value="settings">Import Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                hover:border-primary hover:bg-primary/5
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag & drop files here, or click to select files'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports JSON, CSV, NDJSON files
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                {uploadFiles.map((uploadFile, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {uploadFile.file.name.endsWith('.json') ? (
                        <FileJson className="h-8 w-8 text-blue-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{uploadFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadFile.file.size / 1024).toFixed(2)} KB
                        </p>
                        {uploadFile.error ? (
                          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {uploadFile.error}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadFile.preview.length} document(s) detected
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-input">JSON Documents</Label>
              <Textarea
                id="json-input"
                placeholder='[{"id": 1, "text": "Document 1"}, {"id": 2, "text": "Document 2"}]'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
              />
              {jsonValidation && !jsonValidation.valid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {jsonValidation.error}
                </p>
              )}
              {jsonValidation && jsonValidation.valid && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valid JSON
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Document ID Strategy</Label>
                <Select value={idStrategy} onValueChange={(value: any) => setIdStrategy(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preserve">Preserve existing IDs</SelectItem>
                    <SelectItem value="generate">Generate new IDs</SelectItem>
                    <SelectItem value="field">Use specific field as ID</SelectItem>
                  </SelectContent>
                </Select>
                {idStrategy === 'field' && (
                  <Input
                    placeholder="Field name (e.g., 'sku', 'email')" 
                    value={idField}
                    onChange={(e) => setIdField(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div>
                <Label className="text-base font-semibold">Vector Generation</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vector-enabled">Generate vectors automatically</Label>
                    <Switch
                      id="vector-enabled"
                      checked={vectorConfig.enabled}
                      onCheckedChange={(checked) => 
                        setVectorConfig({ ...vectorConfig, enabled: checked })
                      }
                    />
                  </div>
                  
                  {vectorConfig.enabled && (
                    <>
                      <div>
                        <Label htmlFor="vector-dim">Vector Dimensions</Label>
                        <Input
                          id="vector-dim"
                          type="number"
                          value={vectorConfig.dimension}
                          onChange={(e) => 
                            setVectorConfig({ ...vectorConfig, dimension: parseInt(e.target.value) })
                          }
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vector-source">Generate vectors from</Label>
                        <Select 
                          value={vectorConfig.generateFrom} 
                          onValueChange={(value: any) => 
                            setVectorConfig({ ...vectorConfig, generateFrom: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text field</SelectItem>
                            <SelectItem value="description">Description field</SelectItem>
                            <SelectItem value="custom">Custom field</SelectItem>
                          </SelectContent>
                        </Select>
                        {vectorConfig.generateFrom === 'custom' && (
                          <Input
                            placeholder="Field name"
                            value={vectorConfig.customField}
                            onChange={(e) => 
                              setVectorConfig({ ...vectorConfig, customField: e.target.value })
                            }
                            className="mt-2"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="batch-size" className="text-base font-semibold">Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="mt-2"
                  min={1}
                  max={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of documents to upload per batch (1-1000)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Tips:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• CSV files should have headers matching your schema</li>
                    <li>• JSON arrays should contain objects with consistent structure</li>
                    <li>• Large files will be automatically batched for optimal performance</li>
                    <li>• Vector generation requires an embedding service to be configured</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        {uploading && (
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress.toFixed(0)}% complete
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              uploading ||
              (activeTab === 'file' && uploadFiles.length === 0) ||
              (activeTab === 'json' && (!jsonText.trim() || !jsonValidation?.valid))
            }
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};