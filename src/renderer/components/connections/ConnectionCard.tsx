import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Connection } from '../../../types/connection';
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
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const navigate = useNavigate();
  const { deleteConnection, testConnection } = useConnections();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const getProviderPrefix = () => {
    return connection.region.provider.toUpperCase();
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
                  <span className="font-semibold text-blue-600">{getProviderPrefix()}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono text-xs">{connection.region.id}</span>
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
                <MapPin className="h-3 w-3" />
                {connection.region.location}
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
    </>
  );
}