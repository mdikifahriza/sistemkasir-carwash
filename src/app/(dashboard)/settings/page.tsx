'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function SettingsPage() {
  const store = useDataStore((state) => state.store);
  const updateStore = useDataStore((state) => state.updateStore);

  const [form, setForm] = useState({
    name: store.name,
    address: store.address,
    phone: store.phone,
    email: store.email,
    taxPercentage: store.taxPercentage,
    currency: store.currency,
  });

  const handleSave = async () => {
    try {
      await updateStore({
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        taxPercentage: Number(form.taxPercentage),
        currency: form.currency,
      });
      alert('Pengaturan tersimpan');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Pengaturan" subtitle="Pengaturan toko dan pajak" />

      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Informasi Toko</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Toko"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Telepon"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Input
            label="Alamat"
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
          <Input
            label="Pajak (%)"
            type="number"
            value={form.taxPercentage}
            onChange={(event) => setForm({ ...form, taxPercentage: Number(event.target.value) })}
          />
          <Select
            label="Mata Uang"
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
          >
            <option value="IDR">Rupiah (IDR)</option>
            <option value="USD">US Dollar (USD)</option>
          </Select>
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto">Simpan Pengaturan</Button>
      </Card>
    </div>
  );
}
