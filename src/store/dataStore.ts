import { create } from 'zustand';
import {
  ActivityLog,
  CashAdvance,
  CashAdvancePayment,
  Category,
  Customer,
  DataSnapshot,
  Expense,
  Product,
  PurchaseOrder,
  ShiftSession,
  StockOpname,
  StockOpnameDetail,
  StoreInfo,
  Supplier,
  Transaction,
  TransactionDetail,
  TransactionEmployee,
  User,
} from '@/lib/data/types';
import { createInvoiceNumber, createOpnameNumber } from '@/lib/utils/id';
import { supabaseRequest } from '@/lib/api/supabase';
import { mapToCamel, mapToSnake } from '@/lib/utils/case';
import { useAuthStore } from '@/store/authStore';

interface AddTransactionPayload {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  discountAmount: number;
  paymentMethod: Transaction['paymentMethod'];
  amountPaid: number;
  shiftSessionId?: string | null;
  cashierId?: string | null;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  employeeSplits?: Array<{ userId: string; percentage: number }>;
}

interface EditTransactionPayload {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  }>;
  discountAmount: number;
  paymentMethod: Transaction['paymentMethod'];
  amountPaid: number;
  notes?: string;
  reason: string;
}

interface DataState extends DataSnapshot {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  currentShiftId: string | null;
  bootstrap: (options?: { storeCode?: string; storeId?: string | null }) => Promise<void>;
  reset: () => void;
  updateStore: (updates: Partial<DataSnapshot['store']>) => Promise<StoreInfo | null>;
  addActivity: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => Promise<ActivityLog | null>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product | null>;
  removeProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer | null>;
  addUser: (user: Omit<User, 'id'>) => Promise<User | null>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User | null>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier | null>;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => Promise<PurchaseOrder | null>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense | null>;
  openShift: (shiftId: string, userId: string, openingBalance: number) => Promise<ShiftSession | null>;
  closeShift: (sessionId: string, actualClosingBalance: number, notes?: string) => Promise<ShiftSession | null>;
  addTransaction: (payload: AddTransactionPayload) => Promise<Transaction | null>;
  editTransaction: (transactionId: string, payload: EditTransactionPayload) => Promise<Transaction | null>;
  refundTransaction: (transactionId: string, reason: string) => Promise<Transaction | null>;
  requestCashAdvance: (data: { userId: string; amount: number; purpose?: string; installmentCount: number }) => Promise<CashAdvance | null>;
  approveCashAdvance: (id: string, approverId: string, status: 'approved' | 'rejected', notes?: string) => Promise<CashAdvance | null>;
  recordCashAdvancePayment: (id: string, amount: number, paymentMethod: string, userId: string) => Promise<CashAdvancePayment | null>;
  createStockOpname: (conductedBy: string | null, notes?: string) => Promise<StockOpname | null>;
  updateStockOpnameDetail: (detailId: string, actualStock: number) => Promise<StockOpnameDetail | null>;
  completeStockOpname: (opnameId: string, approverId?: string | null) => Promise<StockOpname | null>;
}

const emptyStore: StoreInfo = {
  id: '',
  storeCode: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  taxPercentage: 0,
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  logoUrl: '',
  isActive: true,
};

const emptySnapshot: DataSnapshot = {
  store: emptyStore,
  users: [],
  categories: [],
  products: [],
  customers: [],
  shifts: [],
  shiftSessions: [],
  transactions: [],
  transactionDetails: [],
  transactionEmployees: [],
  cashAdvances: [],
  cashAdvancePayments: [],
  suppliers: [],
  expenses: [],
  expenseCategories: [],
  purchaseOrders: [],
  stockOpnames: [],
  stockOpnameDetails: [],
  activityLogs: [],
};

const numberFields = new Set([
  'taxPercentage',
  'salary',
  'commissionPercentage',
  'sortOrder',
  'purchasePrice',
  'sellingPrice',
  'stockQuantity',
  'minStock',
  'maxStock',
  'loyaltyPoints',
  'totalSpent',
  'totalTransactions',
  'openingBalance',
  'actualOpeningBalance',
  'closingBalance',
  'actualClosingBalance',
  'discrepancy',
  'totalSales',
  'totalCash',
  'totalCashless',
  'totalExpenses',
  'subtotal',
  'discountAmount',
  'discountPercentage',
  'taxAmount',
  'totalAmount',
  'amountPaid',
  'changeAmount',
  'quantity',
  'unitPrice',
  'percentage',
  'amount',
  'paidAmount',
  'remainingAmount',
  'installmentCount',
  'installmentPaid',
  'paymentTerms',
  'totalItems',
  'totalDifference',
  'systemStock',
  'actualStock',
  'difference',
  'valueDifference',
]);

