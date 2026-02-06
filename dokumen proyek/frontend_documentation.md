# POS PRO - Frontend Documentation (Next.js)

## 📁 Struktur Folder Project

```
pos-pro-frontend/
├── src/
│   ├── app/                          # App Router (Next.js 14+)
│   │   ├── (auth)/                   # Auth Layout Group
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Dashboard Layout Group
│   │   │   ├── layout.tsx            # Main dashboard layout with sidebar
│   │   │   │
│   │   │   ├── dashboard/            # Homepage Dashboard
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── pos/                  # Point of Sale
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── products/             # Product Management
│   │   │   │   ├── page.tsx          # List products
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # View detail
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── import/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── categories/           # Category Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── inventory/            # Inventory Management
│   │   │   │   ├── page.tsx          # Stock list
│   │   │   │   ├── stock-opname/
│   │   │   │   │   ├── page.tsx      # List opname
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  # Detail & process
│   │   │   │   ├── adjustments/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── low-stock/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── purchases/            # Purchase Orders
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── receive/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── suppliers/            # Supplier Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── transactions/         # Transaction Management
│   │   │   │   ├── page.tsx          # List all transactions
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Detail
│   │   │   │       ├── edit/         # Owner only
│   │   │   │       │   └── page.tsx
│   │   │   │       └── refund/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── shifts/               # Shift Management
│   │   │   │   ├── page.tsx          # List shifts & sessions
│   │   │   │   ├── open/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── close/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── history/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── employees/            # Employee Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # Profile
│   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── performance/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── attendance/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── cash-advances/        # Kasbon Management
│   │   │   │   ├── page.tsx          # List kasbon
│   │   │   │   ├── request/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Detail
│   │   │   │       ├── approve/      # Owner only
│   │   │   │       │   └── page.tsx
│   │   │   │       └── payment/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── customers/            # Customer Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Profile & history
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── expenses/             # Expense Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── categories/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── reports/              # Reporting
│   │   │   │   ├── page.tsx          # Report dashboard
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profit-loss/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── inventory/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── employee/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── customer/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── export/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── analytics/            # Advanced Analytics
│   │   │   │   ├── page.tsx          # Analytics dashboard
│   │   │   │   ├── sales-forecast/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── abc-analysis/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── customer-rfm/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── cohort/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── settings/             # Settings
│   │   │   │   ├── page.tsx          # General settings
│   │   │   │   ├── store/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payment-methods/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── printer/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── taxes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── backup/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── activity-logs/        # Audit Trail
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── profile/              # User Profile
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── refresh/
│   │   │   │       └── route.ts
│   │   │   ├── products/
│   │   │   │   └── route.ts
│   │   │   ├── transactions/
│   │   │   │   └── route.ts
│   │   │   ├── print/
│   │   │   │   └── route.ts          # Handle print receipt
│   │   │   └── reports/
│   │   │       └── export/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage (redirect to dashboard)
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/                   # React Components
│   │   ├── ui/                       # Shadcn UI Components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx   # Main layout with sidebar
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AuthLayout.tsx
│   │   │
│   │   ├── pos/                      # POS Components
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   ├── CustomerSearch.tsx
│   │   │   └── EmployeeSplit.tsx
│   │   │
│   │   ├── products/
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CategorySelect.tsx
│   │   │   └── BarcodeGenerator.tsx
│   │   │
│   │   ├── transactions/
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── TransactionDetail.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── RefundModal.tsx
│   │   │
│   │   ├── shifts/
│   │   │   ├── ShiftOpenModal.tsx
│   │   │   ├── ShiftCloseModal.tsx
│   │   │   ├── CashCountForm.tsx
│   │   │   └── ShiftSummary.tsx
│   │   │
│   │   ├── inventory/
│   │   │   ├── StockTable.tsx
│   │   │   ├── OpnameForm.tsx
│   │   │   ├── StockAdjustmentModal.tsx
│   │   │   └── LowStockAlert.tsx
│   │   │
│   │   ├── employees/
│   │   │   ├── EmployeeTable.tsx
│   │   │   ├── EmployeeForm.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── AttendanceCalendar.tsx
│   │   │
│   │   ├── cash-advances/
│   │   │   ├── KasbonTable.tsx
│   │   │   ├── KasbonForm.tsx
│   │   │   ├── ApprovalCard.tsx
│   │   │   └── PaymentModal.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── ProfitLossTable.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   └── ReportFilters.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── DashboardCards.tsx
│   │   │   ├── SalesTrend.tsx
│   │   │   ├── TopProducts.tsx
│   │   │   ├── RFMMatrix.tsx
│   │   │   └── CohortChart.tsx
│   │   │
│   │   ├── shared/
│   │   │   ├── DataTable.tsx         # Reusable table with sorting, filtering
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   └── PrintReceipt.tsx          # Receipt template for printing
│   │
│   ├── lib/                          # Utilities & Helpers
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase client
│   │   │   ├── server.ts             # Server-side client
│   │   │   └── queries.ts            # Database queries
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts             # Axios/Fetch wrapper
│   │   │   ├── endpoints.ts          # API endpoints constants
│   │   │   └── interceptors.ts       # Request/response interceptors
│   │   │
│   │   ├── utils/
│   │   │   ├── format.ts             # Format currency, date, etc
│   │   │   ├── validation.ts         # Form validation helpers
│   │   │   ├── permissions.ts        # Role-based permissions
│   │   │   ├── print.ts              # Thermal printer utilities
│   │   │   └── export.ts             # Excel/PDF export
│   │   │
│   │   ├── hooks/                    # Custom React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useUser.ts
│   │   │   ├── useProducts.ts
│   │   │   ├── useTransactions.ts
│   │   │   ├── useShift.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── usePrinter.ts
│   │   │
│   │   ├── constants.ts              # App constants
│   │   ├── types.ts                  # TypeScript types
│   │   └── cn.ts                     # Tailwind class merge utility
│   │
│   ├── store/                        # State Management (Zustand/Redux)
│   │   ├── authStore.ts
│   │   ├── cartStore.ts              # POS cart state
│   │   ├── shiftStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── print.css                 # Styles for thermal printer
│   │
│   └── middleware.ts                 # Auth & route protection
│
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── default-product.png
│   │   └── icons/
│   ├── sounds/
│   │   ├── beep.mp3                  # Barcode scan sound
│   │   └── success.mp3               # Transaction success
│   └── fonts/
│
├── .env.local                        # Environment variables
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🗺️ Routing Structure

### Public Routes (No Auth Required)
```
/login                    → Login page
/forgot-password          → Password recovery
```

### Protected Routes (Auth Required)

#### Main Dashboard
```
/dashboard                → Main dashboard with analytics
```

#### Point of Sale
```
/pos                      → POS interface (cashier only)
```

#### Product Management
```
/products                 → List all products (with search, filter)
/products/create          → Add new product (manager+)
/products/[id]            → View product detail
/products/[id]/edit       → Edit product (manager+)
/products/import          → Import products from Excel (manager+)
/categories               → Manage categories (manager+)
```

#### Inventory
```
/inventory                → Stock overview
/inventory/stock-opname   → List stock opname sessions
/inventory/stock-opname/create → Create new opname
/inventory/stock-opname/[id] → Process opname
/inventory/adjustments    → Manual stock adjustments
/inventory/low-stock      → Low stock alerts
```

#### Transactions
```
/transactions             → List all transactions (filter by date, cashier, shift)
/transactions/[id]        → View transaction detail (with receipt)
/transactions/[id]/edit   → Edit transaction (owner only)
/transactions/[id]/refund → Process refund (owner/manager)
```

#### Shifts
```
/shifts                   → Shift overview & current status
/shifts/open              → Open new shift
/shifts/close             → Close current shift
/shifts/history           → Shift history & reports
```

#### Employee Management
```
/employees                → List all employees
/employees/create         → Add new employee (owner/manager)
/employees/[id]           → Employee profile
/employees/[id]/edit      → Edit employee (owner/manager)
/employees/[id]/performance → Performance metrics
/employees/attendance     → Attendance tracking
```

#### Cash Advances (Kasbon)
```
/cash-advances            → List all kasbon requests
/cash-advances/request    → Request new kasbon
/cash-advances/[id]       → Kasbon detail
/cash-advances/[id]/approve → Approve/reject (owner only)
/cash-advances/[id]/payment → Record payment
```

#### Customers
```
/customers                → Customer database
/customers/create         → Add new customer
/customers/[id]           → Customer profile & transaction history
/customers/[id]/edit      → Edit customer info
```

#### Purchases
```
/purchases                → List purchase orders
/purchases/create         → Create PO
/purchases/[id]           → PO detail
/purchases/[id]/receive   → Receive goods
/suppliers                → Manage suppliers
```

#### Expenses
```
/expenses                 → List expenses
/expenses/create          → Add expense
/expenses/categories      → Manage expense categories
```

#### Reports
```
/reports                  → Report dashboard
/reports/sales            → Sales reports (daily, weekly, monthly)
/reports/profit-loss      → Profit & loss statement
/reports/inventory        → Inventory reports
/reports/employee         → Employee performance reports
/reports/customer         → Customer analytics
/reports/export           → Export center (Excel, PDF)
```

#### Analytics
```
/analytics                → Analytics dashboard
/analytics/sales-forecast → Sales forecasting
/analytics/abc-analysis   → ABC product analysis
/analytics/customer-rfm   → RFM customer segmentation
/analytics/cohort         → Cohort analysis
```

#### Settings
```
/settings                 → General settings
/settings/store           → Store information
/settings/payment-methods → Configure payment methods
/settings/printer         → Printer configuration
/settings/taxes           → Tax settings
/settings/backup          → Backup & restore
```

#### Other
```
/activity-logs            → Audit trail (owner only)
/profile                  → User profile & preferences
```

---

## 🎨 UI/UX Design Guidelines

### Color Scheme
```css
/* Primary Colors */
--primary: #3B82F6        /* Blue - Main actions */
--primary-dark: #2563EB
--primary-light: #DBEAFE

