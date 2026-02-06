'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useOfflineCustomers } from '@/lib/hooks/useOffline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Plus, Minus, Users, Wallet, CreditCard, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface CartProps {
    className?: string;
    onPayment: () => void;
    onEmployeeSplit: () => void;
}

export function Cart({ className, onPayment, onEmployeeSplit }: CartProps) {
    const {
        items,
        subtotal,
        discount,
        tax: taxFn,
        total: totalFn,
        customerId,
        removeItem,
        updateQuantity,
        setDiscount,
        setCustomer,
        clear: clearCart,
        employeeSplits
    } = useCartStore();

    const { app } = useSettingsStore();
    const { customers, isLoading: customersLoading } = useOfflineCustomers({ limit: 300 });
    const taxRate = app.taxEnabled ? app.taxPercentage : 0;

    const [isCustomerOpen, setCustomerOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const footerRef = useRef<HTMLDivElement>(null);
    const [footerHeight, setFooterHeight] = useState(0);

    const selectedCustomer = customers.find((customer) => customer.id === customerId) || null;
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const query = customerSearch.toLowerCase();
        return customers.filter((customer) =>
            customer.name.toLowerCase().includes(query) ||
            customer.customer_code.toLowerCase().includes(query) ||
            (customer.phone && customer.phone.includes(customerSearch))
        );
    }, [customers, customerSearch]);

    // Calculate values
    const tax = taxFn(taxRate);
    const total = totalFn(taxRate);

    const handleQuantityChange = (productId: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (newQty > 0) {
            updateQuantity(productId, newQty);
        }
    };

    const handleSelectCustomer = (id: string | null) => {
        setCustomer(id);
        setCustomerOpen(false);
        setCustomerSearch('');
    };

    useEffect(() => {
        const footer = footerRef.current;
        if (!footer) return;

        const updateHeight = () => {
            setFooterHeight(footer.offsetHeight || 0);
        };

        updateHeight();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateHeight);
            return () => window.removeEventListener('resize', updateHeight);
        }

        const observer = new ResizeObserver(updateHeight);
        observer.observe(footer);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            className={`flex flex-col h-full min-h-0 bg-surface md:border-l border-border ${className || ''}`}
            style={{ '--cart-footer-height': `${footerHeight}px` } as CSSProperties}
        >
            {/* Header (Desktop Only) */}
            <div className="hidden md:flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-bold text-lg">Keranjang</h2>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-red-500 hover:bg-red-50"
                        disabled={items.length === 0}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Items List */}
            <div className="custom-scrollbar cart-scroll-area flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-ink-muted">
                        <Wallet className="h-12 w-12 opacity-20 mb-2" />
                        <p>Keranjang kosong</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium text-ink">{item.name}</p>
                                    <p className="text-xs text-ink-muted">{item.sku}</p>
                                </div>
                                <p className="font-bold text-ink">{formatCurrency(item.subtotal)}</p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3 bg-surface rounded-md border border-border p-1">
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity, -1)}
                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface-2"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity, 1)}
                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface-2"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>

                                {/* Per-item discount could go here later */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.productId)}
                                    className="text-red-500 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Summary */}
            <div
                ref={footerRef}
                className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-2 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] space-y-3 shadow-[0_-12px_20px_-16px_rgba(15,23,42,0.35)] md:static md:z-auto md:p-4 md:pb-[calc(env(safe-area-inset-bottom)+1rem)] md:space-y-4 md:shadow-none"
            >
                {/* Actions Row */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs justify-start"
                        onClick={() => setCustomerOpen(true)}
                    >
                        <User className="mr-2 h-3 w-3" />
                        <span className="truncate">
                            {selectedCustomer ? selectedCustomer.name : 'Pelanggan'}
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={onEmployeeSplit}
                    >
                        <Users className="mr-2 h-3 w-3" />
                        {employeeSplits.length > 1 ? `${employeeSplits.length} Karyawan` : 'Split Komisi'}
                    </Button>
                </div>

                <div className="space-y-1.5 pt-1 text-xs md:space-y-2 md:pt-2 md:text-sm">
                    <div className="flex justify-between text-ink-muted">
                        <span>Subtotal</span>
                        <span className="text-ink font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-ink-muted">
                        <span>Diskon (Rp)</span>
                        <div className="w-20 md:w-24">
                            <Input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="h-7 text-right text-xs md:text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                        <span>Pajak ({taxRate}%)</span>
                        <span className="text-ink font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="font-bold text-sm md:text-lg text-ink">Total</span>
                        <span className="font-bold text-lg md:text-xl text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 md:h-12 md:text-lg"
                    disabled={items.length === 0}
                    onClick={onPayment}
                >
                    <CreditCard className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Bayar {formatCurrency(total)}
                </Button>
            </div>

            <Modal
                open={isCustomerOpen}
                title="Pilih Pelanggan"
                onClose={() => {
                    setCustomerOpen(false);
                    setCustomerSearch('');
                }}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        value={customerSearch}
                        onChange={(event) => setCustomerSearch(event.target.value)}
                        placeholder="Cari nama, kode, atau telepon..."
                    />

                    <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleSelectCustomer(null)}>
                            Tanpa Pelanggan
                        </Button>
                        {selectedCustomer ? (
                            <span className="text-xs text-ink-muted">
                                Dipilih: {selectedCustomer.name}
                            </span>
                        ) : null}
                    </div>

                    <div className="max-h-[50svh] overflow-y-auto space-y-2">
                        {customersLoading ? (
                            <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-ink-muted">
                                Memuat daftar pelanggan...
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border bg-surface-2 p-3 text-sm text-ink-muted">
                                Pelanggan tidak ditemukan.
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer.id)}
                                    className="w-full rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-ink truncate">{customer.name}</p>
                                            <p className="text-xs text-ink-muted">
                                                {customer.customer_code}
                                                {customer.phone ? ` • ${customer.phone}` : ''}
                                            </p>
                                        </div>
                                        {customer.is_member ? (
                                            <Badge variant="success">Member</Badge>
                                        ) : null}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
