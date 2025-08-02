import React from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import { Separator } from '@/components/ui/separator';

export function StatusBar() {
  const { activeConnection } = useConnection();

  return (
    <footer className="px-4 py-2 bg-muted/30">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {activeConnection ? (
            <>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Connected</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="font-medium">{activeConnection.name}</span>
              <span>({activeConnection.region.name})</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Disconnected</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>No active connection</span>
            </>
          )}
        </div>

        <div>
          <span>Turbopuffer GUI v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}