/* Secondary Colors */
--secondary: #10B981      /* Green - Success */
--warning: #F59E0B        /* Orange - Warnings */
--danger: #EF4444         /* Red - Errors/Deletes */
--info: #06B6D4           /* Cyan - Info */

/* Neutral Colors */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-900: #111827

/* Background */
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-sidebar: #1F2937
```

### Typography
```css
/* Font Family */
font-family: 'Inter', 'system-ui', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
```

### Spacing
```css
/* Standard spacing scale */
--spacing-1: 0.25rem    /* 4px */
--spacing-2: 0.5rem     /* 8px */
--spacing-3: 0.75rem    /* 12px */
--spacing-4: 1rem       /* 16px */
--spacing-6: 1.5rem     /* 24px */
--spacing-8: 2rem       /* 32px */
```

### Layout Components

#### Sidebar Navigation
```tsx
// Fixed left sidebar (260px width)
// Collapsible on mobile
// Active route highlighting
// Icons + Labels
// Grouped by sections
```

#### Top Header
```tsx
// Height: 64px
// Contains:
// - Breadcrumbs
// - Search (global)
// - Notifications
// - User profile dropdown
// - Current shift indicator
```

#### Content Area
```tsx
// Main content area
// Padding: 24px
// Background: --bg-secondary
// Responsive grid/flex layouts
```

---

## 📱 Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Usage patterns:
// Mobile: Single column, bottom sheet modals
// Tablet: 2 columns for lists, side drawer modals
// Desktop: Full sidebar, multiple columns, inline modals
```

