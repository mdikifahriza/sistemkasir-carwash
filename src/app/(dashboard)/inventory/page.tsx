'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

export default function InventoryPage() {
  const products = useDataStore((state) => state.products);
  const updateProduct = useDataStore((state) => state.updateProduct);
  const stockOpnames = useDataStore((state) => state.stockOpnames);
  const stockOpnameDetails = useDataStore((state) => state.stockOpnameDetails);
  const createStockOpname = useDataStore((state) => state.createStockOpname);
  const updateStockOpnameDetail = useDataStore((state) => state.updateStockOpnameDetail);
  const completeStockOpname = useDataStore((state) => state.completeStockOpname);

  const [activeOpnameId, setActiveOpnameId] = useState<string | null>(
    stockOpnames[0]?.id || null
  );

  const activeOpname = stockOpnames.find((opname) => opname.id === activeOpnameId) || null;
  const details = stockOpnameDetails.filter((detail) => detail.stockOpnameId === activeOpnameId);

  const lowStock = useMemo(
    () => products.filter((product) => product.stockQuantity <= product.minStock),
    [products]
  );

  const formatOpnameStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'Berjalan';
      case 'completed':
        return 'Selesai';
      case 'approved':
        return 'Disetujui';
      default:
        return status;
    }
  };

  const handleCreateOpname = async () => {
    try {
      const opname = await createStockOpname(null, 'Stock opname rutin');
      if (opname) {
        setActiveOpnameId(opname.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal membuat stock opname');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <PageHeader
        title="Inventori"
        subtitle="Pantau stok, lakukan penyesuaian, dan stock opname"
        actions={
          <Button variant="outline" onClick={handleCreateOpname}>
            Buat Stock Opname
          </Button>
        }
      />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-ink-muted">Daftar Stok Produk</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="group bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-ink truncate group-hover:text-primary transition-colors">{product.name}</h4>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{product.sku}</p>
                  </div>
                  <Badge variant={product.stockQuantity <= product.minStock ? 'danger' : 'success'} className="shrink-0 text-[10px] px-2 py-0.5 h-auto font-black">
                    {product.stockQuantity}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">
                    Min Stock: <span className="text-ink">{product.minStock}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-ink-muted uppercase">Adjust</span>
                    <Input
                      type="number"
                      placeholder="±0"
                      className="w-16 h-7 text-xs font-black text-right rounded-lg"
                      onBlur={async (event) => {
                        const adjustment = Number(event.target.value) || 0;
                        if (adjustment !== 0) {
                          try {
                            await updateProduct(product.id, {
                              stockQuantity: product.stockQuantity + adjustment,
                            });
                            event.target.value = '';
                          } catch (error) {
                            alert(error instanceof Error ? error.message : 'Gagal menyesuaikan stok');
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <h3 className="text-base font-semibold text-ink md:text-lg">Peringatan Stok Menipis</h3>
          <div className="mt-4 space-y-2 text-sm">
            {lowStock.length === 0 ? (
              <p className="text-ink-muted">Stok aman.</p>
            ) : (
              lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <span>{product.name}</span>
                  <Badge variant="danger">{product.stockQuantity}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink md:text-lg">Stock Opname</h3>
            <p className="text-sm text-ink-muted">Input stok aktual untuk update inventory.</p>
          </div>
          {activeOpname ? (
            <Badge variant={activeOpname.status === 'completed' ? 'success' : 'warning'}>
              {formatOpnameStatus(activeOpname.status)}
            </Badge>
          ) : null}
        </div>

        {!activeOpname ? (
          <div className="mt-4 text-sm text-ink-muted">Belum ada stock opname aktif.</div>
        ) : (
          <div className="mt-4 space-y-4">
            <ResponsiveTable>
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2">Produk</th>
                  <th>Sistem</th>
                  <th>Aktual</th>
                  <th>Selisih</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail) => {
                  const product = products.find((item) => item.id === detail.productId);
                  return (
                    <tr key={detail.id} className="border-t border-border">
                      <td className="py-3">
                        <div className="font-semibold text-ink">{product?.name}</div>
                        <div className="text-xs text-ink-muted">{product?.sku}</div>
                      </td>
                      <td>{detail.systemStock}</td>
                      <td>
                        <Input
                          type="number"
                          value={detail.actualStock ?? ''}
                          onChange={async (event) => {
                            const actualStock = Number(event.target.value) || 0;
                            try {
                              await updateStockOpnameDetail(detail.id, actualStock);
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Gagal update');
                            }
                          }}
                          className="w-20"
                        />
                      </td>
                      <td>
                        <Badge
                          variant={
                            detail.actualStock == null
                              ? 'default'
                              : detail.actualStock - detail.systemStock === 0
                                ? 'success'
                                : 'warning'
                          }
                        >
                          {detail.actualStock == null
                            ? '-'
                            : detail.actualStock - detail.systemStock}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ResponsiveTable>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await completeStockOpname(activeOpname.id);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'Gagal menyelesaikan stock opname');
                  }
                }}
              >
                Selesaikan & Terapkan
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
