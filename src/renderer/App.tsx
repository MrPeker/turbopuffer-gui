import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { NamespaceProvider } from './contexts/NamespaceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { ConnectionGuard } from './components/layout/ConnectionGuard';
import { NamespaceGuard } from './components/layout/NamespaceGuard';
import { ConnectionsPage } from './components/connections/ConnectionsPage';
import { NamespacesPage } from './components/namespaces/NamespacesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { SchemaPage } from './components/schema/SchemaPage';

export function App() {
  return (
    <SettingsProvider>
      <ConnectionProvider>
        <NamespaceProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                {/* Root redirect */}
                <Route index element={<Navigate to="/connections" replace />} />

                {/* Connections list */}
                <Route path="connections" element={<ConnectionsPage />} />

                {/* Connection-scoped routes */}
                <Route path="connections/:connectionId">
                  {/* Namespaces list for connection */}
                  <Route
                    path="namespaces"
                    element={
                      <ConnectionGuard>
                        <NamespacesPage />
                      </ConnectionGuard>
                    }
                  />

                  {/* Namespace-scoped routes */}
                  <Route path="namespaces/:namespaceId">
                    {/* Documents view */}
                    <Route
                      path="documents"
                      element={
                        <NamespaceGuard>
                          <DocumentsPage />
                        </NamespaceGuard>
                      }
                    />

                    {/* Schema view */}
                    <Route
                      path="schema"
                      element={
                        <NamespaceGuard>
                          <SchemaPage />
                        </NamespaceGuard>
                      }
                    />
                  </Route>
                </Route>

                {/* Settings - top-level, no connection required */}
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Router>
        </NamespaceProvider>
      </ConnectionProvider>
    </SettingsProvider>
  );
}