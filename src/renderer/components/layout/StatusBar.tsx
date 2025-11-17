import React from 'react';
import { useConnection } from '../../contexts/ConnectionContext';
import { useNamespace } from '../../contexts/NamespaceContext';
import { useDocumentsStore } from '../../stores/documentsStore';

export function StatusBar() {
  const { activeConnection } = useConnection();
  const { selectedNamespace } = useNamespace();
  const totalCount = useDocumentsStore((state) => state.totalCount);
  const isLoading = useDocumentsStore((state) => state.isLoading);

  return (
    <footer className="px-3 bg-tp-surface-alt flex items-center h-6 text-xs tracking-terminal">
      <div className="flex items-center gap-3 text-tp-text-muted font-mono">
        {/* Connection Status */}
        {activeConnection ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="text-tp-success">●</span>
              <span className="text-tp-text">{activeConnection.name}</span>
            </span>
            <span className="text-tp-border-strong">│</span>
            <span className="text-tp-text-faint">{activeConnection.region.name}</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="text-tp-danger">●</span>
              <span className="text-tp-text-faint">no connection</span>
            </span>
          </>
        )}

        {/* Namespace */}
        {selectedNamespace && (
          <>
            <span className="text-tp-border-strong">│</span>
            <span className="text-tp-text-faint">ns:</span>
            <span className="text-tp-text">{selectedNamespace.id}</span>
          </>
        )}

        {/* Document Count */}
        {totalCount !== null && totalCount !== undefined && (
          <>
            <span className="text-tp-border-strong">│</span>
            <span className="text-tp-text-faint">docs:</span>
            <span className="text-tp-text">{totalCount.toLocaleString()}</span>
          </>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <>
            <span className="text-tp-border-strong">│</span>
            <span className="text-tp-accent animate-pulse">⟳ loading</span>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side info */}
        <span className="text-tp-text-faint">tpuf&gt;</span>
      </div>
    </footer>
  );
}