---

## 🔐 Permission-Based Routing

```typescript
// lib/utils/permissions.ts

export const permissions = {
  // Product Management
  'products.view': ['owner', 'manager', 'cashier', 'warehouse'],
  'products.create': ['owner', 'manager'],
  'products.edit': ['owner', 'manager'],
  'products.delete': ['owner'],
  
  // Transaction Management
  'transactions.view': ['owner', 'manager', 'cashier'],
  'transactions.create': ['owner', 'manager', 'cashier'],
  'transactions.edit': ['owner'],
  'transactions.delete': ['owner'],
  'transactions.refund': ['owner', 'manager'],
  
  // Employee Management
  'employees.view': ['owner', 'manager'],
  'employees.create': ['owner'],
  'employees.edit': ['owner'],
  'employees.delete': ['owner'],
  
  // Cash Advances
  'cash_advances.view': ['owner', 'manager', 'cashier'],
  'cash_advances.request': ['cashier', 'warehouse'],
  'cash_advances.approve': ['owner'],
  
  // Reports
  'reports.view': ['owner', 'manager'],
  'reports.export': ['owner', 'manager'],
  
  // Settings
  'settings.view': ['owner'],
  'settings.edit': ['owner'],
  
  // Activity Logs
  'activity_logs.view': ['owner'],
};

export const hasPermission = (
  userRole: string, 
  permission: string
): boolean => {
  return permissions[permission]?.includes(userRole) || false;
};
```

---

## 🔄 State Management Strategy

### Zustand Stores

