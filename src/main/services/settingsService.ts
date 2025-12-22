import { app, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Settings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../types/settings';

export class SettingsService {
  private static instance: SettingsService;
  private settingsPath: string;
  private settings: Settings | null = null;

  private constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async loadSettings(): Promise<Settings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = JSON.parse(data);
      
      // Merge with defaults to ensure all fields exist
      this.settings = this.mergeWithDefaults(this.settings!);
      
      return this.settings;
    } catch (error) {
      // If file doesn't exist or is invalid, return defaults
      this.settings = { ...DEFAULT_SETTINGS };
      await this.saveSettings(this.settings);
      return this.settings;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      this.settings = settings;
      await fs.writeFile(
        this.settingsPath, 
        JSON.stringify(settings, null, 2), 
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings(this.settings);
  }

  async exportSettings(): Promise<string> {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Settings',
        defaultPath: `turbopuffer-settings-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (canceled || !filePath) {
        throw new Error('Export canceled');
      }

      const settings = await this.loadSettings();
      await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importSettings(importPath?: string): Promise<Settings> {
    try {
      let filePath = importPath;
      
      if (!filePath) {
        const { filePaths, canceled } = await dialog.showOpenDialog({
          title: 'Import Settings',
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (canceled || filePaths.length === 0) {
          throw new Error('Import canceled');
        }
        
        filePath = filePaths[0];
      }

      const data = await fs.readFile(filePath, 'utf-8');
      const importedSettings = JSON.parse(data);
      
      // Validate and merge with defaults
      const mergedSettings = this.mergeWithDefaults(importedSettings);
      await this.saveSettings(mergedSettings);
      
      return mergedSettings;
    } catch (error) {
      throw new Error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mergeWithDefaults(settings: Partial<Settings>): Settings {
    return {
      connection: {
        ...DEFAULT_SETTINGS.connection,
        ...settings.connection,
      },
      api: {
        ...DEFAULT_SETTINGS.api,
        ...settings.api,
      },
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...settings.appearance,
      },
      version: settings.version || DEFAULT_SETTINGS.version,
    };
  }

  getSettings(): Settings {
    return this.settings || DEFAULT_SETTINGS;
  }
}