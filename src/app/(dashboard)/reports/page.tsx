'use client';

import { useMemo } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/format';

export default function ReportsPage() {
  const store = useDataStore((state) => state.store);
  const transactions = useDataStore((state) => state.transactions);
  const expenses = useDataStore((state) => state.expenses);

  const summary = useMemo(() => {
    const completed = transactions.filter((trx) => trx.status === 'completed');
    const totalSales = completed.reduce((sum, trx) => sum + trx.totalAmount, 0);
    const totalTransactions = completed.length;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netIncome = totalSales - totalExpenses;
    return { totalSales, totalTransactions, totalExpenses, netIncome };
  }, [transactions, expenses]);

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Menunggu';
      case 'cancelled':
        return 'Dibatalkan';
      case 'refunded':
        return 'Pengembalian';
      default:
        return status;
    }
  };

  const handleExport = () => {
    const rows = [
      ['Faktur', 'Pelanggan', 'Total', 'Status'],
      ...transactions.map((trx) => [
        trx.invoiceNumber,
        trx.customerName || 'Umum',
        trx.totalAmount.toString(),
        formatStatus(trx.status),
      ]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Laporan"
        subtitle="Ringkasan laporan laba rugi"
        actions={<Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">Ekspor .CSV</Button>}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-surface-2/30">
          <p className="text-[10px] uppercase font-bold text-ink-muted">Total Penjualan</p>
          <p className="text-xl font-bold text-ink truncate">{formatCurrency(summary.totalSales, store.currency)}</p>
        </Card>
        <Card className="bg-surface-2/30">
          <p className="text-[10px] uppercase font-bold text-ink-muted">Pengeluaran</p>
          <p className="text-xl font-bold text-ink truncate">{formatCurrency(summary.totalExpenses, store.currency)}</p>
        </Card>
        <Card className="col-span-2 lg:col-span-1 bg-primary/5 border-primary/20">
          <p className="text-[10px] uppercase font-bold text-primary/80">Laba Bersih</p>
          <p className="text-xl font-bold text-primary truncate">{formatCurrency(summary.netIncome, store.currency)}</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-2/30">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] uppercase font-bold text-ink-muted bg-surface-2/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Faktur/Pelanggan</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.slice(0, 10).map((trx) => (
                <tr key={trx.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-ink">{trx.invoiceNumber}</div>
                    <div className="text-[10px] text-ink-muted">{trx.customerName || 'Umum'}</div>
                  </td>
                  <td className="px-4 py-4 font-bold text-ink">{formatCurrency(trx.totalAmount, store.currency)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold uppercase ${trx.status === 'completed' ? 'text-success' : 'text-ink-muted'}`}>
                      {formatStatus(trx.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
