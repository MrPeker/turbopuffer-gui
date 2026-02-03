import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sun, Moon, Monitor } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Light theme for daytime use' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme for low-light environments' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow your system preference' },
] as const;

const FONT_SIZE_OPTIONS = [
  { value: 80, label: '80%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100% (Default)' },
  { value: 110, label: '110%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
];

export function AppearanceSettings() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();

  const handleThemeChange = async (value: string) => {
    if (settings && (value === 'light' || value === 'dark' || value === 'system')) {
      await updateSettings({
        appearance: {
          ...settings.appearance,
          theme: value,
        },
      });
    }
  };

  const handleFontSizeChange = async (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && settings) {
      await updateSettings({
        appearance: {
          ...settings.appearance,
          fontSize: numValue,
        },
      });
    }
  };

  if (settingsLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fontSize = settings.appearance.fontSize ?? 100;
  const theme = settings.appearance.theme ?? 'dark';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance Settings</CardTitle>
          <CardDescription>
            Customize the visual appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selector */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme" className="max-w-64">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {THEME_OPTIONS.find(o => o.value === theme)?.description}
            </p>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={fontSize.toString()}
              onValueChange={handleFontSizeChange}
            >
              <SelectTrigger id="font-size" className="max-w-64">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Adjust the font size for better readability
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
