import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useConnections } from "../../contexts/ConnectionContext";
import { useSettings } from "../../contexts/SettingsContext";
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
  ChevronLeft,
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
];

const bottomItems: SidebarItem[] = [
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

// Slide-out label component for collapsed state
function SlideoutLabel({
  label,
  children,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const handleMouseEnter = () => {
    // Delay showing tooltip to avoid interfering with quick clicks
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isHovered && !disabled && (
        <div
          className={cn(
            "fixed top-0 left-0 z-[9999]",
            "bg-sidebar-accent border border-sidebar-border",
            "px-2 py-1 whitespace-nowrap",
            "text-xs font-medium text-sidebar-foreground",
            "pointer-events-none rounded"
          )}
          style={{
            left: containerRef.current
              ? `${containerRef.current.getBoundingClientRect().right + 8}px`
              : undefined,
            top: containerRef.current
              ? `${containerRef.current.getBoundingClientRect().top + containerRef.current.getBoundingClientRect().height / 2}px`
              : undefined,
            transform: 'translateY(-50%)',
          }}
        >
          {label}
          {/* Arrow pointing left */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-sidebar-border" />
        </div>
      )}
    </div>
  );
}

// Collapse toggle button (appears on hover)
function CollapseToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "absolute -right-3 top-3 z-10",
        "w-6 h-6 rounded bg-sidebar-accent border border-sidebar-border",
        "flex items-center justify-center",
        "opacity-0 group-hover:opacity-100",
        "hover:bg-sidebar-accent-hover",
        "transition-opacity duration-150"
      )}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="w-3 h-3" />
      ) : (
        <ChevronLeft className="w-3 h-3" />
      )}
    </button>
  );
}

// Header component for the sidebar
function SidebarHeader({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <header
      className={cn(
        "flex items-center py-3",
        isCollapsed ? "justify-center px-2" : "gap-2 px-3"
      )}
    >
      <TurbopufferLogo size={20} />
      {!isCollapsed && (
        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
          TURBOPUFFER
        </span>
      )}
    </header>
  );
}

// Connection status component
function ConnectionStatus({ isCollapsed }: { isCollapsed: boolean }) {
  const navigate = useNavigate();
  const { connectionId, namespaceId } = useParams<{
    connectionId?: string;
    namespaceId?: string;
  }>();
  const { getConnectionById } = useConnections();

  const connection = connectionId ? getConnectionById(connectionId) : null;

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-0.5 py-2">
        <SlideoutLabel label={connection?.name || "No connection"}>
          <button
            onClick={() => navigate("/connections")}
            className="w-full h-9 flex items-center justify-center hover:bg-sidebar-accent transition-colors"
            aria-label="Connection"
          >
            <Database className="w-4 h-4" />
          </button>
        </SlideoutLabel>
        {connection && (
          <SlideoutLabel label={namespaceId || "Select namespace"}>
            <button
              onClick={() =>
                navigate(`/connections/${connectionId}/namespaces`)
              }
              className="w-full h-9 flex items-center justify-center hover:bg-sidebar-accent transition-colors"
              aria-label="Namespace"
            >
              <Folder className="w-4 h-4" />
            </button>
          </SlideoutLabel>
        )}
      </div>
    );
  }

  if (!connection) {
    return (
      <button
        onClick={() => navigate("/connections")}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent py-1.5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Database className="h-3 w-3 text-sidebar-foreground/50 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              Connection
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">none</p>
          </div>
        </div>
        <ChevronRight className="h-3 w-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50 transition-colors flex-shrink-0" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate("/connections")}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent py-1.5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database className="h-3 w-3 text-sidebar-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              Connection
            </p>
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {connection.name}
            </p>
          </div>
        </div>
        <ChevronRight className="h-3 w-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50 transition-colors flex-shrink-0" />
      </button>

      <button
        onClick={() => navigate(`/connections/${connectionId}/namespaces`)}
        className="w-full flex items-center justify-between group hover:bg-sidebar-accent py-1.5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Folder className="h-3 w-3 text-sidebar-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              Namespace
            </p>
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {namespaceId || "select"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-3 w-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50 transition-colors flex-shrink-0" />
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
  isCollapsed,
}: {
  item: SidebarItem;
  isSelected: boolean;
  onNavigate: () => void;
  isDisabled: boolean;
  disabledReason: string | null;
  isCollapsed: boolean;
}) {
  const content = (
    <button
      className={cn(
        "w-full flex items-center text-xs transition-colors text-left focus:outline-none relative",
        isCollapsed
          ? "justify-center h-9 px-0"
          : "gap-2 px-3 py-2 border-l-[3px]",
        isSelected && !isCollapsed &&
          "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-primary",
        isSelected && isCollapsed &&
          "bg-sidebar-accent text-sidebar-accent-foreground",
        !isSelected && !isCollapsed &&
          "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-transparent",
        !isSelected && isCollapsed &&
          "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        isDisabled && "opacity-40 cursor-not-allowed"
      )}
      onClick={onNavigate}
      disabled={isDisabled}
      aria-label={item.label}
    >
      {isCollapsed && isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sidebar-primary" />
      )}
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate font-medium">{item.label}</span>
          {isDisabled && disabledReason && (
            <Badge
              variant="outline"
              className="ml-auto text-[9px] px-1 py-0 h-4"
            >
              {disabledReason}
            </Badge>
          )}
        </>
      )}
    </button>
  );

  if (isCollapsed) {
    return <SlideoutLabel label={item.label}>{content}</SlideoutLabel>;
  }

  return content;
}

