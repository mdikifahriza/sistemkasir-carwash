'use client';

import { useMemo, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { PageHeader } from '@/components/widgets/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/format';
import { uploadMedia } from '@/lib/supabase/storage';

export default function ProductsPage() {
  const store = useDataStore((state) => state.store);
  const products = useDataStore((state) => state.products);
  const categories = useDataStore((state) => state.categories);
  const addProduct = useDataStore((state) => state.addProduct);
  const updateProduct = useDataStore((state) => state.updateProduct);
  const removeProduct = useDataStore((state) => state.removeProduct);
  const addCategory = useDataStore((state) => state.addCategory);
  const user = useCurrentUser();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    sellingPrice: 0,
    purchasePrice: 0,
    stockQuantity: 0,
    minStock: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [csvInput, setCsvInput] = useState('');

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword)
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingId(null);
    setImageFile(null);
    setForm({
      name: '',
      sku: '',
      barcode: '',
      categoryId: categories[0]?.id || '',
      sellingPrice: 0,
      purchasePrice: 0,
      stockQuantity: 0,
      minStock: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setEditingId(id);
    setImageFile(null);
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId || '',
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      stockQuantity: product.stockQuantity,
      minStock: product.minStock,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku) {
      alert('Nama dan SKU wajib diisi');
      return;
    }

    try {
      let imageUrl = '';
      const existing = editingId ? products.find((item) => item.id === editingId) : null;
      if (existing?.imageUrl) {
        imageUrl = existing.imageUrl;
      }
      if (imageFile) {
        const upload = await uploadMedia(imageFile, 'products');
        imageUrl = upload.publicUrl;
      }

      if (editingId) {
        await updateProduct(editingId, {
          name: form.name,
          sku: form.sku,
          barcode: form.barcode,
          categoryId: form.categoryId || null,
          sellingPrice: Number(form.sellingPrice),
          purchasePrice: Number(form.purchasePrice),
          stockQuantity: Number(form.stockQuantity),
          minStock: Number(form.minStock),
          imageUrl,
        });
      } else {
        await addProduct({
          storeId: store.id,
          name: form.name,
          sku: form.sku,
          barcode: form.barcode,
          categoryId: form.categoryId || null,
          description: '',
          unit: 'pcs',
          purchasePrice: Number(form.purchasePrice),
          sellingPrice: Number(form.sellingPrice),
          stockQuantity: Number(form.stockQuantity),
          minStock: Number(form.minStock),
          maxStock: undefined,
          isTrackable: true,
          isActive: true,
          imageUrl,
          taxPercentage: 0,
          discountPercentage: 0,
          createdBy: user?.id || undefined,
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menyimpan produk');
      return;
    }

    setModalOpen(false);
  };

  const handleCategoryAdd = async () => {
    if (!categoryName) return;
    try {
      await addCategory({
        storeId: store.id,
        name: categoryName,
        description: '',
        parentId: null,
        icon: 'custom',
        sortOrder: categories.length + 1,
        isActive: true,
      });
      setCategoryName('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menambah kategori');
    }
  };

  const handleImport = async () => {
    const rows = csvInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    await Promise.all(
      rows.map(async (row) => {
        const [sku, name, price, stock, categoryName] = row.split(',').map((cell) => cell.trim());
        if (!sku || !name) return;
        const category = categories.find((cat) => cat.name.toLowerCase() === categoryName?.toLowerCase());
        await addProduct({
          storeId: store.id,
          sku,
          name,
          barcode: '',
          categoryId: category?.id || null,
          description: '',
          unit: 'pcs',
          purchasePrice: Number(price) * 0.7 || 0,
          sellingPrice: Number(price) || 0,
          stockQuantity: Number(stock) || 0,
          minStock: 0,
          maxStock: undefined,
          isTrackable: true,
          isActive: true,
          imageUrl: '',
          taxPercentage: 0,
          discountPercentage: 0,
          createdBy: user?.id || undefined,
        });
      })
    );

    setCsvInput('');
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await removeProduct(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus produk');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Produk"
        subtitle="Kelola produk, kategori, dan stok"
        actions={<Button onClick={openCreate}>Tambah Produk</Button>}
      />

      <Card className="space-y-4">
        <Input
          label="Cari Produk"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nama atau SKU"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
          {filtered.map((product) => (
            <div key={product.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-square w-full relative bg-surface-2 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-muted/30 font-black text-4xl select-none">
                    {product.name.charAt(0)}
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                   <Badge variant={product.stockQuantity <= product.minStock ? 'danger' : 'success'} className="backdrop-blur-md shadow-sm border-none font-black text-[10px] px-2 py-1">
                      STOK {product.stockQuantity}
                   </Badge>
                   <span className="bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-md w-fit uppercase tracking-tighter">
                      {categories.find((cat) => cat.id === product.categoryId)?.name || 'Umum'}
                   </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-auto">
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 opacity-70">{product.sku}</p>
                   <h3 className="text-sm font-extrabold text-ink line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                </div>

                <div className="mt-4 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-ink-muted uppercase leading-none mb-1">Harga Jual</span>
                      <span className="text-base font-black text-ink">{formatCurrency(product.sellingPrice, store.currency)}</span>
                   </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-border/50 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(product.id)} className="flex-1 h-9 rounded-xl font-bold text-xs bg-surface-2 hover:bg-primary/10 hover:text-primary transition-all">
                       Ubah
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(product.id)} className="flex-1 h-9 rounded-xl font-bold text-xs text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20">
                       Hapus
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Kategori</h3>
          <div className="flex gap-2">
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Tambah kategori baru"
            />
            <Button variant="outline" onClick={handleCategoryAdd}>
              Tambah
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} variant="info">
                {category.name}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-lg font-semibold text-ink">Impor CSV</h3>
          <p className="text-sm text-ink-muted">
            Format: sku,nama,harga,stok,kategori
          </p>
          <textarea
            className="h-32 w-full rounded-md border border-border bg-surface p-3 text-sm"
            value={csvInput}
            onChange={(event) => setCsvInput(event.target.value)}
            placeholder="SKU013,Produk Baru,12000,20,Makanan"
          />
          <Button variant="outline" onClick={handleImport}>
            Impor
          </Button>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Produk' : 'Tambah Produk'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nama Produk"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="SKU"
            value={form.sku}
            onChange={(event) => setForm({ ...form, sku: event.target.value })}
          />
          <Input
            label="Barcode"
            value={form.barcode}
            onChange={(event) => setForm({ ...form, barcode: event.target.value })}
          />
          <Select
            label="Kategori"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Input
            label="Harga Beli"
            type="number"
            value={form.purchasePrice}
            onChange={(event) => setForm({ ...form, purchasePrice: Number(event.target.value) })}
          />
          <Input
            label="Harga Jual"
            type="number"
            value={form.sellingPrice}
            onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })}
          />
          <Input
            label="Stok"
            type="number"
            value={form.stockQuantity}
            onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })}
          />
          <Input
            label="Stok Minimum"
            type="number"
            value={form.minStock}
            onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })}
          />
          <label className="block text-sm text-ink md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Foto Produk</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
