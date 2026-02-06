'use client';

/**
 * Payment Modal - Complete payment flow for POS
 */

import { useState, useEffect, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useShiftStore, updateShiftSales } from '@/store/shiftStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useDataStore } from '@/store/dataStore';
import { useOfflineUsers, useOfflineCustomers } from '@/lib/hooks/useOffline';
import { db, generateUUID, Transaction, TransactionDetail, TransactionEmployee } from '@/lib/db/offlineDb';
import { saveTransactionOffline, isOnline } from '@/lib/sync/syncManager';
import { printReceipt, ReceiptData } from '@/lib/utils/print';
import { formatCurrency } from '@/lib/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Banknote,
    CreditCard,
    Smartphone,
    Building,
    Wallet,
    Printer,
    CheckCircle,
    Loader2,
    X,
    AlertCircle,
} from 'lucide-react';

// =====================================================
// PAYMENT METHODS
// =====================================================

const paymentMethods = [
    { id: 'cash', name: 'Tunai', icon: Banknote, color: 'text-green-500' },
    { id: 'qris', name: 'QRIS', icon: Smartphone, color: 'text-blue-500' },
    { id: 'card', name: 'Kartu', icon: CreditCard, color: 'text-purple-500' },
    { id: 'transfer', name: 'Transfer', icon: Building, color: 'text-orange-500' },
    { id: 'e-wallet', name: 'E-Wallet', icon: Wallet, color: 'text-cyan-500' },
];

