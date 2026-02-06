import clsx from 'clsx';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <label className="block text-sm text-ink">
      {label ? <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span> : null}
      <select
        className={clsx(
          'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
