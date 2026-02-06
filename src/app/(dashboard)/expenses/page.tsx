'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { uploadMedia } from '@/lib/supabase/storage';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDateOnly } from '@/lib/utils/format';

export default function ExpensesPage() {
  const expenses = useDataStore((state) => state.expenses);
  const expenseCategories = useDataStore((state) => state.expenseCategories);
  const addExpense = useDataStore((state) => state.addExpense);
  const currentShiftId = useDataStore((state) => state.currentShiftId);
  const store = useDataStore((state) => state.store);
  const user = useCurrentUser();

  const [form, setForm] = useState({
    amount: '',
    categoryId: expenseCategories[0]?.id || '',
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleAdd = async () => {
    if (!user) return;
    const amt = Number(form.amount);
    if (!amt) {
      alert('Nominal wajib diisi');
      return;
    }
    try {
      let receiptImage = '';
      if (receiptFile) {
        const upload = await uploadMedia(receiptFile, 'expenses');
        receiptImage = upload.publicUrl;
      }

      await addExpense({
        storeId: store.id,
        shiftSessionId: currentShiftId,
        expenseCategoryId: form.categoryId || null,
        amount: amt,
        description: form.description,
        receiptImage,
        approvedBy: user.id,
        expenseDate: new Date().toISOString().slice(0, 10),
        status: 'approved',
        createdBy: user.id,
      });

      setForm({ amount: '', categoryId: expenseCategories[0]?.id || '', description: '' });
      setReceiptFile(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan pengeluaran');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Pengeluaran" subtitle="Catat pengeluaran operasional" />

      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Tambah Pengeluaran</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Nominal" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Select label="Kategori" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Input label="Deskripsi" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
        <div className="max-w-xs">
          <Input
            label="Upload Bukti"
            type="file"
            accept="image/*"
            onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
          />
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">Simpan Pengeluaran</Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="text-3xl font-black">EXPENSE</div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-ink tracking-tight group-hover:text-primary transition-colors">{formatDateOnly(expense.expenseDate)}</h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">
                    {expenseCategories.find((cat) => cat.id === expense.expenseCategoryId)?.name || 'Lainnya'}
                  </p>
                </div>
                {expense.receiptImage && (
                  <a href={expense.receiptImage} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                    <span className="text-[10px] font-bold">📄</span>
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-ink font-medium line-clamp-2 italic opacity-80">"{expense.description || 'Tidak ada deskripsi'}"</p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5 opacity-70">Nominal</p>
                <p className="text-lg font-black text-danger">{formatCurrency(expense.amount, store.currency)}</p>
              </div>
              <div className="h-6 w-6 rounded-full bg-danger/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-danger" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
