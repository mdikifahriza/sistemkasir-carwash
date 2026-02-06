# POS PRO - Code Examples & Implementation Guide

## 📝 Core Component Examples

### 1. Authentication

#### Login Page
```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await login(data.username, data.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">POS PRO</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              {...register('username')}
              type="text"
              className="mt-1"
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              {...register('password')}
              type="password"
              className="mt-1"
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### 2. Dashboard Layout

#### Main Layout with Sidebar
```typescript
// app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layouts/Sidebar';
import Header from '@/components/layouts/Header';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { refreshShift } = useShiftStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // Refresh current shift on mount
      refreshShift();
    }
  }, [isAuthenticated, router, refreshShift]);

  if (!isAuthenticated) {
    return null; // or loading spinner
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Sidebar Component
```typescript
// components/layouts/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  Wallet,
  FileText,
  TrendingUp,
  Settings,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/utils/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'POS', href: '/pos', icon: <ShoppingCart size={20} />, permission: 'transactions.create' },
  { name: 'Products', href: '/products', icon: <Package size={20} /> },
  { name: 'Transactions', href: '/transactions', icon: <Receipt size={20} /> },
  { name: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { name: 'Employees', href: '/employees', icon: <Users size={20} />, permission: 'employees.view' },
  { name: 'Cash Advances', href: '/cash-advances', icon: <Wallet size={20} /> },
  { name: 'Shifts', href: '/shifts', icon: <Clock size={20} /> },
  { name: 'Reports', href: '/reports', icon: <FileText size={20} />, permission: 'reports.view' },
  { name: 'Analytics', href: '/analytics', icon: <TrendingUp size={20} />, permission: 'reports.view' },
  { name: 'Settings', href: '/settings', icon: <Settings size={20} />, permission: 'settings.view' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(user?.role || '', item.permission);
  });

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-gray-900 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-2xl font-bold text-white">POS PRO</h1>
        </div>
        
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. POS Interface

#### POS Page
```typescript
// app/(dashboard)/pos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import PaymentModal from '@/components/pos/PaymentModal';
import BarcodeScanner from '@/components/pos/BarcodeScanner';
import { useCartStore } from '@/store/cartStore';
import { useShiftStore } from '@/store/shiftStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function POSPage() {
  const { isShiftOpen, currentShift } = useShiftStore();
  const { items, total } = useCartStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!isShiftOpen) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Shift belum dibuka. Silakan buka shift terlebih dahulu di menu Shifts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-sm text-gray-600">
            Shift: {currentShift?.shift_name} | 
            Kasir: {currentShift?.cashier_name}
          </p>
        </div>
        
        <BarcodeScanner />
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Product Grid - 60% width */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid />
        </div>

        {/* Cart - 40% width */}
        <div className="w-[400px] flex flex-col">
          <Cart onCheckout={() => setIsPaymentModalOpen(true)} />
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}
```

#### Cart Component
```typescript
// components/pos/Cart.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils/format';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, subtotal, discount, tax, total } = useCartStore();

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Cart</h2>
        <p className="text-sm text-gray-600">{items.length} items</p>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-600">{item.sku}</p>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(item.price)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} />
                </Button>
                
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus size={14} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="border-t p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (11%)</span>
          <span className="font-medium">{formatCurrency(tax)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>

        <Button
          className="w-full mt-4"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Charge {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}
```

---

### 4. Product Grid

```typescript
// components/pos/ProductGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { useProducts } from '@/lib/hooks/useProducts';
import { formatCurrency } from '@/lib/utils/format';
import { Search, Package } from 'lucide-react';

export default function ProductGrid() {
  const { data: products, isLoading } = useProducts();
  const { addItem } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {/* Map categories here */}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts?.map((product) => (
            <button
              key={product.id}
              onClick={() => addItem(product, 1)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
              disabled={product.stock_quantity <= 0}
            >
              <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <Package size={40} className="text-gray-400" />
                )}
              </div>
              
              <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{product.sku}</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(product.selling_price)}</p>
              
              <div className="mt-2 flex items-center justify-between">
                <Badge variant={product.stock_quantity > 10 ? 'default' : 'destructive'}>
                  Stock: {product.stock_quantity}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 5. Payment Modal

```typescript
// components/pos/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/store/cartStore';
import { useShiftStore } from '@/store/shiftStore';
import { formatCurrency } from '@/lib/utils/format';
import { createTransaction } from '@/lib/api/transactions';
import { toast } from 'sonner';
import { Banknote, CreditCard, Smartphone, Building } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'qris', name: 'QRIS', icon: Smartphone },
  { id: 'transfer', name: 'Transfer', icon: Building },
];

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, total, clear } = useCartStore();
  const { currentShift } = useShiftStore();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const changeAmount = Number(amountPaid) - total;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && changeAmount < 0) {
      toast.error('Jumlah bayar kurang!');
      return;
    }

    try {
      setIsProcessing(true);

      // Create transaction
      const transaction = await createTransaction({
        shift_session_id: currentShift?.id,
        items: items,
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid) || total,
        total_amount: total,
      });

      // Print receipt
      // await printReceipt(transaction);

      toast.success('Transaksi berhasil!');
      clear();
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Transaksi gagal!');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total */}
          <div className="bg-primary/10 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="mb-3 block">Payment Method</Label>
            <div className="grid grid-cols-4 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">{method.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input (for cash) */}
          {paymentMethod === 'cash' && (
            <div>
              <Label className="mb-3 block">Amount Paid</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Enter amount"
                className="text-2xl p-6 text-center"
                autoFocus
              />
              
              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setAmountPaid(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              {/* Change */}
              {amountPaid && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Change:</span>
                    <span className={`text-2xl font-bold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(changeAmount))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || (paymentMethod === 'cash' && changeAmount < 0)}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 6. Shift Management

