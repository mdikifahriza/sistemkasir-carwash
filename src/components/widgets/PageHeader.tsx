import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm font-medium text-ink-muted leading-none">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
