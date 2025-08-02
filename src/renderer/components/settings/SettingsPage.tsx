import React, { useState } from 'react';
import { Settings2, Database, Globe, Download, Upload, RotateCcw, Info } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { ConnectionSettings } from './ConnectionSettings';
import { ApiSettings } from './ApiSettings';
import { ExportImportSettings } from './ExportImportSettings';
import { AboutSection } from './AboutSection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SettingsSection = 'connection' | 'api' | 'export-import' | 'about';

interface SettingsSidebarItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const sidebarItems: SettingsSidebarItem[] = [
  {
    id: 'connection',
    label: 'Connection',
    icon: <Database className="h-4 w-4" />,
    description: 'Default connection and timeouts',
  },
  {
    id: 'api',
    label: 'API Settings',
    icon: <Globe className="h-4 w-4" />,
    description: 'Custom endpoints and logging',
  },
  {
    id: 'export-import',
    label: 'Export/Import',
    icon: <Download className="h-4 w-4" />,
    description: 'Backup and restore settings',
  },
  {
    id: 'about',
    label: 'About',
    icon: <Info className="h-4 w-4" />,
    description: 'Version and links',
  },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('connection');

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Settings"
        description="Configure application preferences and customize your workflow"
      />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  activeSection === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <div className="mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl">
            {activeSection === 'connection' && <ConnectionSettings />}
            {activeSection === 'api' && <ApiSettings />}
            {activeSection === 'export-import' && <ExportImportSettings />}
            {activeSection === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}