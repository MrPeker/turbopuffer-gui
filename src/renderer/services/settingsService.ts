import type { Settings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../types/settings';

class SettingsService {
  private settings: Settings | null = null;
  private listeners: Set<(settings: Settings) => void> = new Set();

  async loadSettings(): Promise<Settings> {
    try {
      this.settings = await window.electronAPI.loadSettings();
      this.notifyListeners();
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = DEFAULT_SETTINGS;
      return this.settings;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await window.electronAPI.saveSettings(settings);
      this.settings = settings;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async updateSettings(partial: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...partial,
      connection: {
        ...current.connection,
        ...partial.connection,
      },
      api: {
        ...current.api,
        ...partial.api,
      },
      appearance: {
        ...current.appearance,
        ...partial.appearance,
      },
    };
    await this.saveSettings(updated);
  }

  async resetSettings(): Promise<Settings> {
    try {
      this.settings = await window.electronAPI.resetSettings();
      this.notifyListeners();
      return this.settings;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  async exportSettings(): Promise<string> {
    try {
      return await window.electronAPI.exportSettings();
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  async importSettings(): Promise<Settings> {
    try {
      this.settings = await window.electronAPI.importSettings('');
      this.notifyListeners();
      return this.settings;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<Settings> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings!;
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    if (this.settings) {
      this.listeners.forEach(listener => listener(this.settings!));
    }
  }

  // Apply settings immediately
  async applySettings(settings: Settings): Promise<void> {
    // Apply theme
    if (settings.appearance.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Apply other settings as needed
    // Request timeout and retry attempts will be used by turbopufferService
  }
}

export const settingsService = new SettingsService();