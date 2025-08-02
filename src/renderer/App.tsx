import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { NamespaceProvider } from './contexts/NamespaceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { ConnectionsPage } from './components/connections/ConnectionsPage';
import { NamespacesPage } from './components/namespaces/NamespacesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { SchemaPage } from './components/schema/SchemaPage';
import { StandaloneSchemaDesigner } from './components/schema/StandaloneSchemaDesigner';

export function App() {
  return (
    <SettingsProvider>
      <ConnectionProvider>
        <NamespaceProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/connections" replace />} />
                <Route path="connections" element={<ConnectionsPage />} />
                <Route path="namespaces" element={<NamespacesPage />} />
                <Route path="namespaces/:namespaceId" element={<DocumentsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="schema" element={<SchemaPage />} />
                <Route path="schema-designer" element={<StandaloneSchemaDesigner />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Router>
        </NamespaceProvider>
      </ConnectionProvider>
    </SettingsProvider>
  );
}