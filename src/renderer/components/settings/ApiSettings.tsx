import React, { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ApiSettings() {
  const { settings, updateSettings, isLoading } = useSettings();
  const [customEndpoint, setCustomEndpoint] = useState('');

  useEffect(() => {
    if (settings) {
      setCustomEndpoint(settings.api.customEndpoint || '');
    }
  }, [settings]);

  const handleCustomEndpointChange = async () => {
    const endpoint = customEndpoint.trim();
    await updateSettings({
      api: {
        ...settings!.api,
        customEndpoint: endpoint || null,
      },
    });
  };

  const handleLoggingLevelChange = async (level: string) => {
    await updateSettings({
      api: {
        ...settings!.api,
        requestLoggingLevel: level as 'none' | 'basic' | 'detailed' | 'verbose',
      },
    });
  };

  const handleClearEndpoint = async () => {
    setCustomEndpoint('');
    await updateSettings({
      api: {
        ...settings!.api,
        customEndpoint: null,
      },
    });
  };

  if (isLoading || !settings) {
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
          <CardTitle>API Settings</CardTitle>
          <CardDescription>
            Configure API endpoints and request logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom API Endpoint */}
          <div className="space-y-2">
            <Label htmlFor="custom-endpoint">Custom API Endpoint</Label>
            <div className="flex gap-2">
              <Input
                id="custom-endpoint"
                type="url"
                placeholder="https://api.turbopuffer.com"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                onBlur={handleCustomEndpointChange}
                className="flex-1"
              />
              {customEndpoint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearEndpoint}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Override the default Turbopuffer API endpoint. Leave empty to use the default.
            </p>
          </div>

          {/* Request Logging Level */}
          <div className="space-y-2">
            <Label htmlFor="logging-level">Request Logging Level</Label>
            <Select
              value={settings.api.requestLoggingLevel}
              onValueChange={handleLoggingLevelChange}
            >
              <SelectTrigger id="logging-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="verbose">Verbose</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>None:</strong> No logging</p>
              <p><strong>Basic:</strong> Log request URLs and status codes</p>
              <p><strong>Detailed:</strong> Include request/response headers</p>
              <p><strong>Verbose:</strong> Full request/response bodies (may impact performance)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}