#### 1. Auth Store
```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

#### 2. Cart Store (POS)
```typescript
// store/cartStore.ts
interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  paymentMethod: string;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  setCustomer: (customer: Customer) => void;
  clear: () => void;
  total: number;
  subtotal: number;
}
```

#### 3. Shift Store
```typescript
// store/shiftStore.ts
interface ShiftState {
  currentShift: ShiftSession | null;
  isShiftOpen: boolean;
  openShift: (openingBalance: number) => Promise<void>;
  closeShift: (actualBalance: number) => Promise<void>;
  refreshShift: () => Promise<void>;
}
```

---

## 🎯 Key Features Implementation

### 1. POS Interface

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Header: Search | Barcode | Customer | Employee     │
├─────────────────────────────┬───────────────────────┤
│                             │  CART                 │
│  PRODUCT GRID               │  ┌─────────────────┐  │
│  ┌────┐ ┌────┐ ┌────┐      │  │ Item 1          │  │
│  │ P1 │ │ P2 │ │ P3 │      │  │ Item 2          │  │
│  └────┘ └────┘ └────┘      │  │ Item 3          │  │
│  ┌────┐ ┌────┐ ┌────┐      │  └─────────────────┘  │
│  │ P4 │ │ P5 │ │ P6 │      │                       │
│  └────┘ └────┘ └────┘      │  Subtotal: Rp xxx    │
│                             │  Discount: Rp xxx    │
│  [Categories Filter]        │  Tax: Rp xxx         │
│  [Search Products]          │  TOTAL: Rp xxx       │
│                             │                       │
│                             │  [CHARGE] [CLEAR]    │
└─────────────────────────────┴───────────────────────┘
```

**Features:**
- Barcode scanner integration (USB/camera)
- Quick product search with autocomplete
- Customer selection (optional)
- Multi-employee commission split
- Multiple payment methods
- Split payment support
- Print receipt automatically
- Keyboard shortcuts (F1-F12)

### 2. Shift Management

**Open Shift Flow:**
1. Select shift (Pagi/Siang/Malam)
2. Input opening balance (cash in drawer)
3. Optional: Photo of cash
4. Confirm to open
5. System records timestamp & user

**Close Shift Flow:**
1. Count physical cash
2. Input actual balance
3. System calculates:
   - Expected balance (opening + sales - expenses)
   - Discrepancy (expected vs actual)
4. Generate shift report
5. Print/export report
6. Confirm to close

### 3. Transaction Edit (Owner Only)

**Edit Modal:**
- Show original transaction details
- Allow edit: items, quantities, prices, discount
- Log all changes in activity_logs
- Require reason/notes
- Recalculate totals
- Update stock if items changed

### 4. Multi-Employee Commission

**Commission Split UI:**
```
┌─────────────────────────────┐
│  Assign Employees            │
├─────────────────────────────┤
│  ☑ Kasir 1    [60%] Rp xxx  │
│  ☑ Kasir 2    [40%] Rp xxx  │
│  ☐ Manager    [0%]           │
│                              │
│  Total: 100% = Rp xxx        │
│  [Save]                      │
└─────────────────────────────┘
```

### 5. Stock Opname Workflow

**Steps:**
1. Create opname session
2. Assign employee(s)
3. Print product list (optional)
4. Count physical stock
5. Input actual quantities
6. System shows differences
7. Review & approve
8. Apply adjustments to inventory

**UI:**
```
Product List with Input:
┌──────────────────────────────────────────┐
│ SKU    │ Product      │ System │ Actual │
├────────┼──────────────┼────────┼────────┤
│ SKU001 │ Beras 5kg    │   50   │ [  ]   │
│ SKU002 │ Minyak 2L    │   30   │ [  ]   │
│ SKU003 │ Gula 1kg     │   40   │ [  ]   │
└──────────────────────────────────────────┘
```

### 6. Kasbon Management

**Request Flow (Employee):**
1. Fill form: amount, purpose, installments
2. Submit for approval
3. Wait for owner approval

**Approval Flow (Owner):**
1. View pending requests
2. Check employee history
3. Approve/reject with notes
4. Set payment schedule

**Payment Flow:**
1. Auto-deduct from salary (monthly), OR
2. Manual payment entry
3. Update remaining balance
4. Mark as paid when complete

### 7. Thermal Printer Integration

**Receipt Format:**
```
        TOKO SERBA ADA
      Jl. Merdeka No. 123
       Tel: 021-12345678
================================
No: INV-20250205-0001
Tanggal: 05/02/2025 14:30
Kasir: Andi Wijaya
Shift: Pagi
================================
Beras Premium 5kg
  1 x Rp 65,000      Rp 65,000

Air Mineral 600ml
 10 x Rp 3,500       Rp 35,000
--------------------------------
Subtotal            Rp 100,000
Pajak 11%            Rp 11,000
================================
TOTAL               Rp 111,000
Bayar               Rp 120,000
Kembali               Rp 9,000
================================
      Terima Kasih
   Barang yang sudah dibeli
  tidak dapat dikembalikan
================================
    [QR Code untuk feedback]
```

