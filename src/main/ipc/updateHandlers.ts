import { ipcMain } from 'electron';
import { UpdateService } from '../services/updateService';

export function setupUpdateHandlers() {
  const updateService = UpdateService.getInstance();

  ipcMain.handle('update:check', async () => {
    try {
      return await updateService.checkForUpdates();
    } catch (error) {
      throw new Error(`Failed to check for updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('update:getState', async () => {
    try {
      return await updateService.getUpdateState();
    } catch (error) {
      throw new Error(`Failed to get update state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('update:dismiss', async (_, version: string) => {
    try {
      await updateService.dismissUpdate(version);
    } catch (error) {
      throw new Error(`Failed to dismiss update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
