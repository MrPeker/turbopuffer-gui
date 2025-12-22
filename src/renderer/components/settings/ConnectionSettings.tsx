import React, { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function ConnectionSettings() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  
  const [timeout, setTimeout] = useState('30');
  const [retryAttempts, setRetryAttempts] = useState('3');

  useEffect(() => {
    if (settings) {
      setTimeout(settings.connection.requestTimeout.toString());
      setRetryAttempts(settings.connection.retryAttempts.toString());
    }
  }, [settings]);

  const handleTimeoutChange = async (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setTimeout(value);
      await updateSettings({
        connection: {
          ...settings!.connection,
          requestTimeout: numValue,
        },
      });
    }
  };

  const handleRetryAttemptsChange = async (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setRetryAttempts(value);
      await updateSettings({
        connection: {
          ...settings!.connection,
          retryAttempts: numValue,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Configure request behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Request Timeout */}
          <div className="space-y-2">
            <Label htmlFor="request-timeout">Request Timeout (seconds)</Label>
            <Input
              id="request-timeout"
              type="number"
              min="1"
              max="300"
              value={timeout}
              onChange={(e) => handleTimeoutChange(e.target.value)}
              className="max-w-32"
            />
            <p className="text-sm text-muted-foreground">
              Maximum time to wait for API responses before timing out
            </p>
          </div>

          {/* Retry Attempts */}
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">Retry Attempts</Label>
            <Input
              id="retry-attempts"
              type="number"
              min="0"
              max="10"
              value={retryAttempts}
              onChange={(e) => handleRetryAttemptsChange(e.target.value)}
              className="max-w-32"
            />
            <p className="text-sm text-muted-foreground">
              Number of times to retry failed requests (0 = no retries)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}