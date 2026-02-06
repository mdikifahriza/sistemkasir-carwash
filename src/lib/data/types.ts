export type Role = 'owner' | 'manager' | 'cashier' | 'warehouse';

export interface StoreInfo {
  id: string;
  storeCode: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxPercentage: number;
  currency: string;
  timezone: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface User {
  id: string;
  storeId: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  pinCode?: string;
  avatarUrl?: string;
  employeeId?: string;
  salary: number;
  commissionPercentage: number;
  isActive: boolean;
  lastLogin?: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string | null;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  maxStock?: number;
  isTrackable: boolean;
  isActive: boolean;
  imageUrl?: string;
  taxPercentage: number;
  discountPercentage: number;
  createdBy?: string;
}

export interface Customer {
  id: string;
  storeId: string;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  loyaltyPoints: number;
  totalSpent: number;
  totalTransactions: number;
  isMember: boolean;
  memberSince?: string;
  notes?: string;
  isActive: boolean;
}

export interface Shift {
  id: string;
  storeId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  colorCode: string;
  isActive: boolean;
}

export interface ShiftSession {
  id: string;
  shiftId: string;
  userId?: string | null;
  sessionDate: string;
  openingBalance: number;
  actualOpeningBalance?: number;
  closingBalance: number;
  actualClosingBalance?: number;
  discrepancy: number;
  totalSales: number;
  totalTransactions: number;
  totalCash: number;
  totalCashless: number;
  totalExpenses: number;
  openedAt?: string;
  closedAt?: string;
  notes?: string;
  status: 'open' | 'closed';
}

export type PaymentMethod = 'cash' | 'card' | 'qris' | 'transfer' | 'e-wallet' | 'split';

export interface Transaction {
  id: string;
  storeId: string;
  shiftSessionId?: string | null;
  customerId?: string | null;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  transactionDate: string;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDetail {
  id: string;
  transactionId: string;
  productId?: string | null;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  notes?: string;
}

export interface TransactionEmployee {
  id: string;
  transactionId: string;
  userId: string;
  percentage: number;
  amount: number;
  notes?: string;
}

export interface CashAdvance {
  id: string;
  storeId: string;
  userId: string;
  amount: number;
  purpose?: string;
  approvedBy?: string | null;
  approvalDate?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'partial';
  paidAmount: number;
  remainingAmount: number;
  paidDate?: string | null;
  paymentMethod?: string | null;
  installmentCount: number;
  installmentPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashAdvancePayment {
  id: string;
  cashAdvanceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdBy?: string | null;
}

export interface Supplier {
  id: string;
  storeId: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number;
  notes?: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  storeId: string;
  supplierId?: string | null;
  poNumber: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  deliveryStatus: 'pending' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  createdBy?: string | null;
}

export interface ExpenseCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  storeId: string;
  shiftSessionId?: string | null;
  expenseCategoryId?: string | null;
  amount: number;
  description?: string;
  receiptImage?: string;
  approvedBy?: string | null;
  expenseDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockOpname {
  id: string;
  storeId: string;
  opnameNumber: string;
  opnameDate: string;
  conductedBy?: string | null;
  verifiedBy?: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  totalItems: number;
  totalDifference: number;
  notes?: string;
  createdAt: string;
  completedAt?: string | null;
  approvedAt?: string | null;
}

export interface StockOpnameDetail {
  id: string;
  stockOpnameId: string;
  productId: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  valueDifference: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  tableName?: string;
  recordId?: string;
  description: string;
  createdAt: string;
}

export interface DataSnapshot {
  store: StoreInfo;
  users: User[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  shifts: Shift[];
  shiftSessions: ShiftSession[];
  transactions: Transaction[];
  transactionDetails: TransactionDetail[];
  transactionEmployees: TransactionEmployee[];
  cashAdvances: CashAdvance[];
  cashAdvancePayments: CashAdvancePayment[];
  suppliers: Supplier[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  purchaseOrders: PurchaseOrder[];
  stockOpnames: StockOpname[];
  stockOpnameDetails: StockOpnameDetail[];
  activityLogs: ActivityLog[];
}