// Navigation group component
function NavigationGroup({
  group,
  isSelected,
  onNavigate,
  isDisabled,
  getDisabledReason,
  isCollapsed,
}: {
  group: SidebarGroup;
  isSelected: (path: string) => boolean;
  onNavigate: (item: SidebarItem) => void;
  isDisabled: (item: SidebarItem) => boolean;
  getDisabledReason: (item: SidebarItem) => string | null;
  isCollapsed: boolean;
}) {
  return (
    <div className={cn(isCollapsed ? "space-y-0" : "space-y-1")}>
      {!isCollapsed && (
        <h3 className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest px-3">
          {group.title}
        </h3>
      )}
      <div className={cn(isCollapsed ? "space-y-0.5" : "space-y-1")}>
        {group.items.map((item) => (
          <NavigationItem
            key={item.key}
            item={item}
            isSelected={isSelected(item.path)}
            onNavigate={() => onNavigate(item)}
            isDisabled={isDisabled(item)}
            disabledReason={getDisabledReason(item)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </div>
  );
}

// Main navigation component
function MainNavigation({ isCollapsed }: { isCollapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectionId, namespaceId } = useParams<{
    connectionId?: string;
    namespaceId?: string;
  }>();

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
    if (item.requiresConnection && !connectionId) {
      return;
    }
    if (item.requiresNamespace && !namespaceId) {
      return;
    }

    // Build hierarchical paths based on current context
    if (item.key === "documents" && connectionId && namespaceId) {
      navigate(`/connections/${connectionId}/namespaces/${namespaceId}/documents`);
    } else if (item.key === "schema" && connectionId && namespaceId) {
      navigate(`/connections/${connectionId}/namespaces/${namespaceId}/schema`);
    } else {
      navigate(item.path);
    }
  };

  const isDisabled = (item: SidebarItem) => {
    if (item.requiresConnection && !connectionId) {
      return true;
    }
    if (item.requiresNamespace && !namespaceId) {
      return true;
    }
    return false;
  };

  const getDisabledReason = (item: SidebarItem) => {
    if (item.requiresConnection && !connectionId) {
      return "no conn";
    }
    if (item.requiresNamespace && !namespaceId) {
      return "no ns";
    }
    return null;
  };

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto",
        isCollapsed ? "px-0 py-2" : "px-2 py-3 space-y-4"
      )}
    >
      {sidebarGroups.map((group) => (
        <NavigationGroup
          key={group.title}
          group={group}
          isSelected={isSelected}
          onNavigate={handleNavigation}
          isDisabled={isDisabled}
          getDisabledReason={getDisabledReason}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
}

// Footer navigation component
function FooterNavigation({ isCollapsed }: { isCollapsed: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isSelected = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (item: SidebarItem) => {
    navigate(item.path);
  };

  return (
    <footer className={cn(isCollapsed ? "px-0 py-2" : "px-2 py-2")}>
      {bottomItems.map((item) => (
        <NavigationItem
          key={item.key}
          item={item}
          isSelected={isSelected(item.path)}
          onNavigate={() => handleNavigation(item)}
          isDisabled={false}
          disabledReason={null}
          isCollapsed={isCollapsed}
        />
      ))}
    </footer>
  );
}

export function Sidebar() {
  const { settings, updateSettings } = useSettings();
  const isCollapsed = settings?.appearance.sidebarCollapsed ?? false;

  const toggleSidebar = () => {
    updateSettings({
      appearance: {
        ...settings?.appearance,
        sidebarCollapsed: !isCollapsed,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-sidebar relative group">
      <CollapseToggle isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      <SidebarHeader isCollapsed={isCollapsed} />

      <div
        className={cn(
          "border-b border-sidebar-border",
          isCollapsed ? "py-2" : "px-3 py-2 space-y-2"
        )}
      >
        <ConnectionStatus isCollapsed={isCollapsed} />
      </div>

      <MainNavigation isCollapsed={isCollapsed} />

      <Separator className="bg-sidebar-border" />

      <FooterNavigation isCollapsed={isCollapsed} />
    </div>
  );
}
