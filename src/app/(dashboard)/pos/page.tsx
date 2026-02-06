'use client';

import { useEffect, useState } from 'react';
import { useShiftStore } from '@/store/shiftStore';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { EmployeeSplit } from '@/components/pos/EmployeeSplit';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertCircle, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';

export default function POSPage() {
  const { currentSession, isInitialized, refreshShift } = useShiftStore();
  const { userId } = useAuthStore();
  const { items, clear: clearCart, total: totalFn } = useCartStore();
  const { app } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [isSplitOpen, setSplitOpen] = useState(false);
  const taxRate = app.taxEnabled ? app.taxPercentage : 0;
  const cartTotal = totalFn(taxRate);

  // Initialize shift store
  useEffect(() => {
    if (userId) {
      refreshShift(userId);
    }
  }, [userId, refreshShift]);

  // Show loading only if not initialized AND no current session (to avoid flicker if we have cached data?)
  // Actually shiftStore default isInitialized=false. So we must wait.
  if (!isInitialized) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-ink-muted">Memuat data shift...</p>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4 p-4 text-center">
        <div className="rounded-full bg-yellow-100 p-4 text-yellow-600">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Shift Belum Dibuka</h2>
        <p className="max-w-md text-ink-muted">
          Anda perlu membuka shift baru sebelum dapat melakukan transaksi penjualan.
        </p>
        <Link href="/shifts">
          <Button variant="primary">Buka Shift Sekarang</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-surface-2 md:flex-row h-[calc(100svh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.16))] pb-[env(safe-area-inset-bottom)]">

      {/* Left Column: Product Grid */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${activeTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex-1 overflow-hidden">
          <ProductGrid className="h-full" />
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className={`w-full md:w-[400px] h-full flex-shrink-0 flex flex-col min-h-0 border-border md:border-l bg-surface ${activeTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile Header for Cart - Keep this as it has the back button */}
        <div className="md:hidden flex items-center p-3 border-b border-border bg-surface sticky top-0 z-20">
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('products')} className="mr-2 h-9 w-9 p-0">
            ←
          </Button>
          <h1 className="font-bold text-base">Keranjang</h1>
          <div className="ml-auto text-xs font-bold text-ink-muted">
            {items.length} Item
          </div>
          {items.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="ml-2 h-9 w-9 p-0 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <Cart
          className="flex-1 overflow-hidden"
          onPayment={() => setPaymentOpen(true)}
          onEmployeeSplit={() => setSplitOpen(true)}
        />
      </div>

      {/* Mobile Mini Cart Bar */}
      {activeTab === 'products' && items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            onClick={() => setActiveTab('cart')}
            className="mx-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-primary px-4 py-3 text-left text-white shadow-xl shadow-primary/30"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ShoppingCart className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-white/80">{items.length} Item</p>
                <p className="text-base font-bold">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold">Lihat</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => {
          setPaymentOpen(false);
          // Optionally ask to print or new transaction handled in modal
        }}
      />

      <EmployeeSplit
        isOpen={isSplitOpen}
        onClose={() => setSplitOpen(false)}
      />
    </div>
  );
}
