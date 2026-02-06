import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface p-5 shadow-sm',
        className
      )}
      {...props}
    />
  );
}