function normalizeNumbers<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => normalizeNumbers(item)) as T;
  }
  if (input && typeof input === 'object') {
    const output: Record<string, any> = {};
    Object.entries(input as Record<string, any>).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        output[key] = value;
        return;
      }
      if (numberFields.has(key) && (typeof value === 'string' || typeof value === 'number')) {
        output[key] = Number(value);
      } else {
        output[key] = normalizeNumbers(value);
      }
    });
    return output as T;
  }
  return input;
}

const getActorId = () => useAuthStore.getState().userId ?? undefined;

async function insertRows<T>(table: string, data: any): Promise<T[]> {
  const rows = await supabaseRequest<any[]>({
    action: 'insert',
    table,
    data: mapToSnake(data),
  });
  return normalizeNumbers(mapToCamel(rows)) as T[];
}

async function updateRows<T>(table: string, match: Record<string, any>, data: any): Promise<T[]> {
  const rows = await supabaseRequest<any[]>({
    action: 'update',
    table,
    match,
    data: mapToSnake(data),
  });
  return normalizeNumbers(mapToCamel(rows)) as T[];
}

async function deleteRows<T>(table: string, match: Record<string, any>): Promise<T[]> {
  const rows = await supabaseRequest<any[]>({
    action: 'delete',
    table,
    match,
  });
  return normalizeNumbers(mapToCamel(rows)) as T[];
}

