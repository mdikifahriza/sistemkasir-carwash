import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 focus-visible:ring-primary/30',
  outline: 'border border-border text-ink hover:bg-surface-2 focus-visible:ring-primary/30',
  ghost: 'text-ink hover:bg-surface-2 focus-visible:ring-primary/30',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
