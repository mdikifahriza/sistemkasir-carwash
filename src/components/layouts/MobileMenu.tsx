'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { X, Menu } from 'lucide-react';
import { hasPermission } from '@/lib/utils/permissions';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useDataStore } from '@/store/dataStore';
import { formatRole } from '@/lib/utils/roles';

const navigation = [
  { name: 'Dasbor', href: '/dashboard' },
  { name: 'Kasir', href: '/pos', permission: 'transactions.create' },
  { name: 'Produk', href: '/products', permission: 'products.view' },
  { name: 'Inventori', href: '/inventory' },
  { name: 'Pemasok', href: '/suppliers' },
  { name: 'Pembelian', href: '/purchases' },
  { name: 'Transaksi', href: '/transactions', permission: 'transactions.view' },
  { name: 'Pelanggan', href: '/customers' },
  { name: 'Karyawan', href: '/employees', permission: 'employees.view' },
  { name: 'Kasbon', href: '/cash-advances', permission: 'cash_advances.view' },
  { name: 'Pengeluaran', href: '/expenses' },
  { name: 'Shift', href: '/shifts' },
  { name: 'Laporan', href: '/reports', permission: 'reports.view' },
  { name: 'Analitik', href: '/analytics', permission: 'reports.view' },
  { name: 'Pengaturan', href: '/settings', permission: 'settings.view' },
  { name: 'Log Aktivitas', href: '/activity-logs', permission: 'activity_logs.view' },
  { name: 'Profil', href: '/profile' },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useCurrentUser();
  const storeName = useDataStore((state) => state.store.name);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center rounded-md p-2 text-ink hover:bg-surface-3 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-surface-2 transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col px-4 py-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-muted">POS PRO</p>
              <p className="text-lg font-semibold text-ink">{storeName}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-ink-muted hover:bg-surface-3 hover:text-ink"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navigation
              .filter((item) => (item.permission ? hasPermission(user?.role, item.permission) : true))
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-ink-muted hover:bg-surface-3 hover:text-ink'
                    )}
                  >
                    <span className="mr-2 h-2 w-2 rounded-full bg-primary/70" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* User Info */}
          <div className="mt-6 rounded-lg border border-border bg-surface p-3 text-xs text-ink-muted">
            <p className="font-semibold text-ink">Masuk sebagai</p>
            <p>{user?.fullName || 'Pengguna'}</p>
            <p className="uppercase">{formatRole(user?.role)}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
