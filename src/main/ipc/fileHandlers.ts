import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export function setupFileHandlers() {
  // Show save dialog and write content to file
  ipcMain.handle('file:saveWithDialog', async (_event, options: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    content: string;
  }) => {
    const window = BrowserWindow.getFocusedWindow();

    const result = await dialog.showSaveDialog(window!, {
      defaultPath: options.defaultPath,
      filters: options.filters || [
        { name: 'All Files', extensions: ['*'] }
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true, filePath: null };
    }

    try {
      await fs.writeFile(result.filePath, options.content, 'utf-8');
      return { canceled: false, filePath: result.filePath };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Open file or folder in OS file manager
  ipcMain.handle('file:showInFolder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  // Open file with default application
  ipcMain.handle('file:openPath', async (_event, filePath: string) => {
    return shell.openPath(filePath);
  });

  // Open URL in default browser
  ipcMain.handle('file:openExternal', async (_event, url: string) => {
    return shell.openExternal(url);
  });
}
