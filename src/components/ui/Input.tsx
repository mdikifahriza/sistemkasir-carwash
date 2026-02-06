import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="block text-sm text-ink w-full">
        {label ? <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span> : null}
        <input
          ref={ref}
          className={clsx(
            'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      </label>
    );
  }
);

Input.displayName = 'Input';
