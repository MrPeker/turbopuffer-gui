import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useConnection } from "../../contexts/ConnectionContext";
import { useNamespace } from "../../contexts/NamespaceContext";
import { TurbopufferLogo } from "../TurbopufferLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Database,
  Folder,
  FileText,
  Layout,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  requiresConnection?: boolean;
  requiresNamespace?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Data Operations",
    items: [
      {
        key: "documents",
        label: "Documents",
        path: "/documents",
        icon: <FileText className="h-4 w-4" />,
        requiresConnection: true,
        requiresNamespace: true,
      },
      {
        key: "schema",
        label: "Schema",
        path: "/schema",
        icon: <Layout className="h-4 w-4" />,
        requiresConnection: true,
        requiresNamespace: true,
      },
    ],
  },
  {
    title: "Developer Tools",
    items: [
      {
        key: "schema-designer",
        label: "Schema Designer",
        path: "/schema-designer",
        icon: <Layout className="h-4 w-4" />,
        requiresConnection: false,
        requiresNamespace: false,
      },
    ],
  },
];

const bottomItems: SidebarItem[] = [
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

// Header component for the sidebar
function SidebarHeader() {
  return (
    <header className="flex items-center gap-2 p-4 border-b border-sidebar-border">
      <TurbopufferLogo size={24} />
      <span className="font-semibold text-sidebar-foreground">Turbopuffer</span>
    </header>
  );
}

// Connection status component
function ConnectionStatus() {
  const navigate = useNavigate();
  const { activeConnection } = useConnection();
  const { selectedNamespace } = useNamespace();

  if (!activeConnection) {
    return (
      <button
        onClick={() => navigate("/connections")}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent rounded-md p-2  transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-sidebar-foreground/60" />
          <div className="text-left">
            <p className="text-xs text-sidebar-foreground/60">No Connection</p>
            <p className="text-sm text-sidebar-foreground/60">
              Click to connect
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate("/connections")}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent rounded-md p-2  transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs text-sidebar-foreground/60">Connection</p>
            <p className="text-sm font-medium text-sidebar-foreground">
              {activeConnection.name}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors" />
      </button>

      <button
        onClick={() => navigate("/namespaces")}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent rounded-md p-2  transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Folder className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs text-sidebar-foreground/60">Namespace</p>
            <p className="text-sm font-medium text-sidebar-foreground">
              {selectedNamespace ? selectedNamespace.id : "Select namespace"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors" />
      </button>
    </>
  );
}

// Navigation item component
function NavigationItem({
  item,
  isSelected,
  onNavigate,
  isDisabled,
  disabledReason,
}: {
  item: SidebarItem;
  isSelected: boolean;
  onNavigate: () => void;
  isDisabled: boolean;
  disabledReason: string | null;
}) {
  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onNavigate}
      disabled={isDisabled}
    >
      {item.icon}
      <span className="ml-2">{item.label}</span>
      {isDisabled && disabledReason && (
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
          {disabledReason}
        </Badge>
      )}
    </Button>
  );
}

// Navigation group component
function NavigationGroup({
  group,
  isSelected,
  onNavigate,
  isDisabled,
  getDisabledReason,
}: {
  group: SidebarGroup;
  isSelected: (path: string) => boolean;
  onNavigate: (item: SidebarItem) => void;
  isDisabled: (item: SidebarItem) => boolean;
  getDisabledReason: (item: SidebarItem) => string | null;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        {group.title}
      </h3>
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavigationItem
            key={item.key}
            item={item}
            isSelected={isSelected(item.path)}
            onNavigate={() => onNavigate(item)}
            isDisabled={isDisabled(item)}
            disabledReason={getDisabledReason(item)}
          />
        ))}
      </div>
    </div>
  );
}

// Main navigation component
function MainNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeConnection } = useConnection();
  const { selectedNamespace } = useNamespace();

  const isSelected = (path: string) => {
    if (path === "/connections") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/connections")
      );
    }
    // Special handling for documents path which maps to namespaces route
    if (path === "/documents") {
      return location.pathname.startsWith("/namespaces/");
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (item: SidebarItem) => {
    if (item.requiresConnection && !activeConnection) {
      return;
    }
    if (item.requiresNamespace && !selectedNamespace) {
      return;
    }

    // Special handling for documents - navigate with namespace
    if (item.key === "documents" && selectedNamespace) {
      navigate(`/namespaces/${selectedNamespace.id}`);
    } else {
      navigate(item.path);
    }
  };

  const isDisabled = (item: SidebarItem) => {
    if (item.requiresConnection && !activeConnection) {
      return true;
    }
    if (item.requiresNamespace && !selectedNamespace) {
      return true;
    }
    return false;
  };

  const getDisabledReason = (item: SidebarItem) => {
    if (item.requiresConnection && !activeConnection) {
      return "No connection";
    }
    if (item.requiresNamespace && !selectedNamespace) {
      return "Select namespace";
    }
    return null;
  };

  return (
    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
      {sidebarGroups.map((group) => (
        <NavigationGroup
          key={group.title}
          group={group}
          isSelected={isSelected}
          onNavigate={handleNavigation}
          isDisabled={isDisabled}
          getDisabledReason={getDisabledReason}
        />
      ))}
    </nav>
  );
}

// Footer navigation component
function FooterNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSelected = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (item: SidebarItem) => {
    navigate(item.path);
  };

  return (
    <footer className="p-4">
      {bottomItems.map((item) => (
        <NavigationItem
          key={item.key}
          item={item}
          isSelected={isSelected(item.path)}
          onNavigate={() => handleNavigation(item)}
          isDisabled={false}
          disabledReason={null}
        />
      ))}
    </footer>
  );
}

export function Sidebar() {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <SidebarHeader />

      <div className="px-4 py-3 border-b border-sidebar-border space-y-3">
        <ConnectionStatus />
      </div>

      <MainNavigation />

      <Separator className="bg-sidebar-border" />

      <FooterNavigation />
    </div>
  );
}
