'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { useAuthStore } from '@/store/authStore';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useDataStore } from '@/store/dataStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeId = useAuthStore((state) => state.storeId);
  const loginId = useAuthStore((state) => state.loginId);
  const isReady = useDataStore((state) => state.isReady);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const bootstrap = useDataStore((state) => state.bootstrap);
  const [showPreviewNotice, setShowPreviewNotice] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated && !isReady && !isLoading) {
      bootstrap({ storeId });
    }
  }, [hydrated, isAuthenticated, isReady, isLoading, bootstrap, storeId]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !loginId) return;
    if (typeof window === 'undefined') return;
    const lastSeen = window.sessionStorage.getItem('preview_notice_login_id');
    if (lastSeen !== loginId) {
      setShowPreviewNotice(true);
    }
  }, [hydrated, isAuthenticated, loginId]);

  if (!hydrated) {
    return <div className="min-h-screen bg-app" />;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-app" />;
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="rounded-xl border border-border bg-surface px-6 py-4 text-sm text-ink-muted">
          {error ? `Gagal memuat data: ${error}` : 'Memuat data...'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Modal
        open={showPreviewNotice}
        title="Pemberitahuan"
        onClose={() => {
          if (typeof window !== 'undefined' && loginId) {
            window.sessionStorage.setItem('preview_notice_login_id', loginId);
          }
          setShowPreviewNotice(false);
        }}
        footer={
          <Button
            onClick={() => {
              if (typeof window !== 'undefined' && loginId) {
                window.sessionStorage.setItem('preview_notice_login_id', loginId);
              }
              setShowPreviewNotice(false);
            }}
          >
            Mengerti
          </Button>
        }
        size="sm"
      >
        <p className="text-sm text-ink-muted">
          Sistem ini belum sempurna dan saat ini hanya berfungsi sebagai preview. Mohon digunakan
          untuk uji coba, bukan transaksi produksi.
        </p>
      </Modal>
    </div>
  );
}
