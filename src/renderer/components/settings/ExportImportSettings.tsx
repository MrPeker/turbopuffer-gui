import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export function ExportImportSettings() {
  const { resetSettings, exportSettings, importSettings } = useSettings();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleExport = async () => {
    try {
      await exportSettings();
      setMessage({ type: 'success', text: 'Settings exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('canceled')) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const handleImport = async () => {
    try {
      await importSettings();
      setMessage({ type: 'success', text: 'Settings imported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('canceled')) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const handleReset = async () => {
    if (!isResetting) {
      setIsResetting(true);
      setTimeout(() => setIsResetting(false), 3000);
      return;
    }

    try {
      await resetSettings();
      setMessage({ type: 'success', text: 'Settings reset to defaults!' });
      setIsResetting(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset settings' });
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-600'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>
            Save your current settings to a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Settings</CardTitle>
          <CardDescription>
            Load settings from a previously exported JSON file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleImport} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            Import Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset to Defaults</CardTitle>
          <CardDescription>
            Restore all settings to their default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={isResetting ? "destructive" : "outline"}
            onClick={handleReset}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isResetting ? 'Click again to confirm' : 'Reset All Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}