import type { Settings } from '../../types/settings';
import { DEFAULT_SETTINGS } from '../../types/settings';

class SettingsService {
  private settings: Settings | null = null;
  private listeners: Set<(settings: Settings) => void> = new Set();
  private systemThemeMediaQuery: MediaQueryList | null = null;
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

  async loadSettings(): Promise<Settings> {
    try {
      const loadedSettings = await window.electronAPI.loadSettings();
      this.settings = this.migrateSettings(loadedSettings);
      this.notifyListeners();
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = DEFAULT_SETTINGS;
      return this.settings;
    }
  }

  private migrateSettings(settings: Settings): Settings {
    return {
      ...settings,
      appearance: {
        ...settings.appearance,
        fontSize: settings.appearance.fontSize ?? DEFAULT_SETTINGS.appearance.fontSize,
      },
    };
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
    this.applyTheme(settings.appearance.theme);

    // Apply font size
    const fontSizePercent = settings.appearance.fontSize ?? 100;
    document.documentElement.style.fontSize = `${fontSizePercent}%`;

    // Apply other settings as needed
    // Request timeout and retry attempts will be used by turbopufferService
  }

  // Apply theme based on setting (light/dark/system)
  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    // Clean up previous system theme listener
    this.cleanupSystemThemeListener();

    if (theme === 'system') {
      // Set up system theme detection
      this.setupSystemThemeListener();
      this.applySystemTheme();
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Get the current effective theme (resolves 'system' to actual theme)
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.settings?.appearance.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.settings?.appearance.theme ?? 'dark';
  }

  // Set up listener for system theme changes
  private setupSystemThemeListener(): void {
    this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeListener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Notify listeners so components can update (e.g., Monaco editor)
      this.notifyListeners();
    };
    this.systemThemeMediaQuery.addEventListener('change', this.systemThemeListener);
  }

  // Apply the current system theme
  private applySystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Clean up system theme listener
  private cleanupSystemThemeListener(): void {
    if (this.systemThemeMediaQuery && this.systemThemeListener) {
      this.systemThemeMediaQuery.removeEventListener('change', this.systemThemeListener);
      this.systemThemeMediaQuery = null;
      this.systemThemeListener = null;
    }
  }
}

export const settingsService = new SettingsService();