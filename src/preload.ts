// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type { ConnectionAPI, ConnectionFormData } from './types/connection';
import type { SettingsAPI, Settings } from './types/settings';
import type { UpdateAPI } from './types/update';

const connectionAPI: ConnectionAPI = {
  saveConnection: (connection: ConnectionFormData) => 
    ipcRenderer.invoke('connection:save', connection),
  
  loadConnections: () => 
    ipcRenderer.invoke('connection:load'),
  
  testConnection: (connectionId: string) => 
    ipcRenderer.invoke('connection:test', connectionId),
  
  testConnectionDirect: (connectionData: { regionId: string; apiKey: string }) =>
    ipcRenderer.invoke('connection:testDirect', connectionData),
  
  deleteConnection: (connectionId: string) => 
    ipcRenderer.invoke('connection:delete', connectionId),
  
  getRegions: () =>
    ipcRenderer.invoke('connection:regions'),

  getConnectionForUse: (connectionId: string) =>
    ipcRenderer.invoke('connection:getForUse', connectionId),
};

const settingsAPI: SettingsAPI = {
  loadSettings: () => 
    ipcRenderer.invoke('settings:load'),
  
  saveSettings: (settings: Settings) => 
    ipcRenderer.invoke('settings:save', settings),
  
  resetSettings: () => 
    ipcRenderer.invoke('settings:reset'),
  
  exportSettings: () => 
    ipcRenderer.invoke('settings:export'),
  
  importSettings: (filePath: string) => 
    ipcRenderer.invoke('settings:import', filePath),
};

const appAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
};

const fileAPI = {
  saveWithDialog: (options: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    content: string;
  }) => ipcRenderer.invoke('file:saveWithDialog', options),

  showInFolder: (filePath: string) => ipcRenderer.invoke('file:showInFolder', filePath),

  openPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),

  openExternal: (url: string) => ipcRenderer.invoke('file:openExternal', url),
};

const queryHistoryAPI = {
  loadQueryHistory: (connectionId: string, namespaceId: string) =>
    ipcRenderer.invoke('queryHistory:load', connectionId, namespaceId),

  saveQueryHistory: (connectionId: string, namespaceId: string, history: any) =>
    ipcRenderer.invoke('queryHistory:save', connectionId, namespaceId, history),

  addSavedFilter: (connectionId: string, namespaceId: string, entry: any) =>
    ipcRenderer.invoke('queryHistory:addSaved', connectionId, namespaceId, entry),

  addRecentFilter: (connectionId: string, namespaceId: string, entry: any) =>
    ipcRenderer.invoke('queryHistory:addRecent', connectionId, namespaceId, entry),

  updateFilterCount: (connectionId: string, namespaceId: string, filterId: string) =>
    ipcRenderer.invoke('queryHistory:updateCount', connectionId, namespaceId, filterId),

  deleteSavedFilter: (connectionId: string, namespaceId: string, filterId: string) =>
    ipcRenderer.invoke('queryHistory:deleteSaved', connectionId, namespaceId, filterId),

  clearRecentFilters: (connectionId: string, namespaceId: string) =>
    ipcRenderer.invoke('queryHistory:clearRecent', connectionId, namespaceId),

  deleteAllHistory: (connectionId: string, namespaceId: string) =>
    ipcRenderer.invoke('queryHistory:deleteAll', connectionId, namespaceId),
};

const updateAPI: UpdateAPI = {
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  getUpdateState: () => ipcRenderer.invoke('update:getState'),
  dismissUpdate: (version: string) => ipcRenderer.invoke('update:dismiss', version),
};

contextBridge.exposeInMainWorld('electronAPI', {
  ...connectionAPI,
  ...settingsAPI,
  ...appAPI,
  ...fileAPI,
  ...queryHistoryAPI,
  ...updateAPI,
});

// Type augmentation for window object
declare global {
  interface Window {
    electronAPI: ConnectionAPI & SettingsAPI & UpdateAPI & {
      getVersion: () => Promise<string>;
      // File API
      saveWithDialog: (options: {
        defaultPath?: string;
        filters?: { name: string; extensions: string[] }[];
        content: string;
      }) => Promise<{ canceled: boolean; filePath: string | null }>;
      showInFolder: (filePath: string) => Promise<void>;
      openPath: (filePath: string) => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      // Query History API
      loadQueryHistory: (connectionId: string, namespaceId: string) => Promise<any>;
      saveQueryHistory: (connectionId: string, namespaceId: string, history: any) => Promise<void>;
      addSavedFilter: (connectionId: string, namespaceId: string, entry: any) => Promise<void>;
      addRecentFilter: (connectionId: string, namespaceId: string, entry: any) => Promise<void>;
      updateFilterCount: (connectionId: string, namespaceId: string, filterId: string) => Promise<void>;
      deleteSavedFilter: (connectionId: string, namespaceId: string, filterId: string) => Promise<void>;
      clearRecentFilters: (connectionId: string, namespaceId: string) => Promise<void>;
      deleteAllHistory: (connectionId: string, namespaceId: string) => Promise<void>;
    };
  }
}
