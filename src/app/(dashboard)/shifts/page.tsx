'use client';

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export default function ShiftsPage() {
  const shifts = useDataStore((state) => state.shifts);
  const shiftSessions = useDataStore((state) => state.shiftSessions);
  const currentShiftId = useDataStore((state) => state.currentShiftId);
  const openShift = useDataStore((state) => state.openShift);
  const closeShift = useDataStore((state) => state.closeShift);
  const store = useDataStore((state) => state.store);
  const user = useCurrentUser();

  const [selectedShift, setSelectedShift] = useState(shifts[0]?.id || '');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');

  const currentShift = shiftSessions.find((session) => session.id === currentShiftId) || null;

  const handleOpen = async () => {
    if (!user) return;
    const balance = Number(openingBalance);
    if (!selectedShift || !balance) {
      alert('Lengkapi shift dan saldo awal');
      return;
    }
    try {
      const session = await openShift(selectedShift, user.id, balance);
      if (!session) {
        alert('Masih ada shift yang aktif');
      } else {
        setOpeningBalance('');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal membuka shift');
    }
  };

  const handleClose = async () => {
    if (!currentShift) return;
    const balance = Number(closingBalance);
    if (!balance) {
      alert('Masukkan saldo aktual');
      return;
    }
    try {
      await closeShift(currentShift.id, balance, notes);
      setClosingBalance('');
      setNotes('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menutup shift');
    }
  };

  const formatStatus = (status: string) => (status === 'open' ? 'Buka' : status === 'closed' ? 'Tutup' : status);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Shift" subtitle="Buka dan tutup shift kasir" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">Buka Shift</h3>
          <Select
            label="Shift"
            value={selectedShift}
            onChange={(event) => setSelectedShift(event.target.value)}
          >
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.shiftName} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </Select>
          <Input
            label="Saldo Awal"
            type="number"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
          />
          <Button onClick={handleOpen} disabled={!!currentShift}>
            Buka Shift
          </Button>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-ink">Tutup Shift</h3>
          {currentShift ? (
            <>
              <div className="text-sm text-ink-muted">
                Total Penjualan: {formatCurrency(currentShift.totalSales, store.currency)}
              </div>
              <Input
                label="Saldo Aktual"
                type="number"
                value={closingBalance}
                onChange={(event) => setClosingBalance(event.target.value)}
              />
              <Input
                label="Catatan"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <Button variant="danger" onClick={handleClose}>
                Tutup Shift
              </Button>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Tidak ada shift aktif.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
        {shiftSessions.map((session) => (
          <div key={session.id} className="relative group bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <div className="text-3xl font-black">SHIFT</div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-ink tracking-tight">
                    {shifts.find((s) => s.id === session.shiftId)?.shiftName || 'Shift Umum'}
                  </h3>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mt-0.5">
                    {formatDateTime(session.openedAt || session.sessionDate)}
                  </p>
                </div>
                <Badge variant={session.status === 'open' ? 'success' : 'info'} className="text-[10px] px-2 py-0.5 h-auto font-black uppercase tracking-tighter">
                  {formatStatus(session.status)}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 pt-3 border-t border-border/50">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider opacity-70">Total Penjualan</span>
                <span className="text-xl font-black text-primary">{formatCurrency(session.totalSales, store.currency)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 relative z-10">
              <div className="flex-1 rounded-xl bg-surface-2 p-2 text-center border border-border/50">
                <p className="text-[9px] font-bold text-ink-muted uppercase tracking-tighter">Modal Awal</p>
                <p className="text-xs font-bold text-ink">{formatCurrency(session.openingBalance, store.currency)}</p>
              </div>
              {session.status === 'closed' && (
                <div className="flex-1 rounded-xl bg-surface-2 p-2 text-center border border-border/50">
                  <p className="text-[9px] font-bold text-ink-muted uppercase tracking-tighter">Saldo Akhir</p>
                  <p className="text-xs font-bold text-ink">{formatCurrency(session.actualClosingBalance || 0, store.currency)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
