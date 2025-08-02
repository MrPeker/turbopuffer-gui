import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { StatusBar } from "./StatusBar";

export function MainLayout() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <footer className="border-t border-border">
          <StatusBar />
        </footer>
      </div>
    </div>
  );
}
