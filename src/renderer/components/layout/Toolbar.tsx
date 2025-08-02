import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  title?: string;
  breadcrumbs?: { label: string; key: string }[];
  actions?: React.ReactNode;
  menuItems?: Array<{ key: string; label: string; onAction: () => void }>;
}

export function Toolbar({
  title,
  breadcrumbs = [],
  actions,
  menuItems,
}: ToolbarProps) {
  const location = useLocation();

  const getPageTitle = () => {
    if (title) return title;

    switch (location.pathname) {
      case "/connections":
        return "Connections";
      case "/namespaces":
        return "Namespaces";
      case "/query":
        return "Query Builder";
      case "/documents":
        return "Documents";
      case "/schema":
        return "Schema Designer";
      case "/vector":
        return "Vector Playground";
      case "/settings":
        return "Settings";
      default:
        return "Turbopuffer GUI";
    }
  };

  return (
    <header className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
          
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.key} className="flex items-center gap-2">
                  {index > 0 && <span>›</span>}
                  {crumb.label}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {menuItems && menuItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("Menu not yet implemented");
              }}
            >
              Menu
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
