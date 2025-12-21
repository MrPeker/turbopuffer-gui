import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Copy,
  Edit,
  Save,
  X,
  Hash,
  Type,
  ToggleLeft,
  List,
  Braces,
  Binary,
  ChevronDown,
  ChevronRight,
  Calendar,
  Link as LinkIcon,
  Loader2,
  Search,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';

// Helper to get effective namespace ID from URL params or store
const useEffectiveNamespaceId = () => {
  const { namespaceId: urlNamespaceId } = useParams<{ namespaceId?: string }>();
  const storeNamespaceId = useDocumentsStore(state => state.currentNamespaceId);
  return urlNamespaceId || storeNamespaceId;
};

interface DocumentDetailsPanelProps {
  document: any;
  onClose: () => void;
  onUpdate: () => void;
}

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any, indent = 2): string => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    },
    indent
  );
};

// Detect if a value is actually an embedding vector (vs a regular numeric array)
const isVector = (value: any, key: string): boolean => {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (!value.every((v) => typeof v === 'number' && !isNaN(v))) return false;

  // Check field name patterns - explicit vector fields
  const vectorKeywords = ['vector', 'embedding', 'embed', 'embeddings'];
  const keyLower = key.toLowerCase();
  if (vectorKeywords.some(keyword => keyLower.includes(keyword))) {
    return true;
  }

  // Embedding vectors are typically >= 64 dimensions (e.g., 128D, 256D, 384D, 512D, 768D, 1536D)
  // Arrays with fewer dimensions are likely IDs/labels/categories
  return value.length >= 64;
};

// Check if a field is non-editable (cannot be patched via the API)
const isNonEditableField = (key: string, value: any): boolean => {
  // System fields that cannot be patched
  if (key === 'id' || key === 'vector' || key === '$dist') return true;
  // Vector-like arrays are also non-editable
  if (isVector(value, key)) return true;
  return false;
};

// Filter out non-editable fields from a document for JSON editing
const filterEditableFields = (doc: any): any => {
  const filtered: any = {};
  Object.entries(doc).forEach(([key, value]) => {
    // Keep 'id' for reference but skip vectors and $dist
    if (key === 'vector' || key === '$dist') return;
    if (isVector(value, key)) return;
    filtered[key] = value;
  });
  return filtered;
};

// Detect if a number is likely a timestamp
const isTimestamp = (value: number): boolean => {
  // Unix timestamp in seconds (10 digits) or milliseconds (13 digits)
  const str = String(Math.abs(value));
  if (str.length !== 10 && str.length !== 13) return false;

  // Reasonable range: 2000-01-01 to 2100-01-01
  const timestamp = str.length === 13 ? value : value * 1000;
  return timestamp > 946684800000 && timestamp < 4102444800000;
};

// Format timestamp to readable date
const formatTimestamp = (value: number): string => {
  const timestamp = String(value).length === 13 ? value : value * 1000;
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Detect if a string is a URL
const isURL = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Detect if a string is an email
const isEmail = (str: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
};

// Deep equality check
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
};

