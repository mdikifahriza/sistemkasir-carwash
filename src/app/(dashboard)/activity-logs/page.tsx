'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { formatDateTime } from '@/lib/utils/format';

export default function ActivityLogsPage() {
  const logs = useDataStore((state) => state.activityLogs);
  const users = useDataStore((state) => state.users);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  const formatAction = (action: string) => {
    switch (action) {
      case 'open_shift':
        return 'Buka shift';
      case 'close_shift':
        return 'Tutup shift';
      case 'create_transaction':
        return 'Buat transaksi';
      case 'edit_transaction':
        return 'Ubah transaksi';
      case 'refund_transaction':
        return 'Pengembalian transaksi';
      case 'request_cash_advance':
        return 'Ajukan kasbon';
      case 'approve_cash_advance':
        return 'Persetujuan kasbon';
      case 'pay_cash_advance':
        return 'Pembayaran kasbon';
      case 'create_stock_opname':
        return 'Buat stock opname';
      case 'complete_stock_opname':
        return 'Selesaikan stock opname';
      case 'create_product':
        return 'Tambah produk';
      case 'update_product':
        return 'Ubah produk';
      case 'delete_product':
        return 'Hapus produk';
      case 'create_category':
        return 'Tambah kategori';
      case 'update_category':
        return 'Ubah kategori';
      case 'create_customer':
        return 'Tambah pelanggan';
      case 'update_customer':
        return 'Ubah pelanggan';
      case 'create_user':
        return 'Tambah pengguna';
      case 'update_user':
        return 'Ubah pengguna';
      case 'create_supplier':
        return 'Tambah pemasok';
      case 'create_purchase_order':
        return 'Buat pembelian';
      case 'create_expense':
        return 'Catat pengeluaran';
      case 'update_store':
        return 'Ubah pengaturan toko';
      case 'update_stock_opname_detail':
        return 'Ubah detail stock opname';
      default:
        if (action.startsWith('insert_')) return `Tambah ${action.replace('insert_', '').replace(/_/g, ' ')}`;
        if (action.startsWith('update_')) return `Ubah ${action.replace('update_', '').replace(/_/g, ' ')}`;
        if (action.startsWith('delete_')) return `Hapus ${action.replace('delete_', '').replace(/_/g, ' ')}`;
        return action.replace(/_/g, ' ');
    }
  };

  const actionOptions = useMemo(() => {
    const unique = new Set(logs.map((log) => log.action));
    return Array.from(unique).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const userMatch = selectedUser === 'all' || log.userId === selectedUser;
      const actionMatch = selectedAction === 'all' || log.action === selectedAction;
      return userMatch && actionMatch;
    });
  }, [logs, selectedUser, selectedAction]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Log Aktivitas" subtitle="Jejak audit aktivitas sistem" />

      <Card className="grid gap-4 sm:grid-cols-2">
        <Select label="User" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
          <option value="all">Semua user</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName}
            </option>
          ))}
        </Select>
        <Select label="Jenis Aktivitas" value={selectedAction} onChange={(event) => setSelectedAction(event.target.value)}>
          <option value="all">Semua aktivitas</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {formatAction(action)}
            </option>
          ))}
        </Select>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="text-3xl font-black">LOG</div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-ink tracking-tight group-hover:text-primary transition-colors">{formatAction(log.action)}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{formatDateTime(log.createdAt)}</p>
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
                  {users.find((user) => user.id === log.userId)?.fullName || 'Sistem'}
                </p>
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-[11px] text-ink-muted font-medium break-words leading-relaxed">{log.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end relative z-10">
              <div className="h-1 w-10 rounded-full bg-surface-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
