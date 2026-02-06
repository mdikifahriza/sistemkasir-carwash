'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export function Modal({
  open,
  isOpen,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const visible = open ?? isOpen ?? false;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <div
        className={`w-full ${sizeClasses[size]} max-h-[90svh] overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl sm:rounded-xl sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-6 flex items-center justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
