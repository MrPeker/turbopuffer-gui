import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw } from 'lucide-react';
import { RegionMultiSelect } from './RegionMultiSelect';
import type { Connection, ConnectionUpdateData } from '../../../types/connection';
import { getEffectiveRegions } from '../../../types/connection';
import { useConnections } from '../../contexts/ConnectionContext';

interface EditConnectionDialogProps {
  connection: Connection | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditConnectionDialog({ connection, isOpen, onClose }: EditConnectionDialogProps) {
  const { loadConnections } = useConnections();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [newApiKey, setNewApiKey] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (connection && isOpen) {
      setName(connection.name);
      const regions = getEffectiveRegions(connection);
      setRegionIds(regions.map(r => r.id));
      setIsReadOnly(connection.isReadOnly ?? false);
      setNewApiKey('');
      setError(null);
    }
  }, [connection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection) return;

    if (!name.trim()) {
      setError('Connection name is required');
      return;
    }

    if (regionIds.length === 0) {
      setError('At least one region must be selected');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: ConnectionUpdateData = {
        id: connection.id,
        name: name.trim(),
        regionIds,
        isReadOnly,
      };

      // Only include API key if user entered a new one
      if (newApiKey.trim()) {
        updateData.apiKey = newApiKey.trim();
      }

      await window.electronAPI.updateConnection(updateData);
      await loadConnections();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-tp-surface border-tp-border-strong max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">Edit Connection</DialogTitle>
          <DialogDescription className="text-xs text-tp-text-muted">
            Modify connection settings. Leave API key blank to keep existing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-tp-text-muted">
              Connection Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Connection"
              className="bg-tp-bg border-tp-border-strong"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-tp-text-muted">
              Regions
            </Label>
            <RegionMultiSelect
              selectedRegionIds={regionIds}
              onChange={setRegionIds}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-xs font-bold uppercase tracking-wider text-tp-text-muted">
              New API Key (optional)
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Leave blank to keep existing key"
              className="bg-tp-bg border-tp-border-strong"
            />
            <p className="text-[10px] text-tp-text-muted">
              Only enter a new API key if you want to change it
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="readOnly"
              checked={isReadOnly}
              onCheckedChange={(checked) => setIsReadOnly(checked === true)}
            />
            <Label htmlFor="readOnly" className="text-xs text-tp-text">
              Read-Only Mode
            </Label>
          </div>

          {error && (
            <div className="text-xs text-tp-danger bg-tp-danger/10 px-3 py-2 border border-tp-danger/30">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
