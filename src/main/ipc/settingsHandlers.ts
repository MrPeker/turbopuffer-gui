import { ipcMain } from 'electron';
import { SettingsService } from '../services/settingsService';
import { QueryHistoryService } from '../services/queryHistoryService';

export function setupSettingsHandlers() {
  const settingsService = SettingsService.getInstance();
  const queryHistoryService = QueryHistoryService.getInstance();

  ipcMain.handle('settings:load', async () => {
    try {
      return await settingsService.loadSettings();
    } catch (error) {
      throw new Error(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('settings:save', async (_, settings) => {
    try {
      await settingsService.saveSettings(settings);
    } catch (error) {
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('settings:reset', async () => {
    try {
      await settingsService.resetSettings();
      return await settingsService.loadSettings();
    } catch (error) {
      throw new Error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('settings:export', async () => {
    try {
      return await settingsService.exportSettings();
    } catch (error) {
      throw new Error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('settings:import', async (_, filePath?: string) => {
    try {
      return await settingsService.importSettings(filePath);
    } catch (error) {
      throw new Error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('app:getVersion', () => {
    return process.env.npm_package_version || '1.0.0';
  });

  // Query History handlers
  ipcMain.handle('queryHistory:load', async (_, connectionId: string, namespaceId: string) => {
    try {
      return await queryHistoryService.loadQueryHistory(connectionId, namespaceId);
    } catch (error) {
      throw new Error(`Failed to load query history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:save', async (_, connectionId: string, namespaceId: string, history: any) => {
    try {
      await queryHistoryService.saveQueryHistory(connectionId, namespaceId, history);
    } catch (error) {
      throw new Error(`Failed to save query history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:addSaved', async (_, connectionId: string, namespaceId: string, entry: any) => {
    try {
      await queryHistoryService.addSavedFilter(connectionId, namespaceId, entry);
    } catch (error) {
      throw new Error(`Failed to add saved filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:addRecent', async (_, connectionId: string, namespaceId: string, entry: any) => {
    try {
      await queryHistoryService.addRecentFilter(connectionId, namespaceId, entry);
    } catch (error) {
      throw new Error(`Failed to add recent filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:updateCount', async (_, connectionId: string, namespaceId: string, filterId: string) => {
    try {
      await queryHistoryService.updateSavedFilterCount(connectionId, namespaceId, filterId);
    } catch (error) {
      throw new Error(`Failed to update filter count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:deleteSaved', async (_, connectionId: string, namespaceId: string, filterId: string) => {
    try {
      await queryHistoryService.deleteSavedFilter(connectionId, namespaceId, filterId);
    } catch (error) {
      throw new Error(`Failed to delete saved filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:clearRecent', async (_, connectionId: string, namespaceId: string) => {
    try {
      await queryHistoryService.clearRecentFilters(connectionId, namespaceId);
    } catch (error) {
      throw new Error(`Failed to clear recent filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('queryHistory:deleteAll', async (_, connectionId: string, namespaceId: string) => {
    try {
      await queryHistoryService.deleteAllHistory(connectionId, namespaceId);
    } catch (error) {
      throw new Error(`Failed to delete all history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}