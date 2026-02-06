'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SuppliersPage() {
  const suppliers = useDataStore((state) => state.suppliers);
  const addSupplier = useDataStore((state) => state.addSupplier);
  const store = useDataStore((state) => state.store);

  const [form, setForm] = useState({
    supplierCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
  });

  const handleAdd = async () => {
    if (!form.name || !form.supplierCode) {
      alert('Kode dan nama pemasok wajib diisi');
      return;
    }
    try {
      await addSupplier({
        storeId: store.id,
        supplierCode: form.supplierCode,
        name: form.name,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: '',
        taxId: '',
        paymentTerms: 30,
        notes: '',
        isActive: true,
      });
      setForm({ supplierCode: '', name: '', contactPerson: '', phone: '', email: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan pemasok');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Pemasok" subtitle="Kelola data pemasok" />

      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Tambah Pemasok</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Kode" value={form.supplierCode} onChange={(event) => setForm({ ...form, supplierCode: event.target.value })} />
          <Input label="Nama" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input label="Nama Kontak" value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
          <Input label="Telepon" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Input label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">Simpan</Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="text-4xl font-black">BOX</div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center text-primary font-black text-xs border border-border/50">
                  {supplier.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-ink truncate group-hover:text-primary transition-colors">{supplier.name}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest leading-none mt-1">{supplier.supplierCode}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">PIC</span>
                  <span className="text-ink">{supplier.contactPerson || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">Hubungi</span>
                  <span className="text-ink">{supplier.phone || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-2 py-1 rounded-md">
                Pemasok Aktif
              </span>
              <div className="text-[10px] text-ink-muted font-bold truncate max-w-[100px]">{supplier.email || ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
