import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ExternalLink, FileText, Github } from "lucide-react";

export function AboutSection() {
  const [version, setVersion] = useState("1.0.0");

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);
  }, []);

  const openExternal = (url: string) => {
    window.electronAPI.openExternal(url);
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
            <ul className="ml-4 space-y-1 text-sm text-muted-foreground">
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
            className="justify-start w-full"
            onClick={() =>
              openExternal("https://github.com/MrPeker/turbopuffer-gui")}
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub Repository
            <ExternalLink className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="justify-start w-full"
            onClick={() => openExternal("https://turbopuffer.com/docs")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Turbopuffer Documentation
            <ExternalLink className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            className="justify-start w-full"
            onClick={() => openExternal("https://turbopuffer.com")}
          >
            <Database className="w-4 h-4 mr-2" />
            Turbopuffer Website
            <ExternalLink className="w-4 h-4 ml-auto" />
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
          <p className="mt-2 text-sm text-muted-foreground">
            Copyright © 2025 Mehmet Ali Peker
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is an unofficial, third-party client. Turbopuffer is a
            trademark of Turbopuffer, Inc. This project is not affiliated with,
            endorsed by, or sponsored by Turbopuffer, Inc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