// =====================================================
// PAYMENT MODAL
// =====================================================

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const { items, total: getTotal, subtotal, discount, tax: getTax, customerId, clear: clearCart, employeeSplits } = useCartStore();
    const { currentSession } = useShiftStore();
    const { userId } = useAuthStore();
    const { printer, app } = useSettingsStore();
    const { store } = useDataStore();

    const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
    const [showPrintPrompt, setShowPrintPrompt] = useState(false);

    // Fetch user and customer details
    const { users } = useOfflineUsers();
    const { customers } = useOfflineCustomers();

    const user = users.find(u => u.id === userId) || null;
    const customer = customerId ? customers.find(c => c.id === customerId) || null : null;

    // Calculate totals using store functions
    const taxRate = app.taxEnabled ? app.taxPercentage : 0;

    const taxAmount = useMemo(() => {
        // getTax is a function in store
        if (typeof getTax === 'function') {
            return getTax(taxRate);
        }
        return 0;
    }, [getTax, taxRate]);

    const totalAmount = useMemo(() => {
        // getTotal is a function in store
        if (typeof getTotal === 'function') {
            return getTotal(taxRate);
        }
        return 0;
    }, [getTotal, taxRate]);

    // Quick amount buttons (from settings)
    const quickAmounts = app.quickAmounts || [50000, 100000, 200000, 500000];

    // Calculate change
    const changeAmount = useMemo(() => {
        const paid = parseFloat(amountPaid) || 0;
        return Math.max(0, paid - totalAmount);
    }, [amountPaid, totalAmount]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('payment');
            setPaymentMethod(app.defaultPaymentMethod || 'cash');
            setAmountPaid('');
            setNotes('');
            setError(null);
            setCompletedTransaction(null);
            setShowPrintPrompt(false);
        }
    }, [isOpen, app.defaultPaymentMethod]);

    // Auto-fill amount for non-cash payments
    useEffect(() => {
        if (paymentMethod !== 'cash') {
            setAmountPaid(String(totalAmount));
        }
    }, [paymentMethod, totalAmount]);

    // Process payment
    const handlePayment = async () => {
        const paid = parseFloat(amountPaid) || 0;

        // Validation
        if (paymentMethod === 'cash' && paid < totalAmount) {
            setError('Jumlah pembayaran kurang');
            return;
        }

        if (!currentSession) {
            setError('Tidak ada shift aktif. Silakan buka shift terlebih dahulu.');
            return;
        }

        if (!userId) {
            setError('User tidak terautentikasi');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStep('processing');

        try {
            const now = new Date();
            const transactionId = generateUUID();

            // Generate invoice number
            const invoiceNumber = await db.generateOfflineInvoiceNumber(store?.storeCode || 'POS');

            // Create transaction
            const transaction: Transaction = {
                id: transactionId,
                store_id: store?.id || '',
                shift_session_id: currentSession.id,
                customer_id: customer?.id || null,
                invoice_number: invoiceNumber,
                customer_name: customer?.name || null,
                customer_phone: customer?.phone || null,
                transaction_date: now.toISOString(),
                subtotal: subtotal,
                discount_amount: discount,
                discount_percentage: 0,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod as any,
                amount_paid: paid,
                change_amount: changeAmount,
                notes: notes || null,
                status: 'completed',
                created_by: userId,
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
                deleted_at: null,
                deleted_by: null,
                synced: isOnline(),
                offline_id: transactionId,
            };

            // Create transaction details
            const transactionDetails: TransactionDetail[] = items.map((item) => ({
                id: generateUUID(),
                transaction_id: transactionId,
                product_id: item.productId,
                product_name: item.name,
                product_sku: item.sku,
                quantity: item.quantity,
                unit_price: item.price,
                discount_amount: 0,
                subtotal: item.subtotal,
                notes: null,
            }));

            // Create transaction employees (from splits)
            let transactionEmployees: TransactionEmployee[] = employeeSplits.map(split => ({
                id: generateUUID(),
                transaction_id: transactionId,
                user_id: split.userId,
                percentage: split.percentage,
                amount: (totalAmount * split.percentage) / 100,
                notes: null
            }));

            // Fallback if no splits defined: 100% to current user
            if (transactionEmployees.length === 0 && userId) {
                transactionEmployees = [{
                    id: generateUUID(),
                    transaction_id: transactionId,
                    user_id: userId,
                    percentage: 100,
                    amount: totalAmount,
                    notes: null
                }];
            }

            // Save transaction (will sync later if offline)
            await saveTransactionOffline(transaction, transactionDetails, transactionEmployees);

            // Update shift sales
            await updateShiftSales(currentSession.id, totalAmount, paymentMethod);

            // Update product stock in IndexedDB
            for (const item of items) {
                const product = await db.products.get(item.productId);
                if (product && product.is_trackable) {
                    await db.products.update(item.productId, {
                        stock_quantity: product.stock_quantity - item.quantity,
                    });
                }
            }

            setCompletedTransaction(transaction);
            setStep('success');
            setShowPrintPrompt(true);

        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Terjadi kesalahan saat memproses pembayaran');
            setStep('payment');
        } finally {
            setIsProcessing(false);
        }
    };

    // Print receipt
    const handlePrint = async (tx?: Transaction, details?: TransactionDetail[]) => {
        const transaction = tx || completedTransaction;
        if (!transaction) return;

        const receiptDetails = details || await db.transactionDetails
            .where('transaction_id')
            .equals(transaction.id)
            .toArray();

        const receiptData: ReceiptData = {
            storeName: store?.name || 'Toko',
            storeAddress: store?.address || undefined,
            storePhone: store?.phone || undefined,
            invoiceNumber: transaction.invoice_number,
            date: new Date(transaction.transaction_date),
            cashierName: user?.full_name || 'Kasir',
            customerName: transaction.customer_name || undefined,
            items: receiptDetails.map(d => ({
                name: d.product_name,
                quantity: d.quantity,
                price: d.unit_price,
                subtotal: d.subtotal,
                sku: d.product_sku || undefined,
            })),
            subtotal: transaction.subtotal,
            discountAmount: transaction.discount_amount,
            taxAmount: transaction.tax_amount,
            totalAmount: transaction.total_amount,
            amountPaid: transaction.amount_paid,
            changeAmount: transaction.change_amount,
            paymentMethod: transaction.payment_method,
            notes: transaction.notes || undefined,
        };

        try {
            await printReceipt(receiptData);
        } catch (err) {
            console.error('Print error:', err);
        }
    };

    // Complete and close
    const handleComplete = () => {
        clearCart();
        setShowPrintPrompt(false);
        onClose();
        onSuccess?.();
    };

    // New transaction
    const handleNewTransaction = () => {
        clearCart();
        setStep('payment');
        setCompletedTransaction(null);
        setShowPrintPrompt(false);
    };

    return (
        <Modal
            open={isOpen}
            title={
                step === 'payment' ? 'Pembayaran' :
                    step === 'processing' ? 'Memproses...' :
                        'Transaksi Berhasil'
            }
            onClose={step === 'processing' ? () => { } : onClose}
        >
            {/* Payment Step */}
            {step === 'payment' && (
                <div className="space-y-6">
                    {/* Total */}
                    <div className="text-center">
                        <p className="text-sm text-ink-muted">Total Pembayaran</p>
                        <p className="text-3xl font-bold text-primary">
                            {formatCurrency(totalAmount)}
                        </p>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <p className="mb-2 text-sm font-medium text-ink">Metode Pembayaran</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`
                      flex flex-col items-center gap-1 rounded-lg border p-3
                      transition-all
                      ${isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }
                    `}
                                    >
                                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : method.color}`} />
                                        <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-ink-muted'}`}>
                                            {method.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-ink">
                            {paymentMethod === 'cash' ? 'Jumlah Diterima' : 'Jumlah Pembayaran'}
                        </label>
                        <Input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="0"
                            className="text-xl font-semibold text-center"
                            readOnly={paymentMethod !== 'cash'}
                        />
                    </div>

                    {/* Quick Amounts (Cash only) */}
                    {paymentMethod === 'cash' && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setAmountPaid(String(totalAmount))}
                                className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                            >
                                Uang Pas
                            </button>
                            {quickAmounts
                                .filter(amount => amount >= totalAmount)
                                .slice(0, 4)
                                .map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setAmountPaid(String(amount))}
                                        className={`
                      rounded-lg border px-3 py-2 text-sm font-medium
                      transition-colors
                      ${Number(amountPaid) === amount
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border hover:border-primary'
                                            }
                    `}
                                    >
                                        {formatCurrency(amount)}
                                    </button>
                                ))}
                        </div>
                    )}

                    {/* Change Amount */}
                    {paymentMethod === 'cash' && changeAmount > 0 && (
                        <div className="rounded-lg bg-green-500/10 p-4 text-center">
                            <p className="text-sm text-green-600">Kembalian</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(changeAmount)}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-ink">
                            Catatan (Opsional)
                        </label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tambahkan catatan..."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="flex-1">
                            Batal
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={
                                isProcessing ||
                                (paymentMethod === 'cash' && (parseFloat(amountPaid) || 0) < totalAmount)
                            }
                            className="flex-1"
                        >
                            Bayar
                        </Button>
                    </div>
                </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-ink-muted">Memproses transaksi...</p>
                </div>
            )}

            {/* Success Step */}
            {step === 'success' && completedTransaction && (
                <div className="space-y-6">
                    {showPrintPrompt && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm font-semibold text-ink">Cetak struk sekarang?</p>
                            <p className="mt-1 text-xs text-ink-muted">Pilih cetak atau lewati.</p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={async () => {
                                        await handlePrint();
                                        setShowPrintPrompt(false);
                                    }}
                                >
                                    Cetak
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowPrintPrompt(false)}
                                >
                                    Tidak
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col items-center py-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-ink">Transaksi Berhasil!</h3>
                        <p className="text-sm text-ink-muted">{completedTransaction.invoice_number}</p>
                    </div>

                    <div className="rounded-lg bg-surface-2 p-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Total</span>
                                <span className="font-medium text-ink">{formatCurrency(completedTransaction.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-muted">Dibayar</span>
                                <span className="text-ink">{formatCurrency(completedTransaction.amount_paid)}</span>
                            </div>
                            {completedTransaction.change_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-ink-muted">Kembalian</span>
                                    <span className="text-green-500">{formatCurrency(completedTransaction.change_amount)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handlePrint()}
                            className="flex items-center justify-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak Struk
                        </Button>
                        <Button onClick={handleNewTransaction} className="flex items-center justify-center gap-2">
                            Transaksi Baru
                        </Button>
                    </div>

                    <Button variant="ghost" onClick={handleComplete} className="w-full">
                        Selesai
                    </Button>
                </div>
            )}
        </Modal>
    );
}