#### Open Shift Modal
```typescript
// components/shifts/ShiftOpenModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShiftStore } from '@/store/shiftStore';
import { useShifts } from '@/lib/hooks/useShifts';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

interface ShiftOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftOpenModal({ isOpen, onClose }: ShiftOpenModalProps) {
  const { openShift } = useShiftStore();
  const { data: shifts } = useShifts();
  const [selectedShift, setSelectedShift] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShift || !openingBalance) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    try {
      setIsLoading(true);
      await openShift(selectedShift, Number(openingBalance));
      toast.success('Shift berhasil dibuka!');
      onClose();
    } catch (error) {
      console.error('Failed to open shift:', error);
      toast.error('Gagal membuka shift');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Shift</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Shift</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger>
                <SelectValue placeholder="Choose shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts?.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.shift_name} ({shift.start_time} - {shift.end_time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Opening Balance</Label>
            <Input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="Enter initial cash amount"
              step="1000"
            />
            {openingBalance && (
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(Number(openingBalance))}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Opening...' : 'Open Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 7. Store Configuration (Zustand)

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  store_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const response = await apiClient.post(endpoints.login, {
          username,
          password,
        });

        const { user, token } = response.data;

        localStorage.setItem('token', token);

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

```typescript
// store/cartStore.ts
import { create } from 'zustand';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clear: () => void;
  subtotal: number;
  tax: number;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product, quantity) => {
    const items = get().items;
    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            id: crypto.randomUUID(),
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.selling_price,
            quantity,
            subtotal: product.selling_price * quantity,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.product_id !== productId),
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      ),
    });
  },

  setDiscount: (amount) => set({ discount: amount }),

  clear: () => set({ items: [], discount: 0 }),

  get subtotal() {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  get tax() {
    const subtotal = get().subtotal;
    const discount = get().discount;
    return (subtotal - discount) * 0.11; // 11% tax
  },

  get total() {
    const subtotal = get().subtotal;
    const discount = get().discount;
    const tax = get().tax;
    return subtotal - discount + tax;
  },
}));
```

---

### 8. Utility Functions

```typescript
// lib/utils/format.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateOnly(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}
```

```typescript
// lib/utils/permissions.ts

export const permissions = {
  'products.view': ['owner', 'manager', 'cashier', 'warehouse'],
  'products.create': ['owner', 'manager'],
  'products.edit': ['owner', 'manager'],
  'products.delete': ['owner'],
  
  'transactions.create': ['owner', 'manager', 'cashier'],
  'transactions.edit': ['owner'],
  'transactions.delete': ['owner'],
  
  'employees.view': ['owner', 'manager'],
  'employees.create': ['owner'],
  'employees.edit': ['owner'],
  
  'cash_advances.approve': ['owner'],
  
  'reports.view': ['owner', 'manager'],
  'settings.view': ['owner'],
};

export function hasPermission(role: string, permission: string): boolean {
  return permissions[permission]?.includes(role) || false;
}

export function canEditTransaction(userRole: string): boolean {
  return userRole === 'owner';
}

export function canApproveKasbon(userRole: string): boolean {
  return userRole === 'owner';
}
```

---

### 9. API Hooks

```typescript
// lib/hooks/useProducts.ts
import useSWR from 'swr';
import apiClient from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export function useProducts() {
  const { data, error, mutate } = useSWR(
    endpoints.products,
    (url) => apiClient.get(url).then((res) => res.data)
  );

  return {
    data: data?.products || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useProduct(id: string) {
  const { data, error, mutate } = useSWR(
    id ? endpoints.productById(id) : null,
    (url) => apiClient.get(url).then((res) => res.data)
  );

  return {
    data: data?.product,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

---

This provides comprehensive code examples for key components. AI can use these as templates to build the complete application.
