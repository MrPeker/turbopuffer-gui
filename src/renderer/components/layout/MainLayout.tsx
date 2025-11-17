import React, { useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { InspectorPanel } from "./InspectorPanel";
import { useSettings } from "../../contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface OutletContextType {
  inspectorContent: React.ReactNode;
  setInspectorContent: (content: React.ReactNode) => void;
  inspectorTitle: string;
  setInspectorTitle: (title: string) => void;
  isInspectorOpen: boolean;
  openInspector: () => void;
  closeInspector: () => void;
}

export function MainLayout() {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorContent, setInspectorContent] = useState<React.ReactNode>(null);
  const [inspectorTitle, setInspectorTitle] = useState("Inspector");
  const { settings } = useSettings();
  const isCollapsed = settings?.appearance.sidebarCollapsed ?? false;

  const openInspector = () => setIsInspectorOpen(true);
  const closeInspector = () => setIsInspectorOpen(false);

  const outletContext: OutletContextType = {
    inspectorContent,
    setInspectorContent,
    inspectorTitle,
    setInspectorTitle,
    isInspectorOpen,
    openInspector,
    closeInspector,
  };

  return (
    <div className="flex h-screen bg-tp-bg">
      {/* Left Sidebar - Database navigation */}
      <aside
        className={cn(
          "border-r border-tp-border-subtle flex-shrink-0",
          isCollapsed ? "w-14" : "w-52"
        )}
      >
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main workspace */}
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto">
            <Outlet context={outletContext} />
          </div>

          {/* Right Inspector Panel */}
          <InspectorPanel
            isOpen={isInspectorOpen}
            onClose={closeInspector}
            title={inspectorTitle}
          >
            {inspectorContent}
          </InspectorPanel>
        </main>
      </div>
    </div>
  );
}

export function useInspector() {
  return useOutletContext<OutletContextType>();
}