**Print Options:**
- Auto-print after transaction
- Reprint from transaction history
- Print to PDF (backup)
- Print daily report
- Print shift summary

---

## 🚀 Performance Optimization

### 1. Code Splitting
```typescript
// Dynamic imports for heavy components
const ReportExport = dynamic(() => import('@/components/reports/ExportButton'));
const AdvancedChart = dynamic(() => import('@/components/analytics/AdvancedChart'));
```

### 2. Data Fetching Strategy
```typescript
// Server Components for initial data
// Client Components for interactions
// SWR/React Query for real-time updates
// Optimistic UI updates

// Example:
const { data, mutate } = useSWR('/api/products', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 minute
});
```

### 3. Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={product.image_url}
  alt={product.name}
  width={200}
  height={200}
  placeholder="blur"
/>
```

### 4. Caching Strategy
```typescript
// Redis caching for:
// - Active shift sessions
// - Product list (with TTL)
// - Daily reports
// - User permissions

// Local storage for:
// - Cart items (auto-save)
// - User preferences
// - Recent searches
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test utilities
// Test API functions
// Test calculations (tax, discount, total)
```

### Integration Tests
```typescript
// Test POS workflow
// Test shift open/close
// Test transaction creation
```

### E2E Tests (Playwright)
```typescript
// Test complete user journeys
// Test role-based access
// Test critical paths
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.4.7",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "date-fns": "^3.0.6",
    "lucide-react": "^0.307.0",
    "recharts": "^2.10.3",
    "react-to-print": "^2.15.1",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "html5-qrcode": "^2.3.8",
    "sonner": "^1.3.1",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "playwright": "^1.40.1"
  }
}
```

---

## 🔌 API Integration

### API Client Setup
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Endpoints
```typescript
// lib/api/endpoints.ts
export const endpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  
  // Products
  products: '/products',
  productById: (id: string) => `/products/${id}`,
  productsImport: '/products/import',
  
  // Transactions
  transactions: '/transactions',
  transactionById: (id: string) => `/transactions/${id}`,
  transactionPrint: (id: string) => `/transactions/${id}/print`,
  
  // Shifts
  shifts: '/shifts',
  shiftOpen: '/shifts/open',
  shiftClose: '/shifts/close',
  shiftCurrent: '/shifts/current',
  
  // Reports
  reportSales: '/reports/sales',
  reportProfitLoss: '/reports/profit-loss',
  reportExport: '/reports/export',
  
  // ... more endpoints
};
```

---

## 📝 Environment Variables

```bash
# .env.local

# App
NEXT_PUBLIC_APP_NAME="POS PRO"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# API
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Printer
NEXT_PUBLIC_PRINTER_TYPE="thermal" # thermal | pdf
NEXT_PUBLIC_PRINTER_WIDTH="80" # mm

# Features
NEXT_PUBLIC_ENABLE_BARCODE_SCANNER=true
NEXT_PUBLIC_ENABLE_CUSTOMER_DISPLAY=false
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true

# Upload
NEXT_PUBLIC_MAX_FILE_SIZE=5242880 # 5MB
NEXT_PUBLIC_ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"
```

---

## 🎓 Implementation Priority

### Phase 1 (MVP - 4 weeks)
1. ✅ Authentication & Authorization
2. ✅ Dashboard (basic analytics)
3. ✅ Product Management (CRUD)
4. ✅ POS Interface (basic)
5. ✅ Transaction List & Detail
6. ✅ Basic Reporting

### Phase 2 (Core Features - 4 weeks)
7. ✅ Shift Management
8. ✅ Multi-employee Commission
9. ✅ Inventory Management
10. ✅ Stock Opname
11. ✅ Thermal Printer Integration
12. ✅ Employee Management

### Phase 3 (Advanced - 4 weeks)
13. ✅ Cash Advance (Kasbon)
14. ✅ Customer Management
15. ✅ Purchase Orders
16. ✅ Expense Tracking
17. ✅ Advanced Reports
18. ✅ Activity Logs

### Phase 4 (Analytics & Optimization - 2 weeks)
19. ✅ Advanced Analytics
20. ✅ Performance Optimization
21. ✅ PWA Features
22. ✅ Testing & Bug Fixes

---

This documentation provides a complete blueprint for frontend development. Any AI or developer can use this to build the entire application systematically.