export const useDataStore = create<DataState>((set, get) => ({
  ...emptySnapshot,
  isReady: false,
  isLoading: false,
  error: null,
  currentShiftId: null,
  bootstrap: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeCode: options?.storeCode,
          storeId: options?.storeId ?? null,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Gagal memuat data');
      }

      const payload = (await res.json()) as { data: DataSnapshot };
      const normalized = normalizeNumbers(payload.data);
      const currentShift = normalized.shiftSessions.find((session) => session.status === 'open') || null;

      set({
        ...normalized,
        currentShiftId: currentShift?.id ?? null,
        isReady: true,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data';
      set({ error: message, isLoading: false });
    }
  },
  reset: () => {
    set({ ...emptySnapshot, isReady: false, isLoading: false, error: null, currentShiftId: null });
  },
  updateStore: async (updates) => {
    const storeId = get().store.id;
    if (!storeId) return null;
    const rows = await updateRows<StoreInfo>('stores', { id: storeId }, updates);
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({ store: { ...state.store, ...updated } }));
      const fields = Object.keys(updates || {});
      await get().addActivity({
        action: 'update_store',
        tableName: 'stores',
        recordId: storeId,
        description: `Pengaturan toko diperbarui${fields.length ? `: ${fields.join(', ')}` : ''}`,
      });
    }
    return updated;
  },
  addActivity: async (log) => {
    const rows = await insertRows<ActivityLog>('activity_logs', {
      ...log,
      userId: log.userId ?? getActorId() ?? null,
    });
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ activityLogs: [created, ...state.activityLogs].slice(0, 500) }));
    }
    return created;
  },
  addProduct: async (product) => {
    const rows = await insertRows<Product>('products', product);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ products: [created, ...state.products] }));
      await get().addActivity({
        action: 'create_product',
        tableName: 'products',
        recordId: created.id,
        description: `Produk dibuat: ${created.name}`,
      });
    }
    return created;
  },
  updateProduct: async (id, updates) => {
    const rows = await updateRows<Product>('products', { id }, updates);
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({
        products: state.products.map((product) => (product.id === id ? updated : product)),
      }));
      await get().addActivity({
        action: 'update_product',
        tableName: 'products',
        recordId: id,
        description: `Produk diperbarui: ${updated.name}`,
      });
    }
    return updated;
  },
  removeProduct: async (id) => {
    const product = get().products.find((item) => item.id === id);
    await deleteRows<Product>('products', { id });
    set((state) => ({ products: state.products.filter((product) => product.id !== id) }));
    await get().addActivity({
      action: 'delete_product',
      tableName: 'products',
      recordId: id,
      description: `Produk dihapus${product ? `: ${product.name}` : ''}`,
    });
  },
  addCategory: async (category) => {
    const rows = await insertRows<Category>('categories', category);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ categories: [...state.categories, created] }));
      await get().addActivity({
        action: 'create_category',
        tableName: 'categories',
        recordId: created.id,
        description: `Kategori dibuat: ${created.name}`,
      });
    }
    return created;
  },
  updateCategory: async (id, updates) => {
    const rows = await updateRows<Category>('categories', { id }, updates);
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({
        categories: state.categories.map((category) => (category.id === id ? updated : category)),
      }));
      await get().addActivity({
        action: 'update_category',
        tableName: 'categories',
        recordId: id,
        description: `Kategori diperbarui: ${updated.name}`,
      });
    }
    return updated;
  },
  addCustomer: async (customer) => {
    const rows = await insertRows<Customer>('customers', customer);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ customers: [created, ...state.customers] }));
      await get().addActivity({
        action: 'create_customer',
        tableName: 'customers',
        recordId: created.id,
        description: `Pelanggan dibuat: ${created.name}`,
      });
    }
    return created;
  },
  updateCustomer: async (id, updates) => {
    const rows = await updateRows<Customer>('customers', { id }, updates);
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({
        customers: state.customers.map((customer) => (customer.id === id ? updated : customer)),
      }));
      await get().addActivity({
        action: 'update_customer',
        tableName: 'customers',
        recordId: id,
        description: `Pelanggan diperbarui: ${updated.name}`,
      });
    }
    return updated;
  },
  addUser: async (user) => {
    const rows = await insertRows<User>('users', user);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ users: [created, ...state.users] }));
      await get().addActivity({
        action: 'create_user',
        tableName: 'users',
        recordId: created.id,
        description: `Pengguna dibuat: ${created.fullName}`,
      });
    }
    return created;
  },
  updateUser: async (id, updates) => {
    const rows = await updateRows<User>('users', { id }, updates);
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({ users: state.users.map((user) => (user.id === id ? updated : user)) }));
      await get().addActivity({
        action: 'update_user',
        tableName: 'users',
        recordId: id,
        description: `Pengguna diperbarui: ${updated.fullName}`,
      });
    }
    return updated;
  },
  addSupplier: async (supplier) => {
    const rows = await insertRows<Supplier>('suppliers', supplier);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ suppliers: [created, ...state.suppliers] }));
      await get().addActivity({
        action: 'create_supplier',
        tableName: 'suppliers',
        recordId: created.id,
        description: `Pemasok dibuat: ${created.name}`,
      });
    }
    return created;
  },
  addPurchaseOrder: async (order) => {
    const rows = await insertRows<PurchaseOrder>('purchase_orders', order);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ purchaseOrders: [created, ...state.purchaseOrders] }));
      await get().addActivity({
        action: 'create_purchase_order',
        tableName: 'purchase_orders',
        recordId: created.id,
        description: `Pembelian dibuat: ${created.poNumber}`,
      });
    }
    return created;
  },
  addExpense: async (expense) => {
    const rows = await insertRows<Expense>('expenses', expense);
    const created = rows[0] || null;
    if (!created) return null;

    const shiftSessionId = expense.shiftSessionId;
    let shiftSessions = get().shiftSessions;
    if (shiftSessionId) {
      const session = shiftSessions.find((item) => item.id === shiftSessionId);
      if (session) {
        const updatedSession = {
          ...session,
          totalExpenses: Number(session.totalExpenses) + Number(expense.amount),
        };
        await updateRows<ShiftSession>('shift_sessions', { id: shiftSessionId }, {
          totalExpenses: updatedSession.totalExpenses,
        });
        shiftSessions = shiftSessions.map((item) => (item.id === shiftSessionId ? updatedSession : item));
      }
    }

    set((state) => ({ expenses: [created, ...state.expenses], shiftSessions }));
    await get().addActivity({
      action: 'create_expense',
      tableName: 'expenses',
      recordId: created.id,
      description: `Pengeluaran dicatat: ${created.amount}`,
    });
    return created;
  },
  openShift: async (shiftId, userId, openingBalance) => {
    const existing = get().shiftSessions.find((session) => session.status === 'open');
    if (existing) return null;

    const payload = {
      shiftId,
      userId,
      sessionDate: new Date().toISOString().slice(0, 10),
      openingBalance,
      actualOpeningBalance: openingBalance,
      closingBalance: 0,
      actualClosingBalance: 0,
      discrepancy: 0,
      totalSales: 0,
      totalTransactions: 0,
      totalCash: 0,
      totalCashless: 0,
      totalExpenses: 0,
      openedAt: new Date().toISOString(),
      status: 'open',
    };

    const rows = await insertRows<ShiftSession>('shift_sessions', payload);
    const created = rows[0] || null;
    if (created) {
      set((state) => ({
        shiftSessions: [created, ...state.shiftSessions],
        currentShiftId: created.id,
      }));
      await get().addActivity({
        userId,
        action: 'open_shift',
        tableName: 'shift_sessions',
        recordId: created.id,
        description: `Shift dibuka dengan saldo Rp ${openingBalance}`,
      });
    }
    return created;
  },
  closeShift: async (sessionId, actualClosingBalance, notes) => {
    const session = get().shiftSessions.find((item) => item.id === sessionId);
    if (!session) return null;

    const expected = Number(session.openingBalance) + Number(session.totalSales) - Number(session.totalExpenses);
    const discrepancy = actualClosingBalance - expected;

    const rows = await updateRows<ShiftSession>('shift_sessions', { id: sessionId }, {
      closingBalance: expected,
      actualClosingBalance,
      discrepancy,
      notes,
      status: 'closed',
      closedAt: new Date().toISOString(),
    });

    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({
        shiftSessions: state.shiftSessions.map((item) => (item.id === sessionId ? updated : item)),
        currentShiftId: null,
      }));
      await get().addActivity({
        userId: session.userId || undefined,
        action: 'close_shift',
        tableName: 'shift_sessions',
        recordId: sessionId,
        description: `Shift ditutup. Selisih: ${discrepancy}`,
      });
    }

    return updated;
  },
  addTransaction: async (payload) => {
    const state = get();
    const store = state.store;
    if (payload.items.length === 0) return null;

    const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.max(payload.discountAmount, 0);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxable * (Number(store.taxPercentage) / 100);
    const totalAmount = taxable + taxAmount;
    const amountPaid = payload.amountPaid || totalAmount;
    const changeAmount = Math.max(amountPaid - totalAmount, 0);

    const today = new Date();
    const invoiceNumber = createInvoiceNumber(today, state.transactions.length + 1);

    const trxPayload = {
      storeId: store.id,
      shiftSessionId: payload.shiftSessionId ?? null,
      customerId: payload.customerId ?? null,
      invoiceNumber,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      transactionDate: new Date().toISOString(),
      subtotal,
      discountAmount,
      discountPercentage: subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
      taxAmount,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      amountPaid,
      changeAmount,
      notes: payload.notes,
      status: 'completed',
      createdBy: payload.cashierId ?? null,
    };

    const [transaction] = await insertRows<Transaction>('transactions', trxPayload);
    if (!transaction) return null;

    const detailPayload = payload.items.map((item) => ({
      transactionId: transaction.id,
      productId: item.productId,
      productName: item.name,
      productSku: item.sku,
      quantity: item.quantity,
      unitPrice: item.price,
      discountAmount: 0,
      subtotal: item.price * item.quantity,
    }));

    const employeePayload = (payload.employeeSplits || []).map((split) => ({
      transactionId: transaction.id,
      userId: split.userId,
      percentage: split.percentage,
      amount: (split.percentage / 100) * totalAmount,
    }));

    const [details, employees] = await Promise.all([
      detailPayload.length ? insertRows<TransactionDetail>('transaction_details', detailPayload) : Promise.resolve([]),
      employeePayload.length ? insertRows<TransactionEmployee>('transaction_employees', employeePayload) : Promise.resolve([]),
    ]);

    const updatedProducts = await Promise.all(
      state.products.map(async (product) => {
        const item = payload.items.find((entry) => entry.productId === product.id);
        if (!item) return product;
        const stockQuantity = Math.max(Number(product.stockQuantity) - item.quantity, 0);
        const [updated] = await updateRows<Product>('products', { id: product.id }, { stockQuantity });
        return updated || { ...product, stockQuantity };
      })
    );

    let updatedSessions = state.shiftSessions;
    if (payload.shiftSessionId) {
      const session = state.shiftSessions.find((item) => item.id === payload.shiftSessionId);
      if (session) {
        const isCash = payload.paymentMethod === 'cash';
        const updatedSession = {
          ...session,
          totalSales: Number(session.totalSales) + totalAmount,
          totalTransactions: Number(session.totalTransactions) + 1,
          totalCash: Number(session.totalCash) + (isCash ? totalAmount : 0),
          totalCashless: Number(session.totalCashless) + (!isCash ? totalAmount : 0),
        };
        await updateRows<ShiftSession>('shift_sessions', { id: session.id }, {
          totalSales: updatedSession.totalSales,
          totalTransactions: updatedSession.totalTransactions,
          totalCash: updatedSession.totalCash,
          totalCashless: updatedSession.totalCashless,
        });
        updatedSessions = state.shiftSessions.map((item) => (item.id === session.id ? updatedSession : item));
      }
    }

    set((state) => ({
      transactions: [transaction, ...state.transactions],
      transactionDetails: [...details, ...state.transactionDetails],
      transactionEmployees: [...employees, ...state.transactionEmployees],
      products: updatedProducts,
      shiftSessions: updatedSessions,
    }));

    await get().addActivity({
      userId: payload.cashierId ?? undefined,
      action: 'create_transaction',
      tableName: 'transactions',
      recordId: transaction.id,
      description: `Transaksi ${invoiceNumber} dibuat`,
    });

    return transaction;
  },
  editTransaction: async (transactionId, payload) => {
    const state = get();
    const transaction = state.transactions.find((trx) => trx.id === transactionId);
    if (!transaction) return null;

    const currentDetails = state.transactionDetails.filter((detail) => detail.transactionId === transactionId);

    const currentQuantities = new Map(
      currentDetails.map((detail) => [detail.productId ?? '', Number(detail.quantity)])
    );

    const updatedProducts = await Promise.all(
      state.products.map(async (product) => {
        const newItem = payload.items.find((item) => item.productId === product.id);
        const currentQty = currentQuantities.get(product.id) || 0;
        const nextQty = newItem ? newItem.quantity : 0;
        const diff = nextQty - currentQty;
        if (diff === 0) return product;
        const stockQuantity = Math.max(Number(product.stockQuantity) - diff, 0);
        const [updated] = await updateRows<Product>('products', { id: product.id }, { stockQuantity });
        return updated || { ...product, stockQuantity };
      })
    );

    const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.max(payload.discountAmount, 0);
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = taxable * (Number(state.store.taxPercentage) / 100);
    const totalAmount = taxable + taxAmount;

    const [updatedTransaction] = await updateRows<Transaction>('transactions', { id: transactionId }, {
      subtotal,
      discountAmount,
      discountPercentage: subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
      taxAmount,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      amountPaid: payload.amountPaid || totalAmount,
      changeAmount: Math.max((payload.amountPaid || totalAmount) - totalAmount, 0),
      notes: payload.notes,
      updatedAt: new Date().toISOString(),
    });

    await deleteRows<TransactionDetail>('transaction_details', { transaction_id: transactionId });
    const newDetails = await insertRows<TransactionDetail>(
      'transaction_details',
      payload.items.map((item) => ({
        transactionId,
        productId: item.productId,
        productName: item.name,
        productSku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        discountAmount: 0,
        subtotal: item.price * item.quantity,
      }))
    );

    set((state) => ({
      transactions: state.transactions.map((trx) => (trx.id === transactionId ? updatedTransaction : trx)),
      transactionDetails: [
        ...newDetails,
        ...state.transactionDetails.filter((detail) => detail.transactionId !== transactionId),
      ],
      products: updatedProducts,
    }));

    await get().addActivity({
      userId: updatedTransaction?.createdBy ?? undefined,
      action: 'edit_transaction',
      tableName: 'transactions',
      recordId: transactionId,
      description: `Transaksi diubah. Alasan: ${payload.reason}`,
    });

    return updatedTransaction || null;
  },
  refundTransaction: async (transactionId, reason) => {
    const state = get();
    const transaction = state.transactions.find((trx) => trx.id === transactionId);
    if (!transaction || transaction.status === 'refunded') return null;

    const details = state.transactionDetails.filter((detail) => detail.transactionId === transactionId);

    const updatedProducts = await Promise.all(
      state.products.map(async (product) => {
        const item = details.find((detail) => detail.productId === product.id);
        if (!item) return product;
        const stockQuantity = Number(product.stockQuantity) + Number(item.quantity);
        const [updated] = await updateRows<Product>('products', { id: product.id }, { stockQuantity });
        return updated || { ...product, stockQuantity };
      })
    );

    let updatedSessions = state.shiftSessions;
    if (transaction.shiftSessionId) {
      const session = state.shiftSessions.find((item) => item.id === transaction.shiftSessionId);
      if (session) {
        const isCash = transaction.paymentMethod === 'cash';
        const updatedSession = {
          ...session,
          totalSales: Math.max(Number(session.totalSales) - Number(transaction.totalAmount), 0),
          totalTransactions: Math.max(Number(session.totalTransactions) - 1, 0),
          totalCash: Math.max(Number(session.totalCash) - (isCash ? Number(transaction.totalAmount) : 0), 0),
          totalCashless: Math.max(Number(session.totalCashless) - (!isCash ? Number(transaction.totalAmount) : 0), 0),
        };
        await updateRows<ShiftSession>('shift_sessions', { id: session.id }, {
          totalSales: updatedSession.totalSales,
          totalTransactions: updatedSession.totalTransactions,
          totalCash: updatedSession.totalCash,
          totalCashless: updatedSession.totalCashless,
        });
        updatedSessions = state.shiftSessions.map((item) => (item.id === session.id ? updatedSession : item));
      }
    }

    const [updatedTransaction] = await updateRows<Transaction>('transactions', { id: transactionId }, {
      status: 'refunded',
      notes: reason,
      updatedAt: new Date().toISOString(),
    });

    set((state) => ({
      transactions: state.transactions.map((trx) => (trx.id === transactionId ? updatedTransaction : trx)),
      products: updatedProducts,
      shiftSessions: updatedSessions,
    }));

    await get().addActivity({
      userId: transaction.createdBy ?? undefined,
      action: 'refund_transaction',
      tableName: 'transactions',
      recordId: transactionId,
      description: `Transaksi direfund. Alasan: ${reason}`,
    });

    return updatedTransaction || null;
  },
  requestCashAdvance: async ({ userId, amount, purpose, installmentCount }) => {
    const rows = await insertRows<CashAdvance>('cash_advances', {
      storeId: get().store.id,
      userId,
      amount,
      purpose,
      status: 'pending',
      paidAmount: 0,
      remainingAmount: amount,
      installmentCount,
      installmentPaid: 0,
      notes: '',
    });
    const created = rows[0] || null;
    if (created) {
      set((state) => ({ cashAdvances: [created, ...state.cashAdvances] }));
      await get().addActivity({
        userId,
        action: 'request_cash_advance',
        tableName: 'cash_advances',
        recordId: created.id,
        description: `Kasbon diajukan: ${amount}`,
      });
    }
    return created;
  },
  approveCashAdvance: async (id, approverId, status, notes) => {
    const rows = await updateRows<CashAdvance>('cash_advances', { id }, {
      status,
      approvedBy: approverId,
      approvalDate: new Date().toISOString(),
      notes,
    });
    const updated = rows[0] || null;
    if (updated) {
      set((state) => ({
        cashAdvances: state.cashAdvances.map((item) => (item.id === id ? updated : item)),
      }));
      await get().addActivity({
        userId: approverId,
        action: 'approve_cash_advance',
        tableName: 'cash_advances',
        recordId: id,
        description: `Kasbon ${status}`,
      });
    }
    return updated;
  },
  recordCashAdvancePayment: async (id, amount, paymentMethod, userId) => {
    const advance = get().cashAdvances.find((item) => item.id === id);
    if (!advance) return null;

    const remaining = Math.max(Number(advance.remainingAmount) - amount, 0);
    const paidAmount = Number(advance.paidAmount) + amount;
    const status = remaining === 0 ? 'paid' : 'partial';

    const [payment] = await insertRows<CashAdvancePayment>('cash_advance_payments', {
      cashAdvanceId: id,
      paymentDate: new Date().toISOString(),
      amount,
      paymentMethod,
      notes: '',
      createdBy: userId,
    });

    const [updatedAdvance] = await updateRows<CashAdvance>('cash_advances', { id }, {
      paidAmount,
      remainingAmount: remaining,
      paymentMethod,
      paidDate: remaining === 0 ? new Date().toISOString() : null,
      installmentPaid: Number(advance.installmentPaid) + 1,
      status,
      updatedAt: new Date().toISOString(),
    });

    if (payment && updatedAdvance) {
      set((state) => ({
        cashAdvancePayments: [payment, ...state.cashAdvancePayments],
        cashAdvances: state.cashAdvances.map((item) => (item.id === id ? updatedAdvance : item)),
      }));
      await get().addActivity({
        userId,
        action: 'pay_cash_advance',
        tableName: 'cash_advances',
        recordId: id,
        description: `Pembayaran kasbon dicatat: ${amount}`,
      });
    }

    return payment || null;
  },
  createStockOpname: async (conductedBy, notes) => {
    const existing = get().stockOpnames.length + 1;
    const opnameNumber = createOpnameNumber(new Date(), existing);

    const [opname] = await insertRows<StockOpname>('stock_opname', {
      storeId: get().store.id,
      opnameNumber,
      opnameDate: new Date().toISOString().slice(0, 10),
      conductedBy,
      status: 'in_progress',
      totalItems: get().products.length,
      totalDifference: 0,
      notes,
    });

    if (!opname) return null;

    const details = await insertRows<StockOpnameDetail>(
      'stock_opname_details',
      get().products.map((product) => ({
        stockOpnameId: opname.id,
        productId: product.id,
        systemStock: product.stockQuantity,
        actualStock: product.stockQuantity,
        valueDifference: 0,
        notes: '',
      }))
    );

    set((state) => ({
      stockOpnames: [opname, ...state.stockOpnames],
      stockOpnameDetails: [...details, ...state.stockOpnameDetails],
    }));

    await get().addActivity({
      userId: conductedBy ?? undefined,
      action: 'create_stock_opname',
      tableName: 'stock_opname',
      recordId: opname.id,
      description: `Stock opname dibuat: ${opnameNumber}`,
    });

    return opname;
  },
  updateStockOpnameDetail: async (detailId, actualStock) => {
    const detail = get().stockOpnameDetails.find((item) => item.id === detailId);
    if (!detail) return null;
    const [updated] = await updateRows<StockOpnameDetail>('stock_opname_details', { id: detailId }, {
      actualStock,
    });

    if (updated) {
      set((state) => ({
        stockOpnameDetails: state.stockOpnameDetails.map((item) => (item.id === detailId ? updated : item)),
      }));
      await get().addActivity({
        action: 'update_stock_opname_detail',
        tableName: 'stock_opname_details',
        recordId: detailId,
        description: `Detail opname diperbarui: ${updated.productId}`,
      });
    }

    return updated || null;
  },
  completeStockOpname: async (opnameId, approverId) => {
    const opname = get().stockOpnames.find((item) => item.id === opnameId);
    if (!opname) return null;

    const details = get().stockOpnameDetails.filter((item) => item.stockOpnameId === opnameId);
    const totalDifference = details.reduce((sum, item) => sum + Number(item.difference), 0);

    const updatedProducts = await Promise.all(
      get().products.map(async (product) => {
        const detail = details.find((item) => item.productId === product.id);
        if (!detail) return product;
        const [updated] = await updateRows<Product>('products', { id: product.id }, { stockQuantity: detail.actualStock });
        return updated || { ...product, stockQuantity: detail.actualStock };
      })
    );

    const [updatedOpname] = await updateRows<StockOpname>('stock_opname', { id: opnameId }, {
      totalDifference,
      status: 'completed',
      verifiedBy: approverId ?? null,
      completedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    });

    if (updatedOpname) {
      set((state) => ({
        stockOpnames: state.stockOpnames.map((item) => (item.id === opnameId ? updatedOpname : item)),
        products: updatedProducts,
      }));

      await get().addActivity({
        userId: approverId ?? undefined,
        action: 'complete_stock_opname',
        tableName: 'stock_opname',
        recordId: opnameId,
        description: `Stock opname selesai: ${updatedOpname.opnameNumber}`,
      });
    }

    return updatedOpname || null;
  },
}));
