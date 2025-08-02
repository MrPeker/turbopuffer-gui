import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Folder, RefreshCw } from 'lucide-react';

interface CreateNamespaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNamespace: (namespaceId: string) => Promise<void>;
}

export function CreateNamespaceDialog({ 
  isOpen, 
  onClose, 
  onCreateNamespace 
}: CreateNamespaceDialogProps) {
  const [namespaceId, setNamespaceId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!namespaceId.trim()) {
      setError('Namespace ID is required');
      return;
    }

    const validNamespaceRegex = /^[A-Za-z0-9-_.]{1,128}$/;
    if (!validNamespaceRegex.test(namespaceId)) {
      setError('Namespace ID can only contain ASCII alphanumeric characters, hyphens, underscores, and periods (max 128 characters)');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateNamespace(namespaceId);
      setNamespaceId('');
      onClose();
    } catch (err) {
      console.error('Failed to create namespace:', err);
      setError(err instanceof Error ? err.message : 'Failed to create namespace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setNamespaceId('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Create New Namespace
          </DialogTitle>
          <DialogDescription>
            Create a new namespace to organize your vectors and documents.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="namespaceId">
              Namespace ID *
            </Label>
            <Input
              id="namespaceId"
              type="text"
              placeholder="my-namespace"
              value={namespaceId}
              onChange={(e) => {
                setNamespaceId(e.target.value);
                setError(null);
              }}
              required
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Can only contain ASCII alphanumeric characters, hyphens, underscores, and periods (max 128 characters)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Namespaces are created implicitly when you write your first document. This dialog creates an empty namespace entry.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!namespaceId.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Namespace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}