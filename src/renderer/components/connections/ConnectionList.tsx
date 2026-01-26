import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Connection } from '../../../types/connection';
import { getEffectiveRegions } from '../../../types/connection';
import { useConnections } from '../../contexts/ConnectionContext';
import { EditConnectionDialog } from './EditConnectionDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash2,
  ArrowRight,
  RefreshCw,
  TestTube,
  Copy,
  Database,
  Edit,
  Key,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConnectionListProps {
  connections: Connection[];
  onTestResult?: (result: 'testing' | 'success' | 'error', connection: Connection, error?: string) => void;
}

export function ConnectionList({ connections, onTestResult }: ConnectionListProps) {
  const navigate = useNavigate();
  const { deleteConnection, testConnection } = useConnections();
  const [deletingConnection, setDeletingConnection] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [deleteDialogConnection, setDeleteDialogConnection] = useState<Connection | null>(null);
  const [editDialogConnection, setEditDialogConnection] = useState<Connection | null>(null);
  const [apiKeyDialogConnection, setApiKeyDialogConnection] = useState<Connection | null>(null);
  const [isCopyingApiKey, setIsCopyingApiKey] = useState(false);
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isRevealingApiKey, setIsRevealingApiKey] = useState(false);

  const handleSelect = (connection: Connection) => {
    navigate(`/connections/${connection.id}/namespaces`);
  };

  const handleTest = async (e: React.MouseEvent, connection: Connection) => {
    e.stopPropagation();
    setTestingConnection(connection.id);

    // Show testing state
    onTestResult?.('testing', connection);

    try {
      await testConnection(connection.id);
      onTestResult?.('success', connection);
    } catch (error) {
      console.error('Failed to test connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      onTestResult?.('error', connection, errorMessage);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogConnection) return;
    
    setDeletingConnection(deleteDialogConnection.id);
    try {
      await deleteConnection(deleteDialogConnection.id);
      setDeleteDialogConnection(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setDeletingConnection(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRevealApiKey = async (connection: Connection, skipConfirmation = false) => {
    // Check if system authentication is available
    const canUseBiometric = await window.electronAPI.canUseBiometric();

    // If auth is available, it will be triggered by revealApiKey
    // If not, show confirmation dialog (unless skipped)
    if (!canUseBiometric && !skipConfirmation) {
      setApiKeyDialogConnection(connection);
      return;
    }

    setIsRevealingApiKey(true);
    try {
      const apiKey = await window.electronAPI.revealApiKey(connection.id);
      setRevealedApiKey(apiKey);
      setIsApiKeyVisible(false); // Start with masked view
      setApiKeyDialogConnection(connection);
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
    setApiKeyDialogConnection(null);
    setRevealedApiKey(null);
    setIsApiKeyVisible(false);
  };

  const getMaskedApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  return (
    <>
      <div className="border border-tp-border-subtle bg-tp-bg">
        <Table>
          <TableHeader className="bg-tp-surface sticky top-0 z-10">
            <TableRow className="border-b border-tp-border-subtle hover:bg-transparent">
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">connection</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">regions</TableHead>
              <TableHead className="h-9 px-4 text-xs font-bold uppercase tracking-widest text-tp-text-muted">last used</TableHead>
              <TableHead className="h-9 px-4 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-24 text-center text-xs text-tp-text-muted">
                  no connections found
                </TableCell>
              </TableRow>
            ) : (
              connections.map((connection) => {
                const isTesting = testingConnection === connection.id;
                const regions = getEffectiveRegions(connection);
                const hasGcp = regions.some(r => r.provider === 'gcp');
                const hasAws = regions.some(r => r.provider === 'aws');

                return (
                  <TableRow
                    key={connection.id}
                    className="cursor-pointer hover:bg-tp-surface-alt/80 border-b border-tp-border-subtle/50 h-12 transition-colors"
                    onClick={() => handleSelect(connection)}
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-tp-accent/70 flex-shrink-0" />
                        <span className="text-sm text-tp-text font-medium">{connection.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {hasGcp && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                            GCP
                          </Badge>
                        )}
                        {hasAws && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                            AWS
                          </Badge>
                        )}
                        <span className="text-tp-border-strong/60">│</span>
                        <span className="text-xs text-tp-text-muted">
                          {regions.length} region{regions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-tp-text-muted font-mono">
                      {new Date(connection.lastUsed).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-tp-surface border-tp-border-strong">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(connection);
                            }}
                            className="text-sm"
                          >
                            <ArrowRight className="h-3 w-3 mr-1.5" />
                            connect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleTest(e, connection)}
                            disabled={isTesting}
                            className="text-sm"
                          >
                            <TestTube className="h-3 w-3 mr-1.5" />
                            test connection
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditDialogConnection(connection);
                            }}
                            className="text-sm"
                          >
                            <Edit className="h-3 w-3 mr-1.5" />
                            edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(regions.map(r => r.id).join(', '));
                            }}
                            className="text-sm"
                          >
                            <Copy className="h-3 w-3 mr-1.5" />
                            copy region ids
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevealApiKey(connection);
                            }}
                            disabled={isRevealingApiKey}
                            className="text-sm"
                          >
                            <Key className="h-3 w-3 mr-1.5" />
                            reveal api key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-tp-border-subtle" />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogConnection(connection);
                            }}
                            className="text-tp-danger focus:text-tp-danger text-sm"
                          >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteDialogConnection} onOpenChange={(open) => !open && setDeleteDialogConnection(null)}>
        <DialogContent className="bg-tp-surface border-tp-border-strong">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">delete connection</DialogTitle>
            <DialogDescription className="text-xs text-tp-text-muted">
              delete "{deleteDialogConnection?.name}"? this cannot be undone
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogConnection(null)}>
              cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!!deletingConnection}
            >
              {deletingConnection ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  deleting
                </>
              ) : (
                'delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog - shows revealed key or confirmation for non-auth platforms */}
      <Dialog open={!!apiKeyDialogConnection} onOpenChange={(open) => !open && closeApiKeyDialog()}>
        <DialogContent className="bg-tp-surface border-tp-border-strong">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-tp-accent" />
              {revealedApiKey ? 'api key' : 'reveal api key'}
            </DialogTitle>
            <DialogDescription className="text-xs text-tp-text-muted">
              {revealedApiKey ? (
                <>API key for "{apiKeyDialogConnection?.name}"</>
              ) : (
                <>
                  You are about to reveal the API key for "{apiKeyDialogConnection?.name}".
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
                <div className="flex-1 bg-tp-bg border border-tp-border-subtle rounded px-3 py-2 font-mono text-sm break-all">
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

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={closeApiKeyDialog}>
              {revealedApiKey ? 'close' : 'cancel'}
            </Button>
            {revealedApiKey ? (
              <Button
                size="sm"
                onClick={handleCopyRevealedApiKey}
                disabled={isCopyingApiKey}
              >
                {isCopyingApiKey ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    copying...
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1.5" />
                    copy to clipboard
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => apiKeyDialogConnection && handleRevealApiKey(apiKeyDialogConnection, true)}
                disabled={isRevealingApiKey}
              >
                {isRevealingApiKey ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    revealing...
                  </>
                ) : (
                  <>
                    <Key className="h-3 w-3 mr-1.5" />
                    reveal api key
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditConnectionDialog
        connection={editDialogConnection}
        isOpen={!!editDialogConnection}
        onClose={() => setEditDialogConnection(null)}
      />
    </>
  );
}