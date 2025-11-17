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
    label: 'connection',
    icon: <Database className="h-3 w-3" />,
    description: 'defaults • timeouts',
  },
  {
    id: 'api',
    label: 'api settings',
    icon: <Globe className="h-3 w-3" />,
    description: 'endpoints • logging',
  },
  {
    id: 'export-import',
    label: 'export/import',
    icon: <Download className="h-3 w-3" />,
    description: 'backup • restore',
  },
  {
    id: 'about',
    label: 'about',
    icon: <Info className="h-3 w-3" />,
    description: 'version • links',
  },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('connection');

  return (
    <div className="h-full flex flex-col bg-tp-bg">
      <PageHeader
        title="Settings"
        description="application preferences"
      />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-tp-border-subtle bg-tp-surface px-2 py-2">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-start gap-2 px-3 py-2 text-left transition-colors border-l-[3px] focus:outline-none',
                  activeSection === item.id
                    ? 'bg-tp-surface-alt/80 text-tp-text border-tp-accent'
                    : 'hover:bg-tp-surface-alt/40 border-transparent text-tp-text-muted hover:text-tp-text'
                )}
              >
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider">{item.label}</div>
                  <div className="text-[10px] text-tp-text-faint truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
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