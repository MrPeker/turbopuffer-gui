import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Connection } from '@/types/connection';

interface ConnectionTestBannerProps {
  result: 'testing' | 'success' | 'error' | null;
  connection: Connection | null;
  error?: string;
  onDismiss: () => void;
}

export function ConnectionTestBanner({ result, connection, error, onDismiss }: ConnectionTestBannerProps) {
  useEffect(() => {
    // Only auto-dismiss for success/error, not for testing
    if (result && result !== 'testing') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result, onDismiss]);

  if (!result || !connection) return null;

  const isSuccess = result === 'success';
  const isTesting = result === 'testing';

  return (
    <div
      className="border-b border-tp-border-subtle animate-in slide-in-from-top duration-300"
      style={{
        backgroundColor: isTesting
          ? 'hsl(var(--tp-accent) / 0.05)'
          : isSuccess
          ? 'hsl(var(--tp-success) / 0.05)'
          : 'hsl(var(--tp-danger) / 0.05)',
        borderColor: isTesting
          ? 'hsl(var(--tp-accent) / 0.2)'
          : isSuccess
          ? 'hsl(var(--tp-success) / 0.2)'
          : 'hsl(var(--tp-danger) / 0.2)'
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isTesting ? (
            <Loader2
              className="h-4 w-4 flex-shrink-0 animate-spin"
              style={{ color: 'hsl(var(--tp-accent))' }}
            />
          ) : isSuccess ? (
            <CheckCircle2
              className="h-4 w-4 flex-shrink-0"
              style={{ color: 'hsl(var(--tp-success))' }}
            />
          ) : (
            <XCircle
              className="h-4 w-4 flex-shrink-0"
              style={{ color: 'hsl(var(--tp-danger))' }}
            />
          )}

          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{
                color: isTesting
                  ? 'hsl(var(--tp-accent))'
                  : isSuccess
                  ? 'hsl(var(--tp-success))'
                  : 'hsl(var(--tp-danger))'
              }}
            >
              {isTesting ? 'testing connection...' : isSuccess ? 'connection successful' : 'connection failed'}
            </span>

            <span className="text-tp-border-strong/60">│</span>

            <span className="text-xs text-tp-text font-medium truncate">
              {connection.name}
            </span>

            <span className="text-tp-border-strong/60">│</span>

            <span className="text-xs text-tp-text-muted font-mono">
              {connection.region.location}
            </span>

            {!isSuccess && error && (
              <>
                <span className="text-tp-border-strong/60">│</span>
                <span className="text-xs text-tp-danger truncate">
                  {error}
                </span>
              </>
            )}
          </div>
        </div>

        {!isTesting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-tp-surface-alt/50"
          >
            <X className="h-3 w-3 text-tp-text-muted" />
          </Button>
        )}
      </div>
    </div>
  );
}
