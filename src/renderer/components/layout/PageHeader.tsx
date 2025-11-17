import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("px-3 py-2 border-b border-tp-border-subtle bg-tp-surface flex items-center justify-between", className)}>
      <div className="flex flex-col">
        <h1 className="text-sm font-bold uppercase tracking-wider text-tp-text">{title}</h1>
        {description && (
          <p className="text-xs text-tp-text-muted mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5">
          {actions}
        </div>
      )}
    </div>
  );
}