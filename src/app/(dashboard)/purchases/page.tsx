'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateOnly } from '@/lib/utils/format';

export default function PurchasesPage() {
  const purchaseOrders = useDataStore((state) => state.purchaseOrders);
  const suppliers = useDataStore((state) => state.suppliers);
  const addPurchaseOrder = useDataStore((state) => state.addPurchaseOrder);
  const store = useDataStore((state) => state.store);
  const user = useCurrentUser();

  const [form, setForm] = useState({
    supplierId: suppliers[0]?.id || '',
    totalAmount: '',
    notes: '',
  });

  const handleCreate = async () => {
    const total = Number(form.totalAmount);
    if (!total) {
      alert('Total wajib diisi');
      return;
    }
    try {
      await addPurchaseOrder({
        storeId: store.id,
        supplierId: form.supplierId || null,
        poNumber: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${purchaseOrders.length + 1}`,
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDate: undefined,
        receivedDate: undefined,
        subtotal: total,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: total,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        deliveryStatus: 'pending',
        notes: form.notes,
        createdBy: user?.id || undefined,
      });
      setForm({ supplierId: suppliers[0]?.id || '', totalAmount: '', notes: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal membuat pesanan pembelian');
    }
  };

  const formatDeliveryStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'partial':
        return 'Parsial';
      case 'received':
        return 'Diterima';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Pembelian" subtitle="Buat pesanan pembelian dan terima barang" />

      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Buat Pesanan Pembelian</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Pemasok" value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          <Input label="Total Estimasi" type="number" value={form.totalAmount} onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} />
          <Input label="Catatan" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">Simpan PO</Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {purchaseOrders.map((order) => (
          <div key={order.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="text-3xl font-black">PO</div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-ink tracking-tight group-hover:text-primary transition-colors">{order.poNumber}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">{formatDateOnly(order.orderDate)}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold leading-4 tracking-wide uppercase ${order.deliveryStatus === 'received' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {formatDeliveryStatus(order.deliveryStatus)}
                </span>
              </div>

              <div className="flex flex-col gap-1 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-xs font-bold text-ink truncate">
                    {suppliers.find((s) => s.id === order.supplierId)?.name || 'Pemasok Umum'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5 opacity-70">Total Pesanan</p>
                <p className="text-lg font-black text-ink">{formatCurrency(order.totalAmount, store.currency)}</p>
              </div>
              <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-ink-muted group-hover:bg-primary group-hover:text-white transition-all cursor-pointer">
                <span className="text-[10px] font-bold">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
