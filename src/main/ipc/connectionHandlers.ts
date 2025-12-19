import { ipcMain } from 'electron';
import { CredentialService } from '../services/credentialService';

export function setupConnectionHandlers() {
  const credentialService = new CredentialService();

  ipcMain.handle('connection:save', async (event, connectionData) => {
    try {
      return await credentialService.saveConnection(connectionData);
    } catch (error) {
      throw new Error(`Failed to save connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:load', async () => {
    try {
      return await credentialService.loadConnections();
    } catch (error) {
      throw new Error(`Failed to load connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Note: Connection testing is now done in the renderer process using the Turbopuffer SDK

  ipcMain.handle('connection:delete', async (event, connectionId) => {
    try {
      await credentialService.deleteConnection(connectionId);
    } catch (error) {
      throw new Error(`Failed to delete connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle('connection:regions', async () => {
    return credentialService.getRegions();
  });

  ipcMain.handle('connection:getForUse', async (event, connectionId) => {
    try {
      return await credentialService.getConnectionForUse(connectionId);
    } catch (error) {
      throw new Error(`Failed to get connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Note: Direct connection testing is now done in the renderer process using the Turbopuffer SDK
}