export const DocumentDetailsPanel: React.FC<DocumentDetailsPanelProps> = ({
  document,
  onClose,
  onUpdate,
}) => {
  const { toast } = useToast();
  const namespaceId = useEffectiveNamespaceId();
  const { activeConnectionId } = useConnection();
  const { updateDocument } = useDocumentsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDocument, setEditedDocument] = useState(document);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pretty' | 'json'>('pretty');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['id']));
  const [searchQuery, setSearchQuery] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [rawJsonText, setRawJsonText] = useState(safeStringify(document));

  // Reset state when document changes (switching to a different document)
  useEffect(() => {
    setEditedDocument(document);
    setRawJsonText(safeStringify(document));
    setIsEditing(false);
    setJsonError(null);
    setSearchQuery('');
    setShowAddField(false);
    setNewFieldName('');
    setExpandedSections(new Set(['id']));
  }, [document.id]);

  // Sync raw JSON text when editing in pretty mode
  useEffect(() => {
    if (viewMode === 'pretty') {
      setRawJsonText(safeStringify(editedDocument));
    }
  }, [editedDocument, viewMode]);

  // Debounced JSON validation (validates 500ms after user stops typing)
  useEffect(() => {
    if (!isEditing || viewMode !== 'json') return;

    const timer = setTimeout(() => {
      validateAndUpdateJson();
    }, 500);

    return () => clearTimeout(timer);
  }, [rawJsonText, isEditing, viewMode]);

  // Calculate which fields have been modified
  const modifiedFields = useMemo(() => {
    const modified = new Set<string>();
    Object.keys(editedDocument).forEach(key => {
      if (!deepEqual(editedDocument[key], document[key])) {
        modified.add(key);
      }
    });
    // Check for deleted fields
    Object.keys(document).forEach(key => {
      if (!(key in editedDocument)) {
        modified.add(key);
      }
    });
    return modified;
  }, [editedDocument, document]);

  // Check if document has any unsaved changes
  const hasUnsavedChanges = modifiedFields.size > 0;

  // Filter fields based on search query
  const filteredEntries = useMemo(() => {
    const entries = Object.entries(editedDocument);
    if (!searchQuery) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter(([key, value]) => {
      // Search by field name
      if (key.toLowerCase().includes(query)) return true;

      // Search by value (convert to string)
      const valueStr = typeof value === 'object'
        ? safeStringify(value, 0).toLowerCase()
        : String(value).toLowerCase();
      return valueStr.includes(query);
    });
  }, [editedDocument, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + E to toggle edit mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (!isSaving) {
          setIsEditing((prev) => !prev);
        }
      }
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && viewMode === 'pretty') {
        e.preventDefault();
        const searchInput = document.getElementById('field-search');
        searchInput?.focus();
      }
      // Escape to cancel edit or clear search
      if (e.key === 'Escape') {
        if (searchQuery) {
          e.preventDefault();
          setSearchQuery('');
        } else if (isEditing) {
          e.preventDefault();
          if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have unsaved changes. Discard them?');
            if (!confirmed) return;
          }
          setIsEditing(false);
          setEditedDocument(document);
          setRawJsonText(safeStringify(document));
          setJsonError(null);
        }
      }
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        if (!jsonError && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, jsonError, isSaving, editedDocument, document, searchQuery, viewMode, hasUnsavedChanges]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(safeStringify(document));
    toast({
      title: 'copied',
      description: 'document JSON copied to clipboard',
    });
  };

  const handleCopyField = (key: string, value: any) => {
    const textValue = typeof value === 'object' ? safeStringify(value) : String(value);
    navigator.clipboard.writeText(textValue);
    toast({
      title: 'copied',
      description: `${key} copied to clipboard`,
    });
  };

  const handleSave = async () => {
    if (!activeConnectionId || !namespaceId) {
      console.warn('Cannot save: missing connection or namespace', { activeConnectionId, namespaceId });
      toast({
        title: 'error',
        description: 'no active connection or namespace selected',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDocument(document.id, editedDocument);
      toast({
        title: 'saved',
        description: 'document updated successfully',
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: 'error',
        description: error instanceof Error ? error.message : 'failed to update document',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateAndUpdateJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);

      // Validate that id field hasn't changed
      if (parsed.id !== document.id) {
        setJsonError('cannot change document id');
        return;
      }

      // Preserve vector fields from original document (they're hidden in edit mode)
      const merged = { ...document };
      Object.entries(parsed).forEach(([key, value]) => {
        // Only update editable fields
        if (!isNonEditableField(key, document[key])) {
          merged[key] = value;
        }
      });

      setEditedDocument(merged);
      setJsonError(null);
    } catch (error) {
      setJsonError('invalid JSON');
    }
  };

  const handleFieldEdit = (key: string, value: any) => {
    setEditedDocument({
      ...editedDocument,
      [key]: value,
    });
  };

  const handleDeleteField = (key: string) => {
    const confirmed = window.confirm(`Delete field "${key}"?`);
    if (!confirmed) return;

    const newDoc = { ...editedDocument };
    delete newDoc[key];
    setEditedDocument(newDoc);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: 'error',
        description: 'field name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (newFieldName in editedDocument) {
      toast({
        title: 'error',
        description: 'field already exists',
        variant: 'destructive',
      });
      return;
    }

    setEditedDocument({
      ...editedDocument,
      [newFieldName]: null,
    });
    setNewFieldName('');
    setShowAddField(false);

    // Expand the new field
    setExpandedSections(new Set([...expandedSections, newFieldName]));
  };

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const getTypeIcon = (value: any, key: string) => {
    if (value === null || value === undefined) return <Type className="h-3 w-3 text-tp-text-faint" />;
    if (isVector(value, key)) return <Binary className="h-3 w-3 text-tp-accent" />;
    if (Array.isArray(value)) return <List className="h-3 w-3 text-tp-text-muted" />;
    if (typeof value === 'object') return <Braces className="h-3 w-3 text-tp-text-muted" />;
    if (typeof value === 'boolean') return <ToggleLeft className="h-3 w-3 text-tp-text-muted" />;
    if (typeof value === 'number') {
      if (isTimestamp(value)) return <Calendar className="h-3 w-3 text-tp-text-muted" />;
      return <Hash className="h-3 w-3 text-tp-text-muted" />;
    }
    if (typeof value === 'string') {
      if (isURL(value) || isEmail(value)) return <LinkIcon className="h-3 w-3 text-tp-accent" />;
    }
    return <Type className="h-3 w-3 text-tp-text-muted" />;
  };

  const getTypeLabel = (value: any, key: string) => {
    if (value === null || value === undefined) return 'null';
    if (isVector(value, key)) return `vector[${value.length}]`;
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      if (isTimestamp(value)) return 'timestamp';
      return 'number';
    }
    if (typeof value === 'string') {
      if (isURL(value)) return 'url';
      if (isEmail(value)) return 'email';
      return 'string';
    }
    return typeof value;
  };

  const renderPrettyValue = (value: any, key: string, isReadOnly = false) => {
    const isExpanded = expandedSections.has(key);
    // Only allow editing if we're in edit mode AND the field is not read-only
    const canEdit = isEditing && !isReadOnly;

    if (value === null || value === undefined) {
      return <span className="text-tp-text-faint italic text-sm">null</span>;
    }

    // Vector display
    if (isVector(value, key)) {
      const magnitude = Math.sqrt(value.reduce((sum: number, v: number) => sum + v * v, 0));
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-tp-accent/10 text-tp-accent border-tp-accent/30 font-mono">
              {value.length}D
            </Badge>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              mag: {magnitude.toFixed(4)}
            </Badge>
            <span className="text-xs text-tp-text-faint font-mono">
              [{value[0]?.toFixed?.(4) || value[0]}...{value[value.length - 1]?.toFixed?.(4) || value[value.length - 1]}]
            </span>
          </div>
          {isExpanded && (
            <div className="bg-tp-bg border border-tp-border-subtle p-2 rounded font-mono text-xs">
              <div className="grid grid-cols-8 gap-1">
                {value.slice(0, 64).map((v: number, i: number) => (
                  <span key={i} className="text-tp-text-muted">
                    {v.toFixed(3)}
                  </span>
                ))}
                {value.length > 64 && (
                  <span className="text-tp-text-faint col-span-8 text-center mt-1">
                    ... +{value.length - 64} more values
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Array display
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-tp-text-faint italic text-sm">empty array</span>;
      }
      const preview = safeStringify(value.slice(0, 3), 0);
      return (
        <div className="space-y-2">
          <div className="text-sm text-tp-text font-mono truncate">
            {value.length <= 3 ? safeStringify(value, 0) : `${preview.slice(0, -1)}${value.length > 3 ? `, ... +${value.length - 3}]` : ''}`}
          </div>
          {isExpanded && value.length > 3 && (
            <pre className="bg-tp-bg border border-tp-border-subtle p-2 rounded text-xs overflow-x-auto">
              {safeStringify(value)}
            </pre>
          )}
        </div>
      );
    }

    // Object display
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-tp-text-faint italic text-sm">empty object</span>;
      }
      return (
        <div className="space-y-2">
          <div className="text-sm text-tp-text-muted">
            {keys.slice(0, 2).join(', ')}{keys.length > 2 && `, ... +${keys.length - 2}`}
          </div>
          {isExpanded && (
            <pre className="bg-tp-bg border border-tp-border-subtle p-2 rounded text-xs overflow-x-auto">
              {safeStringify(value)}
            </pre>
          )}
        </div>
      );
    }

    // Boolean display with toggle in edit mode
    if (typeof value === 'boolean') {
      if (canEdit) {
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value}
              onCheckedChange={(checked) => handleFieldEdit(key, checked)}
            />
            <span className="text-xs text-tp-text-muted">{value ? 'true' : 'false'}</span>
          </div>
        );
      }
      return (
        <Badge variant={value ? 'default' : 'secondary'} className="font-mono text-xs">
          {value.toString()}
        </Badge>
      );
    }

    // Timestamp display
    if (typeof value === 'number' && isTimestamp(value)) {
      return (
        <div className="space-y-1">
          <div className="text-sm text-tp-text">{formatTimestamp(value)}</div>
          <div className="text-xs text-tp-text-faint font-mono">unix: {value}</div>
        </div>
      );
    }

    // Number display
    if (typeof value === 'number') {
      if (canEdit) {
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldEdit(key, parseFloat(e.target.value))}
            className="font-mono text-xs"
          />
        );
      }
      return <span className="font-mono text-sm text-tp-text">{value}</span>;
    }

    // URL display - clickable link
    if (typeof value === 'string' && isURL(value)) {
      return (
        <div className="space-y-1">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-tp-accent hover:underline break-all flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            {value}
          </a>
        </div>
      );
    }

    // Email display - clickable mailto
    if (typeof value === 'string' && isEmail(value)) {
      return (
        <a
          href={`mailto:${value}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-tp-accent hover:underline"
        >
          {value}
        </a>
      );
    }

    // String display
    if (typeof value === 'string') {
      if (value.length === 0) {
        return <span className="text-tp-text-faint italic text-sm">empty string</span>;
      }

      if (canEdit) {
        return value.length > 100 ? (
          <Textarea
            value={value}
            onChange={(e) => handleFieldEdit(key, e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleFieldEdit(key, e.target.value)}
            className="font-mono text-xs"
          />
        );
      }
      return (
        <div className="text-sm text-tp-text break-all">
          {value.length > 200 ? (
            <div className="space-y-2">
              <div className={isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}>
                {value}
              </div>
              {!isExpanded && (
                <span className="text-xs text-tp-text-faint">... {value.length} chars</span>
              )}
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{value}</span>
          )}
        </div>
      );
    }

    return <span className="text-sm text-tp-text">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-tp-surface">
      {/* Refined Toolbar */}
      <div className="flex-shrink-0 bg-tp-surface border-b border-tp-border-strong">
        <div className="flex items-center h-10 px-4 gap-3">
          {/* Tabbed Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('pretty')}
              className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'pretty'
                  ? 'text-tp-accent'
                  : 'text-tp-text-muted hover:text-tp-text'
              }`}
            >
              pretty
              {viewMode === 'pretty' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tp-accent" />
              )}
            </button>
            <div className="w-px h-4 bg-tp-border-subtle/50" />
            <button
              onClick={() => setViewMode('json')}
              className={`relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'json'
                  ? 'text-tp-accent'
                  : 'text-tp-text-muted hover:text-tp-text'
              }`}
            >
              json
              {viewMode === 'json' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tp-accent" />
              )}
            </button>
          </div>

          {/* Search */}
          {viewMode === 'pretty' && (
            <>
              <div className="h-5 w-px bg-tp-border-subtle" />
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tp-text-muted pointer-events-none" />
                <input
                  id="field-search"
                  type="text"
                  placeholder="Search fields... (⌘F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-7 pl-9 pr-20 text-xs font-medium bg-tp-bg border border-tp-border-subtle rounded focus:outline-none focus:border-tp-accent focus:ring-1 focus:ring-tp-accent/20 transition-all placeholder:text-tp-text-faint"
                />
                {searchQuery && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold text-tp-text-muted">
                      {filteredEntries.length}/{Object.keys(editedDocument).length}
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-tp-surface-alt transition-colors"
                    >
                      <X className="h-3 w-3 text-tp-text-muted" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1.5 h-6 px-2 bg-amber-500/10 border border-amber-500/30 rounded">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{modifiedFields.size} unsaved</span>
              </div>
            )}

            {!isEditing && (
              <button
                onClick={() => {
                  // Initialize rawJsonText with filtered (editable) fields only
                  setRawJsonText(safeStringify(filterEditableFields(editedDocument)));
                  setIsEditing(true);
                }}
                disabled={isSaving}
                className="h-6 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-tp-text-muted hover:text-tp-accent hover:bg-tp-accent/5 rounded transition-all disabled:opacity-50"
              >
                <Edit className="h-3.5 w-3.5" />
                edit
              </button>
            )}

            <button
              onClick={handleCopyJson}
              className="h-6 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-tp-text-muted hover:text-tp-accent hover:bg-tp-accent/5 rounded transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              copy
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {viewMode === 'pretty' ? (
          <div className="px-3 py-3 space-y-1">
            {/* Add Field Button */}
            {isEditing && !showAddField && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddField(true)}
                className="w-full h-8 text-xs mb-3 border-dashed"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                add field
              </Button>
            )}

            {/* Add Field Form */}
            {isEditing && showAddField && (
              <div className="mb-3 p-3 bg-tp-surface-alt border border-tp-border-subtle rounded">
                <div className="flex gap-2">
                  <Input
                    placeholder="field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddField();
                      if (e.key === 'Escape') {
                        setShowAddField(false);
                        setNewFieldName('');
                      }
                    }}
                    className="flex-1 h-7 text-xs"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddField} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddField(false);
                      setNewFieldName('');
                    }}
                    className="h-7 text-xs"
                  >
                    cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Fields */}
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-tp-text-muted text-sm">
                {searchQuery ? `no fields matching "${searchQuery}"` : 'no fields'}
              </div>
            ) : (
              filteredEntries.map(([key, value], index) => {
                const isExpandable =
                  (Array.isArray(value) && value.length > 3) ||
                  (typeof value === 'object' && value !== null && !Array.isArray(value)) ||
                  (typeof value === 'string' && value.length > 200) ||
                  isVector(value, key);
                const isExpanded = expandedSections.has(key);
                const isModified = modifiedFields.has(key);
                const isReadOnly = isNonEditableField(key, value);

                return (
                  <div key={key}>
                    {index > 0 && <Separator className="my-3 bg-tp-border-subtle/50" />}
                    <div className={`group -mx-2 px-2 py-2 rounded transition-colors ${isExpandable ? 'cursor-pointer hover:bg-tp-surface-alt/50' : ''} ${isModified ? 'bg-amber-500/5' : ''}`}>
                      {/* Field Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                          onClick={isExpandable ? () => toggleSection(key) : undefined}
                        >
                          {isExpandable && (
                            <div className="flex-shrink-0 text-tp-text-muted group-hover:text-tp-text transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </div>
                          )}
                          {!isExpandable && <div className="w-3" />}

                          {getTypeIcon(value, key)}

                          <span className="font-mono text-xs font-semibold text-tp-text truncate" title={key}>
                            {key}
                          </span>

                          <Badge variant="outline" className="text-[10px] h-4 px-1 bg-tp-surface border-tp-border-strong">
                            {getTypeLabel(value, key)}
                          </Badge>

                          {isEditing && isReadOnly && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-tp-surface-alt text-tp-text-muted border-tp-border-subtle">
                              read-only
                            </Badge>
                          )}

                          {isModified && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                              modified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyField(key, value);
                            }}
                            className="h-5 w-5 p-0"
                            aria-label={`Copy ${key}`}
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                          {isEditing && !isReadOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(key);
                              }}
                              className="h-5 w-5 p-0 text-tp-danger hover:text-tp-danger"
                              aria-label={`Delete ${key}`}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Field Value */}
                      <div
                        className="pl-5"
                        onClick={isExpandable ? () => toggleSection(key) : undefined}
                      >
                        {renderPrettyValue(value, key, isReadOnly)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="px-3 py-3">
            {isEditing && (
              <div className="mb-3 px-3 py-2 bg-tp-surface-alt border border-tp-border-subtle rounded-sm text-xs text-tp-text-muted">
                Vector fields are hidden (not editable via API)
              </div>
            )}
            <Textarea
              value={isEditing ? rawJsonText : safeStringify(editedDocument)}
              readOnly={!isEditing}
              onChange={(e) => {
                if (isEditing) {
                  setRawJsonText(e.target.value);
                  setJsonError(null); // Clear error while typing
                }
              }}
              onBlur={() => {
                if (isEditing) {
                  validateAndUpdateJson();
                }
              }}
              className="font-mono text-xs min-h-[500px] bg-tp-bg border-tp-border-subtle"
            />
            {jsonError && (
              <div className="mt-3 px-3 py-2 bg-tp-danger/10 border border-tp-danger/30 rounded-sm text-xs text-tp-danger flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {jsonError}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {isEditing && (
        <div className="flex-shrink-0 px-3 py-2 border-t border-tp-border-subtle flex items-center justify-between bg-tp-surface-alt">
          <div className="text-xs text-tp-text-muted">
            <kbd className="px-1.5 py-0.5 bg-tp-bg border border-tp-border-subtle rounded text-[10px]">Esc</kbd> cancel
            {' · '}
            <kbd className="px-1.5 py-0.5 bg-tp-bg border border-tp-border-subtle rounded text-[10px]">⌘S</kbd> save
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (hasUnsavedChanges) {
                  const confirmed = window.confirm('You have unsaved changes. Discard them?');
                  if (!confirmed) return;
                }
                setIsEditing(false);
                setEditedDocument(document);
                setRawJsonText(safeStringify(document));
                setJsonError(null);
              }}
              className="h-7 text-xs"
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1.5" />
              cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!!jsonError || isSaving || !hasUnsavedChanges}
              className="h-7 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1.5" />
                  save {hasUnsavedChanges && `(${modifiedFields.size})`}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
