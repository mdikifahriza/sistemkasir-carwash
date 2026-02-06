'use client';

import { useState, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useOfflineProducts, useOfflineCategories, useProductByBarcode } from '@/lib/hooks/useOffline';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { formatCurrency } from '@/lib/utils/format';
import { Search, Loader2, Barcode, Plus, Camera } from 'lucide-react';

interface ProductGridProps {
    className?: string;
}

export function ProductGrid({ className }: ProductGridProps) {
    const { addItem } = useCartStore();
    const { app } = useSettingsStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [barcode, setBarcode] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [isScannerOpen, setScannerOpen] = useState(false);

    const { products, isLoading: productsLoading } = useOfflineProducts({
        categoryId: categoryId === 'all' ? undefined : categoryId,
        searchQuery
    });

    const { categories } = useOfflineCategories();
    const { searchByBarcode, isSearching: isBarcodeSearching } = useProductByBarcode();

    const handleAddByBarcode = async (value: string, options: { focus?: boolean } = {}) => {
        const code = value.trim();
        if (!code) return;

        const product = await searchByBarcode(code);
        if (product) {
            addItem({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                price: product.selling_price
            }, 1);
            setBarcode(''); // Auto clear
            if (options.focus !== false) {
                barcodeInputRef.current?.focus(); // Keep focus
            }
        } else {
            alert('Produk tidak ditemukan');
        }
    };

    return (
        <div className={`flex flex-col h-full bg-surface-2 ${className || ''}`}>
            {/* Header / Filter Section */}
            <div className="flex-shrink-0 space-y-3 p-4 bg-surface border-b border-border shadow-sm z-10">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari produk..."
                            className="pl-9 bg-surface-2 border-transparent focus:border-primary focus:bg-surface"
                        />
                    </div>
                    <div className="flex gap-2 sm:w-auto">
                        <div className="relative flex-1 min-w-[140px]">
                            <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                            <Input
                                ref={barcodeInputRef}
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Scan barcode..."
                                className="pl-9 bg-surface-2 border-transparent focus:border-primary focus:bg-surface"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddByBarcode(barcode);
                                }}
                            />
                        </div>
                        {app.enableBarcodeScan ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 px-3"
                                onClick={() => setScannerOpen(true)}
                                disabled={isBarcodeSearching}
                            >
                                {isBarcodeSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Scan</span>
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* Category Dropdown */}
                <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="bg-surface-2 border-transparent focus:border-primary focus:bg-surface"
                >
                    <option value="all">Semua Kategori</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4 content-start">
                {productsLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-ink-muted">
                        <Search className="mb-2 h-12 w-12 opacity-20" />
                        <p>Produk tidak ditemukan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 justify-items-center sm:grid-cols-3 sm:justify-items-stretch lg:grid-cols-4 xl:grid-cols-5">
                        {products.map((product) => {
                            const isOutOfStock = product.stock_quantity <= 0 && product.is_trackable;
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => addItem({
                                        productId: product.id,
                                        name: product.name,
                                        sku: product.sku,
                                        price: product.selling_price
                                    }, 1)}
                                    className={`
                                        group relative flex w-full max-w-[320px] sm:max-w-none flex-col justify-between overflow-hidden rounded-xl border bg-surface p-0 text-left transition-all
                                        hover:border-primary hover:shadow-lg hover:-translate-y-1
                                        ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''}
                                    `}
                                    disabled={isOutOfStock}
                                >
                                    {/* Image Section */}
                                    <div className="relative aspect-[5/3] sm:aspect-[4/3] w-full bg-surface-2 flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <span className="text-4xl opacity-50">📦</span>
                                        )}

                                        {/* Stock Badge Overlay */}
                                        {isOutOfStock && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">HABIS</span>
                                            </div>
                                        )}

                                        {product.is_trackable && !isOutOfStock && product.stock_quantity <= product.min_stock && (
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                    SISA {product.stock_quantity}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-2 sm:p-3 flex flex-col flex-1">
                                        <div className="flex-1">
                                            <p className="line-clamp-2 text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors mb-1">
                                                {product.name}
                                            </p>
                                            <p className="text-[9px] sm:text-[10px] text-ink-muted uppercase tracking-wider">{product.sku}</p>
                                        </div>

                                        <div className="mt-2 sm:mt-3 flex items-end justify-between">
                                            <p className="font-bold text-primary text-sm sm:text-base">
                                                {formatCurrency(product.selling_price)}
                                            </p>
                                            <div className={`
                                                h-6 w-6 rounded-full flex items-center justify-center 
                                                ${isOutOfStock ? 'bg-surface-2 text-ink-muted' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'}
                                            `}>
                                                <Plus className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <BarcodeScannerModal
                open={isScannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={(code) => handleAddByBarcode(code, { focus: false })}
            />
        </div>
    );
}
