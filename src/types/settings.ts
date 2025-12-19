export interface ConnectionSettings {
  requestTimeout: number; // in seconds
  retryAttempts: number;
}

export interface ApiSettings {
  customEndpoint: string | null;
  requestLoggingLevel: 'none' | 'basic' | 'detailed' | 'verbose';
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  fontSize: number; // percentage: 80, 90, 100, 110, 125, etc.
}

export interface Settings {
  connection: ConnectionSettings;
  api: ApiSettings;
  appearance: AppearanceSettings;
  version: string;
}

export const DEFAULT_SETTINGS: Settings = {
  connection: {
    requestTimeout: 30,
    retryAttempts: 3,
  },
  api: {
    customEndpoint: null,
    requestLoggingLevel: 'none',
  },
  appearance: {
    theme: 'system',
    sidebarCollapsed: false,
    fontSize: 100,
  },
  version: '1.0.0',
};

export interface SettingsAPI {
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (filePath: string) => Promise<Settings>;
}