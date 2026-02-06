'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';

export default function CashAdvancesPage() {
  const cashAdvances = useDataStore((state) => state.cashAdvances);
  const requestCashAdvance = useDataStore((state) => state.requestCashAdvance);
  const approveCashAdvance = useDataStore((state) => state.approveCashAdvance);
  const recordCashAdvancePayment = useDataStore((state) => state.recordCashAdvancePayment);
  const users = useDataStore((state) => state.users);
  const store = useDataStore((state) => state.store);
  const currentUser = useCurrentUser();

  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [installments, setInstallments] = useState('1');

  const canRequest = currentUser?.role === 'cashier' || currentUser?.role === 'warehouse';
  const canApprove = currentUser?.role === 'owner';

  const formatStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'pending':
        return 'Menunggu';
      case 'rejected':
        return 'Ditolak';
      case 'paid':
        return 'Lunas';
      case 'partial':
        return 'Parsial';
      default:
        return status;
    }
  };

  const handleRequest = async () => {
    if (!currentUser) return;
    const amt = Number(amount);
    if (!amt) {
      alert('Nominal wajib diisi');
      return;
    }
    try {
      await requestCashAdvance({
        userId: currentUser.id,
        amount: amt,
        purpose,
        installmentCount: Number(installments) || 1,
      });
      setAmount('');
      setPurpose('');
      setInstallments('1');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal mengajukan kasbon');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Kasbon" subtitle="Pengajuan dan persetujuan kasbon" />

      {canRequest ? (
        <Card className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Ajukan Kasbon</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Jumlah Nominal" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Input label="Tujuan/Alasan" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            <Input label="Jumlah Cicilan" type="number" value={installments} onChange={(event) => setInstallments(event.target.value)} />
          </div>
          <Button onClick={handleRequest} className="w-full sm:w-auto">Kirim Pengajuan</Button>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {cashAdvances.map((item) => {
          const employee = users.find((user) => user.id === item.userId);

          return (
            <div key={item.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <div className="text-3xl font-black">CASH</div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-ink truncate group-hover:text-primary transition-colors">{employee?.fullName || 'Karyawan'}</h3>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">{item.purpose || 'Kebutuhan Pribadi'}</p>
                  </div>
                  <Badge
                    variant={item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : item.status === 'paid' ? 'success' : 'info'}
                    className="text-[10px] px-2 py-0.5 h-auto font-black uppercase tracking-tighter"
                  >
                    {formatStatus(item.status)}
                  </Badge>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-ink-muted uppercase tracking-wider">Total Kasbon</span>
                    <span className="text-ink">{formatCurrency(item.amount, store.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-ink-muted uppercase tracking-wider">Cicilan</span>
                    <span className="text-ink">{item.installmentCount}x</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-ink-muted uppercase tracking-wider">Sisa</span>
                    <span className="text-danger">{formatCurrency(item.remainingAmount, store.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                {canApprove && item.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 rounded-xl font-bold text-[10px] bg-success/10 text-success hover:bg-success hover:text-white transition-all"
                      onClick={async () => {
                        try {
                          await approveCashAdvance(item.id, currentUser!.id, 'approved');
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Gagal menyetujui');
                        }
                      }}
                    >
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 rounded-xl font-bold text-[10px] bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all"
                      onClick={async () => {
                        try {
                          await approveCashAdvance(item.id, currentUser!.id, 'rejected');
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Gagal menolak');
                        }
                      }}
                    >
                      Tolak
                    </Button>
                  </>
                )}
                {canApprove && (item.status === 'approved' || item.status === 'partial') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 rounded-xl font-bold text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={async () => {
                      try {
                        await recordCashAdvancePayment(
                          item.id,
                          item.installmentCount > 0 ? item.amount / item.installmentCount : item.amount,
                          'salary_deduction',
                          currentUser!.id
                        );
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Gagal bayar');
                      }
                    }}
                  >
                    Catat Cicilan
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
