import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
