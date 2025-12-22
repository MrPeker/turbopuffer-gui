import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Settings } from '../../types/settings';
import { settingsService } from '../services/settingsService';

interface SettingsContextType {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<void>;
  importSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load settings on mount
    loadSettings();

    // Subscribe to settings changes
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
      settingsService.applySettings(newSettings);
    });

    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
      await settingsService.applySettings(loadedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (partial: Partial<Settings>) => {
    setError(null);
    try {
      await settingsService.updateSettings(partial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  const resetSettings = async () => {
    setError(null);
    try {
      const resetted = await settingsService.resetSettings();
      setSettings(resetted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  };

  const exportSettings = async () => {
    setError(null);
    try {
      const filePath = await settingsService.exportSettings();
      console.log('Settings exported to:', filePath);
    } catch (err) {
      // User canceled or error occurred
      if (err instanceof Error && !err.message.includes('canceled')) {
        setError(err.message);
        throw err;
      }
    }
  };

  const importSettings = async () => {
    setError(null);
    try {
      const imported = await settingsService.importSettings();
      setSettings(imported);
    } catch (err) {
      // User canceled or error occurred
      if (err instanceof Error && !err.message.includes('canceled')) {
        setError(err.message);
        throw err;
      }
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        resetSettings,
        exportSettings,
        importSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}