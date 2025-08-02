import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, FileText, Database } from 'lucide-react';

export function AboutSection() {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);
  }, []);

  const openExternal = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About Turbopuffer GUI</CardTitle>
          <CardDescription>
            A modern desktop client for Turbopuffer vector database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">{version}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Built with:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Electron + React + TypeScript</li>
              <li>• Tailwind CSS + shadcn/ui</li>
              <li>• Turbopuffer SDK</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>
            Helpful links and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openExternal('https://github.com/your-username/turbopuffer-gui')}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub Repository
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openExternal('https://turbopuffer.com/docs')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Turbopuffer Documentation
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openExternal('https://turbopuffer.com')}
          >
            <Database className="mr-2 h-4 w-4" />
            Turbopuffer Website
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This software is licensed under the MIT License.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Copyright © 2024 Mehmet Ali Peker
          </p>
        </CardContent>
      </Card>
    </div>
  );
}