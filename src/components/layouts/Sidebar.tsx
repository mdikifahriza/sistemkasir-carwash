'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { X, Sun, Moon, LogOut } from 'lucide-react';
import { hasPermission } from '@/lib/utils/permissions';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useDataStore } from '@/store/dataStore';
import { formatRole } from '@/lib/utils/roles';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

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

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const storeName = useDataStore((state) => state.store.name);
  const { isSidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore();
  const logout = useAuthStore((state) => state.logout);

  return (
    <>
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-[101] w-72 transform flex-col border-r border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out flex',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2/50">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">POS PRO SYSTEM</p>
            <p className="text-lg font-black text-ink tracking-tight truncate max-w-[150px]">{storeName}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-3 transition-colors text-ink-muted"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-3 transition-colors text-ink-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          {navigation
            .filter((item) => (item.permission ? hasPermission(user?.role, item.permission) : true))
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200',
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                  )}
                >
                  <span className={clsx(
                    "mr-3 h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-150",
                    active ? "bg-white" : "bg-primary/40"
                  )} />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-border bg-surface-2/30 space-y-3">
          <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm items-center flex gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-primary" />
            </div>
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold relative z-10 border border-primary/20">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 relative z-10">
              <p className="font-bold text-ink truncate text-sm leading-none mb-1">{user?.fullName || 'Pengguna'}</p>
              <p className="text-[10px] font-bold uppercase text-ink-muted tracking-wide">{formatRole(user?.role)}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              setSidebarOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger/10 p-3 text-xs font-black text-danger hover:bg-danger hover:text-white transition-all duration-300"
          >
            <LogOut size={16} />
            KELUAR SISTEM
          </button>
        </div>
      </aside>
    </>
  );
}
