'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import type { Role } from '@/lib/data/types';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatRole } from '@/lib/utils/roles';

export default function EmployeesPage() {
  const users = useDataStore((state) => state.users);
  const addUser = useDataStore((state) => state.addUser);
  const store = useDataStore((state) => state.store);
  const currentUser = useCurrentUser();

  const [form, setForm] = useState<{
    fullName: string;
    username: string;
    role: Role;
    phone: string;
    email: string;
  }>({
    fullName: '',
    username: '',
    role: 'cashier',
    phone: '',
    email: '',
  });

  const canAdd = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  const handleAdd = async () => {
    if (!canAdd) return;
    if (!form.fullName || !form.username) {
      alert('Nama dan nama pengguna wajib diisi');
      return;
    }
    try {
      await addUser({
        storeId: store.id,
        username: form.username,
        password: 'password',
        fullName: form.fullName,
        email: form.email || '',
        phone: form.phone || '',
        role: form.role,
        salary: 0,
        commissionPercentage: 0,
        isActive: true,
        lastLogin: new Date().toISOString(),
      });
      setForm({ fullName: '', username: '', role: 'cashier', phone: '', email: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menambahkan karyawan');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Karyawan" subtitle="Kelola data karyawan" />

      {canAdd ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">Tambah Karyawan</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nama Lengkap"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
            <Input
              label="Nama Pengguna"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
            />
            <Select
              label="Peran"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
            >
              <option value="owner">Pemilik</option>
              <option value="manager">Manajer</option>
              <option value="cashier">Kasir</option>
              <option value="warehouse">Gudang</option>
            </Select>
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
          </div>
          <Button onClick={handleAdd}>Simpan</Button>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {users.map((u) => (
          <div key={u.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="h-16 w-16 rounded-full bg-primary" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20">
                  {u.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-ink truncate group-hover:text-primary transition-colors">{u.fullName}</h3>
                  <p className="text-[10px] font-bold text-ink-muted leading-none mt-1">@{u.username}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">Peran</span>
                  <span className="text-primary uppercase tracking-widest">{formatRole(u.role)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-ink-muted uppercase tracking-wider">Kontak</span>
                  <span className="text-ink truncate max-w-[120px]">{u.email || u.phone || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
              <Badge variant={u.isActive ? 'success' : 'warning'} className="text-[10px] px-3 py-1 h-auto font-black uppercase tracking-tighter">
                {u.isActive ? 'Status Aktif' : 'Status Nonaktif'}
              </Badge>
              <div className="h-2 w-2 rounded-full bg-primary/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
