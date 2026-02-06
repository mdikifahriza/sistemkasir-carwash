'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function CustomersPage() {
  const customers = useDataStore((state) => state.customers);
  const addCustomer = useDataStore((state) => state.addCustomer);
  const store = useDataStore((state) => state.store);

  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const handleAdd = async () => {
    if (!form.name) {
      alert('Nama pelanggan wajib diisi');
      return;
    }
    try {
      await addCustomer({
        storeId: store.id,
        customerCode: `CUST-${customers.length + 1}`,
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: '',
        loyaltyPoints: 0,
        totalSpent: 0,
        totalTransactions: 0,
        isMember: false,
        notes: '',
        isActive: true,
      });
      setForm({ name: '', phone: '', email: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan pelanggan');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Pelanggan" subtitle="Kelola pelanggan dan loyalitas" />

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-ink">Tambah Pelanggan</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input label="Telepon" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Input label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <Button onClick={handleAdd}>Simpan</Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {customers.map((customer) => (
          <div key={customer.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="h-16 w-16 rounded-full bg-primary" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center text-primary font-black text-sm border border-border/50">
                  {customer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-ink truncate group-hover:text-primary transition-colors">{customer.name}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest leading-none mt-1">{customer.customerCode}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">Telepon</span>
                  <span className="text-ink">{customer.phone || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">Email</span>
                  <span className="text-ink truncate max-w-[120px]">{customer.email || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
              <Badge variant={customer.isMember ? 'success' : 'info'} className="text-[10px] px-3 py-1 h-auto font-black uppercase tracking-tighter">
                {customer.isMember ? 'Member VIP' : 'Pelanggan Umum'}
              </Badge>
              <div className="h-2 w-2 rounded-full bg-primary/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
