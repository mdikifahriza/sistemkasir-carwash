'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { StatCard } from '@/components/widgets/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateOnly } from '@/lib/utils/format';

function getLast7Days() {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function DashboardPage() {
  const transactions = useDataStore((state) => state.transactions);
  const transactionDetails = useDataStore((state) => state.transactionDetails);
  const customers = useDataStore((state) => state.customers);
  const products = useDataStore((state) => state.products);
  const store = useDataStore((state) => state.store);
  const shifts = useDataStore((state) => state.shiftSessions);
  const shiftDefinitions = useDataStore((state) => state.shifts);

  const metrics = useMemo(() => {
    const completed = transactions.filter((trx) => trx.status === 'completed');
    const totalSales = completed.reduce((sum, trx) => sum + trx.totalAmount, 0);
    const totalTransactions = completed.length;

    const topProducts = transactionDetails.reduce<Record<string, number>>((acc, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
      return acc;
    }, {});

    const topList = Object.entries(topProducts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const lowStock = products.filter((product) => product.stockQuantity <= product.minStock);

    const daily = getLast7Days().map((date) => {
      const dayTotal = completed
        .filter((trx) => trx.transactionDate.slice(0, 10) === date)
        .reduce((sum, trx) => sum + trx.totalAmount, 0);
      return { date, total: dayTotal };
    });

    const maxDaily = Math.max(...daily.map((item) => item.total), 1);

    return { totalSales, totalTransactions, topList, lowStock, daily, maxDaily };
  }, [transactions, transactionDetails, products]);

  const currentShift = shifts.find((shift) => shift.status === 'open');
  const formatShiftStatus = (status: string) => (status === 'open' ? 'Buka' : status === 'closed' ? 'Tutup' : status);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Dasbor"
        subtitle={`Ringkasan operasional ${store.name}`}
        actions={
          currentShift ? (
            <Badge variant="success">Shift aktif</Badge>
          ) : (
            <Badge variant="warning">Shift belum dibuka</Badge>
          )
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Penjualan" value={formatCurrency(metrics.totalSales, store.currency)} change="+12%" />
        <StatCard label="Transaksi" value={metrics.totalTransactions.toString()} change="+5%" />
        <StatCard label="Pelanggan" value={customers.length.toString()} change="+8%" />
        <StatCard label="Stok Tipis" value={metrics.lowStock.length.toString()} change="Cek" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted/70">Tren Penjualan</p>
              <h3 className="text-base font-bold text-ink md:text-lg">7 Hari Terakhir</h3>
            </div>
            <Badge variant="info" className="text-[10px] h-auto px-1.5 py-0.5">Waktu Nyata</Badge>
          </div>
          <div className="mt-8 flex h-40 items-end justify-between gap-1 sm:gap-4 px-1">
            {metrics.daily.map((item) => (
              <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative group w-full flex flex-col items-center justify-end h-32">
                  <div
                    className="w-full max-w-[30px] rounded-t-sm bg-primary/80 transition-all group-hover:bg-primary shadow-sm"
                    style={{ height: `${(item.total / metrics.maxDaily) * 100}%` }}
                  />
                  {/* Tooltip-like value (desktop only or on hover) */}
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">
                    {Math.round(item.total / 1000)}k
                  </div>
                </div>
                <span className="text-[9px] font-bold text-ink-muted uppercase">{item.date.slice(8)}/{item.date.slice(5, 7)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Produk Teratas</p>
          <h3 className="text-lg font-semibold text-ink">Produk Terlaris</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {metrics.topList.length === 0 ? (
              <li className="text-ink-muted">Belum ada transaksi.</li>
            ) : (
              metrics.topList.map((item) => (
                <li key={item.name} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <Badge variant="success">{item.qty} terjual</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Peringatan Stok Menipis</p>
          <h3 className="text-lg font-semibold text-ink">Butuh Restock</h3>
          <div className="mt-4 space-y-3 text-sm">
            {metrics.lowStock.length === 0 ? (
              <p className="text-ink-muted">Stok aman di semua kategori.</p>
            ) : (
              metrics.lowStock.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="text-xs text-ink-muted">Min: {product.minStock}</p>
                  </div>
                  <Badge variant="danger">{product.stockQuantity} tersisa</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Ringkasan Shift</p>
          <h3 className="text-lg font-semibold text-ink">Shift Hari Ini</h3>
          <div className="mt-4 space-y-2 text-sm">
            {shifts.length === 0 ? (
              <p className="text-ink-muted">Belum ada shift hari ini.</p>
            ) : (
              shifts.slice(0, 3).map((shift) => {
                const shiftName =
                  shiftDefinitions.find((item) => item.id === shift.shiftId)?.shiftName || shift.shiftId;
                return (
                  <div key={shift.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-medium text-ink">{shiftName}</p>
                      <p className="text-xs text-ink-muted">{formatDateOnly(shift.sessionDate)}</p>
                    </div>
                    <Badge variant={shift.status === 'open' ? 'success' : 'info'}>{formatShiftStatus(shift.status)}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
