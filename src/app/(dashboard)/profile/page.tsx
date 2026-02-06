'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatRole } from '@/lib/utils/roles';

export default function ProfilePage() {
  const user = useCurrentUser();
  const updateUser = useDataStore((state) => state.updateUser);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  if (!user) {
    return <div className="text-sm text-ink-muted">User tidak ditemukan.</div>;
  }

  const handleSave = async () => {
    try {
      await updateUser(user.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
      });
      alert('Profil tersimpan');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan profil');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Profil Saya" subtitle="Kelola data pribadi dan informasi akun" />

      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Informasi Akun</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Lengkap"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
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
          <Input label="Peran Akun" value={formatRole(user.role)} disabled className="bg-surface-2 opacity-70" />
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto">Simpan Profil</Button>
      </Card>
    </div>
  );
}
