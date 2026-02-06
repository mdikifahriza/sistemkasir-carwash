'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';

export default function AnalyticsPage() {
  const store = useDataStore((state) => state.store);
  const transactionDetails = useDataStore((state) => state.transactionDetails);
  const products = useDataStore((state) => state.products);

  const productStats = useMemo(() => {
    const totals = transactionDetails.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId || item.productName] = (acc[item.productId || item.productName] || 0) +
        item.subtotal;
      return acc;
    }, {});
    const list = Object.entries(totals)
      .map(([id, total]) => ({
        id,
        name: products.find((product) => product.id === id)?.name || id,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    const max = Math.max(...list.map((item) => item.total), 1);
    return { list, max };
  }, [transactionDetails, products]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Analitik" subtitle="Analisis performa produk & segmentasi" />

      <Card>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Produk Pendapatan Tertinggi</p>
        <h3 className="text-base font-bold text-ink">Kontribusi Penjualan Per Produk</h3>
        <div className="mt-8 space-y-6">
          {productStats.list.length === 0 ? (
            <p className="text-sm text-ink-muted italic">Belum ada data penjualan.</p>
          ) : (
            productStats.list.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-ink truncate max-w-[150px] sm:max-w-none">{item.name}</span>
                  <span className="font-bold text-primary">{formatCurrency(item.total, store.currency)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                    style={{ width: `${(item.total / productStats.max) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-l-success">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Analisis ABC</p>
          <div className="mt-2 space-y-2 text-xs leading-relaxed">
            <p className="font-bold text-ink">A: Kontribusi Tertinggi (Top 20%)</p>
            <p className="text-ink-muted">B: Kontribusi Sedang (Next 30%)</p>
            <p className="text-ink-muted">C: Kontribusi Rendah (Bottom 50%)</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">RFM Pelanggan</p>
          <div className="mt-2 space-y-2 text-xs leading-relaxed">
            <p className="font-bold text-ink">Juara: Sangat Loyal</p>
            <p className="text-ink-muted">Potensial: Peluang Menjadi Loyal</p>
            <p className="text-ink-muted">Beresiko: Jarang Transaksi Lagi</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
