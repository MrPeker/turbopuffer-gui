import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface InspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function InspectorPanel({ isOpen, onClose, title = "Inspector", children }: InspectorPanelProps) {
  const [width, setWidth] = useState(480); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const containerRect = resizeRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate width from the right edge
      const newWidth = containerRect.right - e.clientX;

      // Constrain between min and max width
      const minWidth = 320;
      const maxWidth = containerRect.width * 0.8; // Max 80% of viewport
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <aside
      ref={resizeRef}
      className="border-l border-tp-border-subtle bg-tp-surface flex flex-col h-full relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-tp-accent/30 active:bg-tp-accent/50 transition-colors z-10"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1" />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-tp-border-subtle bg-tp-surface-alt">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-tp-text-muted">
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-tp-surface"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {children}
      </ScrollArea>
    </aside>
  );
}

interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InspectorSection({ title, children }: InspectorSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-tp-text-muted">
        {title}
      </h4>
      <div className="space-y-1">
        {children}
      </div>
      <Separator className="my-3 bg-tp-border-subtle" />
    </div>
  );
}

interface InspectorFieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

export function InspectorField({ label, value, mono = false }: InspectorFieldProps) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-xs">
      <span className="text-tp-text-muted truncate">{label}</span>
      <span className={`col-span-2 text-tp-text break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

interface InspectorJsonProps {
  data: any;
}

export function InspectorJson({ data }: InspectorJsonProps) {
  return (
    <pre className="text-xs bg-tp-bg p-3 rounded-sm border border-tp-border-subtle overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
