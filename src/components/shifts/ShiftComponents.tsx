'use client';

/**
 * Shift Management Components
 */

import { useState, useEffect } from 'react';
import { useShiftStore } from '@/store/shiftStore';
import { useAuthStore } from '@/store/authStore';
import { useOfflineShifts } from '@/lib/hooks/useOffline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/format';
import {
    Clock,
    DollarSign,
    ChevronRight,
    Calculator,
    Loader2,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

// =====================================================
// SHIFT STATUS CARD
// =====================================================

export function ShiftStatusCard() {
    const { currentSession, currentShift, isShiftOpen } = useShiftStore();
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    if (!isShiftOpen) {
        return (
            <>
                <button
                    onClick={() => setShowOpenModal(true)}
                    className="flex w-full items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 transition-colors hover:bg-yellow-500/20"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                        <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-medium text-yellow-500">Shift Belum Dibuka</p>
                        <p className="text-sm text-yellow-500/70">Klik untuk membuka shift</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-yellow-500" />
                </button>

                <ShiftOpenModal
                    open={showOpenModal}
                    onClose={() => setShowOpenModal(false)}
                />
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowCloseModal(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 transition-colors hover:bg-green-500/20"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1 text-left">
                    <p className="font-medium text-green-500">{currentShift?.shift_name || 'Shift Aktif'}</p>
                    <p className="text-sm text-green-500/70">
                        Penjualan: {formatCurrency(currentSession?.total_sales || 0)}
                    </p>
                </div>
                <ChevronRight className="h-5 w-5 text-green-500" />
            </button>

            <ShiftCloseModal
                open={showCloseModal}
                onClose={() => setShowCloseModal(false)}
            />
        </>
    );
}

// =====================================================
// SHIFT OPEN MODAL
// =====================================================

interface ShiftOpenModalProps {
    open: boolean;
    onClose: () => void;
}

export function ShiftOpenModal({ open, onClose }: ShiftOpenModalProps) {
    const { openShift, isLoading, error } = useShiftStore();
    const { userId } = useAuthStore();
    const { shifts, isLoading: shiftsLoading } = useOfflineShifts();

    const [selectedShift, setSelectedShift] = useState<string>('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [step, setStep] = useState<'select' | 'balance'>('select');

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setSelectedShift('');
            setOpeningBalance('');
            setStep('select');
        }
    }, [open]);

    const handleSelectShift = (shiftId: string) => {
        setSelectedShift(shiftId);
        setStep('balance');
    };

    const handleOpenShift = async () => {
        if (!selectedShift || !userId) return;

        const balance = parseFloat(openingBalance) || 0;

        try {
            await openShift(selectedShift, balance, userId);
            onClose();
        } catch (err) {
            // Error is displayed in modal
        }
    };

    const quickAmounts = [0, 100000, 200000, 300000, 500000];

    return (
        <Modal open={open} title="Buka Shift" onClose={onClose}>
            <div className="space-y-6">
                {step === 'select' && (
                    <>
                        <p className="text-sm text-ink-muted">Pilih shift untuk hari ini:</p>

                        {shiftsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : shifts.length === 0 ? (
                            <div className="py-8 text-center">
                                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                                <p className="mt-2 text-sm text-ink-muted">
                                    Tidak ada shift yang tersedia
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {shifts.map((shift) => (
                                    <button
                                        key={shift.id}
                                        onClick={() => handleSelectShift(shift.id)}
                                        className={`
                      flex w-full items-center gap-3 rounded-lg border p-4
                      transition-colors hover:border-primary
                      ${selectedShift === shift.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border'
                                            }
                    `}
                                    >
                                        <div
                                            className="h-4 w-4 rounded-full"
                                            style={{ backgroundColor: shift.color_code || '#3B82F6' }}
                                        />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-ink">{shift.shift_name}</p>
                                            <p className="text-sm text-ink-muted">
                                                {shift.start_time} - {shift.end_time}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-ink-muted" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {step === 'balance' && (
                    <>
                        <button
                            onClick={() => setStep('select')}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            ← Kembali
                        </button>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-ink">
                                    Saldo Awal (Cash di Laci)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
                                    <Input
                                        type="number"
                                        value={openingBalance}
                                        onChange={(e) => setOpeningBalance(e.target.value)}
                                        placeholder="0"
                                        className="pl-10 text-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setOpeningBalance(String(amount))}
                                        className={`
                      rounded-lg border px-3 py-2 text-sm font-medium
                      transition-colors
                      ${Number(openingBalance) === amount
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary'
                                            }
                    `}
                                    >
                                        {formatCurrency(amount)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleOpenShift}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Buka Shift'
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

// =====================================================
// SHIFT CLOSE MODAL
// =====================================================

interface ShiftCloseModalProps {
    open: boolean;
    onClose: () => void;
}

export function ShiftCloseModal({ open, onClose }: ShiftCloseModalProps) {
    const { currentSession, currentShift, closeShift, isLoading, error } = useShiftStore();
    const [actualBalance, setActualBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [showCalculator, setShowCalculator] = useState(false);

    // Calculate expected balance
    const expectedBalance =
        (currentSession?.opening_balance || 0) +
        (currentSession?.total_cash || 0) -
        (currentSession?.total_expenses || 0);

    const actualBalanceNum = parseFloat(actualBalance) || 0;
    const discrepancy = actualBalanceNum - expectedBalance;

    const handleCloseShift = async () => {
        try {
            await closeShift(actualBalanceNum, notes || undefined);
            onClose();
        } catch (err) {
            // Error is displayed in modal
        }
    };

    return (
        <Modal open={open} title="Tutup Shift" onClose={onClose}>
            <div className="space-y-6">
                {/* Shift Summary */}
                <div className="rounded-lg bg-surface-2 p-4">
                    <h4 className="mb-3 font-medium text-ink">{currentShift?.shift_name}</h4>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Saldo Awal</span>
                            <span className="text-ink">{formatCurrency(currentSession?.opening_balance || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Total Transaksi</span>
                            <span className="text-ink">{currentSession?.total_transactions || 0} transaksi</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Penjualan Tunai</span>
                            <span className="text-green-500">+{formatCurrency(currentSession?.total_cash || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Penjualan Non-Tunai</span>
                            <span className="text-ink">{formatCurrency(currentSession?.total_cashless || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-muted">Pengeluaran</span>
                            <span className="text-red-500">-{formatCurrency(currentSession?.total_expenses || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                            <span className="font-medium text-ink">Saldo yang Diharapkan</span>
                            <span className="font-medium text-primary">{formatCurrency(expectedBalance)}</span>
                        </div>
                    </div>
                </div>

                {/* Cash Count */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-ink">
                            Jumlah Uang di Laci
                        </label>
                        <button
                            onClick={() => setShowCalculator(!showCalculator)}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            <Calculator className="h-4 w-4" />
                            Kalkulator
                        </button>
                    </div>

                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
                        <Input
                            type="number"
                            value={actualBalance}
                            onChange={(e) => setActualBalance(e.target.value)}
                            placeholder="0"
                            className="pl-10 text-lg"
                        />
                    </div>
                </div>

                {/* Cash Calculator */}
                {showCalculator && (
                    <CashCountCalculator
                        onCalculate={(total) => {
                            setActualBalance(String(total));
                            setShowCalculator(false);
                        }}
                    />
                )}

                {/* Discrepancy Warning */}
                {actualBalance && discrepancy !== 0 && (
                    <div className={`rounded-lg p-3 ${discrepancy < 0
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        <p className="text-sm font-medium">
                            Selisih: {formatCurrency(Math.abs(discrepancy))}
                            ({discrepancy > 0 ? 'lebih' : 'kurang'})
                        </p>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-ink">
                        Catatan (Opsional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tambahkan catatan..."
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                        rows={3}
                    />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleCloseShift}
                        disabled={isLoading || !actualBalance}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Tutup Shift'
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// =====================================================
// CASH COUNT CALCULATOR
// =====================================================

interface CashCountCalculatorProps {
    onCalculate: (total: number) => void;
}

const denominations = [
    { label: '100.000', value: 100000 },
    { label: '50.000', value: 50000 },
    { label: '20.000', value: 20000 },
    { label: '10.000', value: 10000 },
    { label: '5.000', value: 5000 },
    { label: '2.000', value: 2000 },
    { label: '1.000', value: 1000 },
    { label: '500', value: 500 },
    { label: '200', value: 200 },
    { label: '100', value: 100 },
];

function CashCountCalculator({ onCalculate }: CashCountCalculatorProps) {
    const [counts, setCounts] = useState<Record<number, number>>({});

    const updateCount = (value: number, count: string) => {
        setCounts(prev => ({
            ...prev,
            [value]: parseInt(count) || 0,
        }));
    };

    const total = denominations.reduce((sum, denom) => {
        return sum + (counts[denom.value] || 0) * denom.value;
    }, 0);

    return (
        <div className="rounded-lg border border-border p-4">
            <h5 className="mb-3 font-medium text-ink">Hitung Uang</h5>

            <div className="grid grid-cols-2 gap-2">
                {denominations.map((denom) => (
                    <div key={denom.value} className="flex items-center gap-2">
                        <span className="w-16 text-sm text-ink-muted">{denom.label}</span>
                        <span className="text-ink-muted">x</span>
                        <Input
                            type="number"
                            value={counts[denom.value] || ''}
                            onChange={(e) => updateCount(denom.value, e.target.value)}
                            className="w-16 text-center"
                            min="0"
                        />
                        <span className="flex-1 text-right text-sm text-ink">
                            {formatCurrency((counts[denom.value] || 0) * denom.value)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="font-medium text-ink">Total:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>

            <Button onClick={() => onCalculate(total)} className="mt-3 w-full">
                Gunakan Total Ini
            </Button>
        </div>
    );
}

// =====================================================
// SHIFT SUMMARY WIDGET
// =====================================================

export function ShiftSummaryWidget() {
    const { currentSession, isShiftOpen } = useShiftStore();

    if (!isShiftOpen || !currentSession) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-ink-muted">Transaksi</p>
                <p className="text-lg font-semibold text-ink">
                    {currentSession.total_transactions}
                </p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-ink-muted">Total Penjualan</p>
                <p className="text-lg font-semibold text-green-500">
                    {formatCurrency(currentSession.total_sales)}
                </p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-ink-muted">Tunai</p>
                <p className="text-lg font-semibold text-ink">
                    {formatCurrency(currentSession.total_cash)}
                </p>
            </div>
            <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-ink-muted">Non-Tunai</p>
                <p className="text-lg font-semibold text-ink">
                    {formatCurrency(currentSession.total_cashless)}
                </p>
            </div>
        </div>
    );
}
