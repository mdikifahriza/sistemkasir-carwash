'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { printReceipt, type ReceiptData } from '@/lib/utils/print';

export default function TransactionsPage() {
  const store = useDataStore((state) => state.store);
  const transactions = useDataStore((state) => state.transactions);
  const details = useDataStore((state) => state.transactionDetails);
  const users = useDataStore((state) => state.users);
  const editTransaction = useDataStore((state) => state.editTransaction);
  const refundTransaction = useDataStore((state) => state.refundTransaction);

  const user = useCurrentUser();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState<Array<{ productId: string; name: string; sku: string; price: number; quantity: number }>>([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editReason, setEditReason] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const selected = transactions.find((trx) => trx.id === selectedId) || null;
  const selectedDetails = details.filter((item) => item.transactionId === selectedId);
  const receiptTransaction = transactions.find((trx) => trx.id === receiptId) || null;
  const receiptDetails = details.filter((item) => item.transactionId === receiptId);

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

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'card':
        return 'Kartu';
      case 'qris':
        return 'QRIS';
      case 'transfer':
        return 'Transfer';
      case 'e-wallet':
        return 'Dompet Digital';
      case 'split':
        return 'Split';
      default:
        return method;
    }
  };

  const subtotal = useMemo(
    () => editItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [editItems]
  );

  const openDetail = (id: string) => {
    setSelectedId(id);
    const trx = transactions.find((item) => item.id === id);
    if (trx) {
      setEditDiscount(trx.discountAmount);
      setEditItems(
        details
          .filter((item) => item.transactionId === id)
          .map((item) => ({
            productId: item.productId || '',
            name: item.productName,
            sku: item.productSku || '',
            price: item.unitPrice,
            quantity: item.quantity,
          }))
      );
    }
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedId) return;
    if (!editReason) {
      alert('Alasan edit wajib diisi.');
      return;
    }
    try {
      await editTransaction(selectedId, {
        items: editItems,
        discountAmount: editDiscount,
        paymentMethod: selected?.paymentMethod || 'cash',
        amountPaid: selected?.amountPaid || subtotal,
        notes: selected?.notes || '',
        reason: editReason,
      });
      setEditMode(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengubah transaksi');
    }
  };

  const handleRefund = async () => {
    if (!selectedId) return;
    const reason = prompt('Masukkan alasan refund');
    if (!reason) return;
    try {
      await refundTransaction(selectedId, reason);
      setSelectedId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal melakukan refund');
    }
  };

  const buildReceiptData = (trx: typeof transactions[number]): ReceiptData => {
    const cashier = users.find((item) => item.id === trx.createdBy);
    const trxDetails = details.filter((item) => item.transactionId === trx.id);
    return {
      storeName: store.name || 'Toko',
      storeAddress: store.address || undefined,
      storePhone: store.phone || undefined,
      invoiceNumber: trx.invoiceNumber,
      date: new Date(trx.transactionDate),
      cashierName: cashier?.fullName || 'Kasir',
      customerName: trx.customerName || undefined,
      items: trxDetails.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        subtotal: item.subtotal,
        sku: item.productSku || undefined,
      })),
      subtotal: trx.subtotal,
      discountAmount: trx.discountAmount,
      taxAmount: trx.taxAmount,
      totalAmount: trx.totalAmount,
      amountPaid: trx.amountPaid,
      changeAmount: trx.changeAmount,
      paymentMethod: trx.paymentMethod,
      notes: trx.notes || undefined,
    };
  };

  const handlePrintReceipt = async (trx: typeof transactions[number]) => {
    try {
      const data = buildReceiptData(trx);
      await printReceipt(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mencetak nota');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Transaksi" subtitle="Monitor transaksi & detail pembayaran" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {transactions.map((trx) => (
          <div key={trx.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <div className="text-4xl font-black">#</div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-ink tracking-tight group-hover:text-primary transition-colors">{trx.invoiceNumber}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">{formatDateTime(trx.transactionDate)}</p>
                </div>
                <Badge variant={trx.status === 'completed' ? 'success' : trx.status === 'refunded' ? 'warning' : 'info'} className="text-[10px] px-2 py-0.5 h-auto font-black uppercase tracking-tighter">
                  {formatStatus(trx.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-ink-muted text-[10px] font-bold">
                  {trx.customerName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate">{trx.customerName || 'Pelanggan Umum'}</p>
                  <p className="text-[10px] text-ink-muted font-medium uppercase tracking-tighter">Pembeli</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5 opacity-70">Total Bayar</p>
                <p className="text-lg font-black text-ink">{formatCurrency(trx.totalAmount, store.currency)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => openDetail(trx.id)} className="h-9 px-4 rounded-xl font-bold text-xs bg-surface-2 hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                Buka Detail
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!selected}
        title={`Detail ${selected?.invoiceNumber || ''}`}
        onClose={() => setSelectedId(null)}
        footer={
          selected ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setReceiptId(selected.id);
                  setSelectedId(null);
                }}
              >
                Lihat Nota
              </Button>
              {user?.role === 'owner' ? (
                <Button variant="outline" onClick={() => setEditMode((prev) => !prev)}>
                  {editMode ? 'Batalkan Ubah' : 'Ubah'}
                </Button>
              ) : null}
              {user?.role === 'owner' || user?.role === 'manager' ? (
                <Button variant="danger" onClick={handleRefund}>
                  Pengembalian
                </Button>
              ) : null}
              {editMode ? <Button onClick={handleSaveEdit}>Simpan</Button> : null}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <p className="text-xs uppercase text-ink-muted">Pelanggan</p>
                <p className="text-sm font-semibold text-ink">{selected.customerName || 'Umum'}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase text-ink-muted">Metode</p>
                <p className="text-sm font-semibold text-ink">{formatPaymentMethod(selected.paymentMethod)}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase text-ink-muted">Total</p>
                <p className="text-sm font-semibold text-ink">{formatCurrency(selected.totalAmount, store.currency)}</p>
              </Card>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2">Produk</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {editMode
                    ? editItems.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-t border-border">
                        <td className="py-2">{item.name}</td>
                        <td>
                          <Input
                            type="number"
                            className="w-20"
                            value={editItems[index].quantity}
                            onChange={(event) => {
                              const next = [...editItems];
                              next[index] = {
                                ...next[index],
                                quantity: Number(event.target.value),
                              };
                              setEditItems(next);
                            }}
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            className="w-24"
                            value={editItems[index].price}
                            onChange={(event) => {
                              const next = [...editItems];
                              next[index] = {
                                ...next[index],
                                price: Number(event.target.value),
                              };
                              setEditItems(next);
                            }}
                          />
                        </td>
                        <td>{formatCurrency(item.price * item.quantity, store.currency)}</td>
                      </tr>
                    ))
                    : selectedDetails.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2">{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice, store.currency)}</td>
                        <td>{formatCurrency(item.unitPrice * item.quantity, store.currency)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {editMode ? (
              <div className="space-y-3">
                <Input
                  label="Diskon"
                  type="number"
                  value={editDiscount}
                  onChange={(event) => setEditDiscount(Number(event.target.value))}
                />
                <Input
                  label="Alasan Perubahan"
                  value={editReason}
                  onChange={(event) => setEditReason(event.target.value)}
                />
                <div className="text-sm text-ink-muted">Subtotal: {formatCurrency(subtotal, store.currency)}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!receiptTransaction}
        title={`Nota ${receiptTransaction?.invoiceNumber || ''}`}
        onClose={() => setReceiptId(null)}
        footer={
          receiptTransaction ? (
            <Button onClick={() => handlePrintReceipt(receiptTransaction)}>
              Cetak Nota
            </Button>
          ) : null
        }
        size="sm"
      >
        {receiptTransaction ? (
          <div className="space-y-4 text-sm">
            <div className="text-center space-y-1">
              <p className="text-base font-bold text-ink">{store.name || 'Toko'}</p>
              {store.address ? <p className="text-xs text-ink-muted">{store.address}</p> : null}
              {store.phone ? <p className="text-xs text-ink-muted">Telp: {store.phone}</p> : null}
            </div>

            <div className="text-xs text-ink-muted space-y-1">
              <div className="flex justify-between">
                <span>No</span>
                <span className="text-ink">{receiptTransaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tgl</span>
                <span className="text-ink">{formatDateTime(receiptTransaction.transactionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span className="text-ink">
                  {users.find((item) => item.id === receiptTransaction.createdBy)?.fullName || 'Kasir'}
                </span>
              </div>
              {receiptTransaction.customerName ? (
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span className="text-ink">{receiptTransaction.customerName}</span>
                </div>
              ) : null}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              {receiptDetails.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink font-medium">{item.productName}</span>
                    <span className="text-ink font-medium">{formatCurrency(item.subtotal, store.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>
                      {item.quantity} x {formatCurrency(item.unitPrice, store.currency)}
                    </span>
                    {item.productSku ? <span>{item.productSku}</span> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-1 text-xs text-ink-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-ink">{formatCurrency(receiptTransaction.subtotal, store.currency)}</span>
              </div>
              {receiptTransaction.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span className="text-ink">-{formatCurrency(receiptTransaction.discountAmount, store.currency)}</span>
                </div>
              ) : null}
              {receiptTransaction.taxAmount > 0 ? (
                <div className="flex justify-between">
                  <span>Pajak</span>
                  <span className="text-ink">{formatCurrency(receiptTransaction.taxAmount, store.currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-semibold text-ink pt-2">
                <span>Total</span>
                <span>{formatCurrency(receiptTransaction.totalAmount, store.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar ({formatPaymentMethod(receiptTransaction.paymentMethod)})</span>
                <span className="text-ink">{formatCurrency(receiptTransaction.amountPaid, store.currency)}</span>
              </div>
              {receiptTransaction.paymentMethod === 'cash' && receiptTransaction.changeAmount > 0 ? (
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span className="text-ink">{formatCurrency(receiptTransaction.changeAmount, store.currency)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
