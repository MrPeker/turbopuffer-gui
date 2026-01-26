import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Connection } from '../../../types/connection';
import { getEffectiveRegions } from '../../../types/connection';
import { useConnections } from '../../contexts/ConnectionContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MoreVertical,
  TestTube,
  Trash2,
  Edit,
  MapPin,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Globe,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EditConnectionDialog } from './EditConnectionDialog';

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const navigate = useNavigate();
  const { deleteConnection, testConnection } = useConnections();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isCopyingApiKey, setIsCopyingApiKey] = useState(false);
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isRevealingApiKey, setIsRevealingApiKey] = useState(false);

  const handleSelect = () => {
    navigate(`/connections/${connection.id}/namespaces`);
  };

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    try {
      await testConnection(connection.id);
    } catch (error) {
      console.error('Failed to test connection:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConnection(connection.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevealApiKey = async (skipConfirmation = false) => {
    const canUseBiometric = await window.electronAPI.canUseBiometric();

    if (!canUseBiometric && !skipConfirmation) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsRevealingApiKey(true);
    try {
      const apiKey = await window.electronAPI.revealApiKey(connection.id);
      setRevealedApiKey(apiKey);
      setIsApiKeyVisible(false);
      setShowApiKeyDialog(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reveal API key';
      if (message.includes('Authentication required')) {
        toast.error('Authentication cancelled', {
          description: 'System authentication is required to reveal the API key.',
        });
      } else {
        toast.error('Failed to reveal API key', { description: message });
      }
    } finally {
      setIsRevealingApiKey(false);
    }
  };

  const handleCopyRevealedApiKey = async () => {
    if (!revealedApiKey) return;

    setIsCopyingApiKey(true);
    try {
      await navigator.clipboard.writeText(revealedApiKey);
      toast.success('API key copied to clipboard', {
        description: 'The key will remain in your clipboard until you copy something else.',
        duration: 3000,
      });
    } catch (error) {
      toast.error('Failed to copy', {
        description: 'Could not copy to clipboard. Please copy manually.'
      });
    } finally {
      setIsCopyingApiKey(false);
    }
  };

  const closeApiKeyDialog = () => {
    setShowApiKeyDialog(false);
    setRevealedApiKey(null);
    setIsApiKeyVisible(false);
  };

  const getMaskedApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  const getStatusConfig = () => {
    if (isTesting) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Testing...',
        badgeVariant: 'secondary' as const
      };
    }
    
    switch (connection.testStatus) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          label: 'Connected',
          badgeVariant: 'default' as const
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          label: 'Failed',
          badgeVariant: 'destructive' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          label: 'Unknown',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const regions = useMemo(() => getEffectiveRegions(connection), [connection]);

  const getProvidersSummary = () => {
    const hasGcp = regions.some(r => r.provider === 'gcp');
    const hasAws = regions.some(r => r.provider === 'aws');
    if (hasGcp && hasAws) return 'GCP + AWS';
    if (hasGcp) return 'GCP';
    if (hasAws) return 'AWS';
    return '';
  };

  return (
    <>
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
          "border-2 hover:border-primary/20",
          connection.testStatus === 'success' && "border-green-200 dark:border-green-800",
          connection.testStatus === 'failed' && "border-red-200 dark:border-red-800"
        )}
        onClick={handleSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", statusConfig.bgColor)}>
                <StatusIcon className={cn("h-6 w-6", statusConfig.color, isTesting && "animate-spin")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{connection.name}</h3>
                  {connection.isReadOnly && (
                    <Badge variant="secondary" className="text-xs">
                      READ ONLY
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-blue-600">{getProvidersSummary()}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono text-xs">{regions.length} region{regions.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTest} disabled={isTesting}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevealApiKey();
                  }}
                  disabled={isRevealingApiKey}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reveal API Key
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={statusConfig.badgeVariant} className="text-xs">
                <StatusIcon className={cn("h-3 w-3 mr-1", isTesting && "animate-spin")} />
                {statusConfig.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {regions.length === 1
                  ? regions[0].location
                  : `${regions.length} regions`}
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last used</span>
                <span>{new Date(connection.lastUsed).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{connection.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog - shows revealed key or confirmation for non-auth platforms */}
      <Dialog open={showApiKeyDialog} onOpenChange={(open) => !open && closeApiKeyDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {revealedApiKey ? 'API Key' : 'Reveal API Key'}
            </DialogTitle>
            <DialogDescription>
              {revealedApiKey ? (
                <>API key for "{connection.name}"</>
              ) : (
                <>
                  You are about to reveal the API key for "{connection.name}".
                  <br /><br />
                  <span className="text-amber-500 font-medium">
                    Keep your API key secure. Never share it publicly or commit it to version control.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {revealedApiKey && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted border rounded px-3 py-2 font-mono text-sm break-all">
                  {isApiKeyVisible ? revealedApiKey : getMaskedApiKey(revealedApiKey)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                >
                  {isApiKeyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-amber-500 font-medium">
                Keep your API key secure. Never share it publicly or commit it to version control.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeApiKeyDialog}>
              {revealedApiKey ? 'Close' : 'Cancel'}
            </Button>
            {revealedApiKey ? (
              <Button
                onClick={handleCopyRevealedApiKey}
                disabled={isCopyingApiKey}
              >
                {isCopyingApiKey ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => handleRevealApiKey(true)}
                disabled={isRevealingApiKey}
              >
                {isRevealingApiKey ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Revealing...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Reveal API Key
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditConnectionDialog
        connection={connection}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
      />
    </>
  );
}