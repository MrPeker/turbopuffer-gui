import React, { useState } from "react";
import { useConnection } from "../../contexts/ConnectionContext";
import { TURBOPUFFER_REGIONS } from "../../../types/connection";
import type { ConnectionFormData } from "../../../types/connection";
import { turbopufferService } from "../../services/turbopufferService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Eye,
  EyeOff,
  Shield,
  ExternalLink,
  FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewConnectionDialog({
  isOpen,
  onClose,
}: NewConnectionDialogProps) {
  const { saveConnection } = useConnection();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    namespaces?: any[];
  } | null>(null);

  const [formData, setFormData] = useState<ConnectionFormData>({
    name: "",
    regionId: TURBOPUFFER_REGIONS[0].id,
    apiKey: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      regionId: TURBOPUFFER_REGIONS[0].id,
      apiKey: "",
    });
    setTestResult(null);
    setShowApiKey(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.apiKey) {
      return;
    }

    setIsSaving(true);
    try {
      await saveConnection(formData);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to save connection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.apiKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const region = TURBOPUFFER_REGIONS.find(
        (r) => r.id === formData.regionId
      );
      if (!region) {
        throw new Error("Invalid region selected");
      }

      const result = await turbopufferService.testConnection(
        formData.apiKey,
        region
      );
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getSelectedRegion = () => {
    return TURBOPUFFER_REGIONS.find(r => r.id === formData.regionId);
  };

  const getProviderPrefix = (provider: string) => {
    return provider.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Connection</DialogTitle>
          <DialogDescription>
            Connect to your Turbopuffer vector database with secure credentials.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Connection Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
              placeholder="e.g., Production Database, Staging Environment"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">
              Region *
            </Label>
            <Select
              value={formData.regionId}
              onValueChange={(value) => setFormData({ ...formData, regionId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TURBOPUFFER_REGIONS.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {getProviderPrefix(region.provider)} • {region.location} ({region.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key *
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(event) => setFormData({ ...formData, apiKey: event.target.value })}
                required
                placeholder="tpuf_xxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Encrypted and stored securely</span>
              </div>
              <button
                type="button"
                onClick={() => window.electronAPI.openExternal("https://turbopuffer.com/dashboard")}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Get API key
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>

          {testResult && (
            <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
              <AlertDescription>
                {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                {testResult.message && ` - ${testResult.message}`}
                {testResult.success && testResult.namespaces && (
                  <div className="mt-1">
                    {testResult.namespaces.length} namespace{testResult.namespaces.length !== 1 ? 's' : ''} found
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleTest}
              disabled={!formData.apiKey || isTesting}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : testResult?.success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Test
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { onClose(); resetForm(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.name || !formData.apiKey || isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Connection'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}