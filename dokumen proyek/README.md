# POS PRO - Database Documentation

## 📋 Daftar Isi
1. [Instalasi](#instalasi)
2. [Struktur Database](#struktur-database)
3. [Cara Penggunaan](#cara-penggunaan)
4. [API Endpoints](#api-endpoints)
5. [Security & Best Practices](#security--best-practices)

---

## 🚀 Instalasi

### Menggunakan Supabase Dashboard

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com
   - Login atau buat akun baru
   - Buat project baru

2. **Jalankan SQL Script**
   - Buka SQL Editor di Supabase Dashboard
   - Copy seluruh isi file `pos_database_schema.sql`
   - Paste ke SQL Editor
   - Klik "Run" untuk eksekusi

3. **Verifikasi**
   ```sql
   -- Cek semua tabel berhasil dibuat
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Cek data seeder
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM categories;
   ```

### Menggunakan PostgreSQL Lokal

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Buat Database**
   ```bash
   createdb pos_pro_db
   ```

3. **Import SQL Script**
   ```bash
   psql -d pos_pro_db -f pos_database_schema.sql
   ```

---

## 📊 Struktur Database

### Core Tables (21 Tables)

#### 1. **stores** - Master Toko
- Multi-store support
- Konfigurasi pajak dan mata uang
- Logo dan branding

#### 2. **users** - Pengguna/Karyawan
- 4 Role: owner, manager, cashier, warehouse
- PIN untuk quick login
- Commission tracking
- Salary management

#### 3. **products** - Produk
- SKU dan Barcode
- Stock tracking
- Purchase & selling price
- Multi-level category

#### 4. **categories** - Kategori Produk
- Hierarchical (parent-child)
- Icon support
- Sort order

#### 5. **customers** - Pelanggan
- Customer code auto-generated
- Loyalty points
- Member status
- Transaction history tracking

#### 6. **shifts** - Master Shift
- Shift name (Pagi/Siang/Malam)
- Start & end time
- Color coding

#### 7. **shift_sessions** - Sesi Shift Harian
- Modal awal dan akhir
- Discrepancy tracking
- Sales summary per shift
- Status: open/closed

#### 8. **transactions** - Transaksi Penjualan
- Invoice auto-generated
- Multiple payment methods
- Soft delete support
- Audit trail (created_by, deleted_by)

#### 9. **transaction_details** - Detail Item
- Snapshot harga saat transaksi
- Quantity & discount per item
- Notes per item

#### 10. **transaction_employees** - Pembagian Komisi
- Multi-employee per transaksi
- Percentage split
- Amount calculation

#### 11. **cash_advances** - Kasbon Karyawan
- Approval workflow
- Installment support
- Payment tracking
- Salary deduction integration

#### 12. **cash_advance_payments** - Pembayaran Kasbon
- Payment history
- Multiple payment methods
- Running balance

#### 13. **stock_opname** - Stock Opname
- Opname number auto-generated
- Multi-status workflow
- Conducted & verified by tracking

#### 14. **stock_opname_details** - Detail Opname
- System vs Actual stock
- Auto-calculated difference
- Value difference
- Notes untuk alasan selisih

#### 15. **suppliers** - Pemasok
- Supplier code
- Payment terms
- Tax ID
- Contact management

#### 16. **purchase_orders** - Pembelian
- PO number auto-generated
- Payment & delivery status tracking
- Multi-item support

#### 17. **purchase_order_details** - Detail Pembelian
- Quantity ordered vs received
- Unit price snapshot

#### 18. **expense_categories** - Kategori Pengeluaran
- Customizable categories
- Icon support

#### 19. **expenses** - Pengeluaran
- Receipt image upload
- Approval workflow
- Shift session linkage

#### 20. **daily_reports** - Laporan Harian
- Auto-generated daily summary
- Net income calculation
- Gross profit tracking

#### 21. **activity_logs** - Audit Trail
- Complete action logging
- Old & new value (JSON)
- IP address & user agent
- Cannot be deleted

---

## 🔧 Cara Penggunaan

### 1. Login & Authentikasi

```javascript
// Default users dari seeder:
const users = [
  { username: 'owner', password: 'password123', role: 'owner' },
  { username: 'manager', password: 'password123', role: 'manager' },
  { username: 'kasir1', password: 'password123', role: 'cashier' },
  { username: 'kasir2', password: 'password123', role: 'cashier' },
];

// CATATAN: Password di seeder adalah hash dummy
// Ganti dengan hash bcrypt yang real untuk production
```

### 2. Buka Shift

```sql
-- Kasir membuka shift
INSERT INTO shift_sessions (
    shift_id, 
    user_id, 
    session_date, 
    opening_balance, 
    actual_opening_balance,
    opened_at,
    status
) VALUES (
    'shift_id_here',
    'user_id_here',
    CURRENT_DATE,
    500000,
    500000,
    CURRENT_TIMESTAMP,
    'open'
);
```

### 3. Buat Transaksi

```sql
-- Step 1: Insert transaction header
INSERT INTO transactions (
    store_id,
    shift_session_id,
    invoice_number,
    customer_name,
    transaction_date,
    payment_method,
    created_by
) VALUES (
    'store_uuid',
    'session_uuid',
    generate_invoice_number('store_uuid'), -- auto-generate
    'Customer Name',
    CURRENT_TIMESTAMP,
    'cash',
    'user_uuid'
) RETURNING id;

-- Step 2: Insert transaction details
INSERT INTO transaction_details (
    transaction_id,
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    subtotal
) VALUES (
    'transaction_uuid',
    'product_uuid',
    'Product Name',
    'SKU001',
    2,
    50000,
    100000
);

-- Step 3: Insert employee commission (jika multi-employee)
INSERT INTO transaction_employees (
    transaction_id,
    user_id,
    percentage,
    amount
) VALUES 
    ('transaction_uuid', 'kasir1_uuid', 60.00, 60000),
    ('transaction_uuid', 'kasir2_uuid', 40.00, 40000);

-- Step 4: Update transaction total
UPDATE transactions
SET 
    subtotal = 100000,
    tax_amount = 11000,
    total_amount = 111000,
    amount_paid = 120000,
    change_amount = 9000
WHERE id = 'transaction_uuid';
```

### 4. Tutup Shift

```sql
UPDATE shift_sessions
SET 
    actual_closing_balance = 1500000, -- input dari kasir
    closing_balance = 1480000, -- dari sistem
    discrepancy = -20000, -- selisih
    total_sales = 1000000,
    total_transactions = 25,
    total_cash = 800000,
    total_cashless = 200000,
    total_expenses = 150000,
    closed_at = CURRENT_TIMESTAMP,
    status = 'closed'
WHERE id = 'session_uuid';
```

### 5. Stock Opname

```sql
-- Step 1: Buat session opname
INSERT INTO stock_opname (
    store_id,
    opname_number,
    opname_date,
    conducted_by,
    status
) VALUES (
    'store_uuid',
    'SO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-001',
    CURRENT_DATE,
    'user_uuid',
    'draft'
) RETURNING id;

-- Step 2: Input hasil counting
INSERT INTO stock_opname_details (
    stock_opname_id,
    product_id,
    system_stock,
    actual_stock,
    notes
) 
SELECT 
    'opname_uuid',
    id,
    stock_quantity,
    0, -- will be updated with actual count
    ''
FROM products
WHERE is_active = true;

-- Step 3: Update dengan hasil counting fisik
UPDATE stock_opname_details
SET actual_stock = 45
WHERE product_id = 'product_uuid' AND stock_opname_id = 'opname_uuid';

-- Step 4: Approve dan update stock
UPDATE stock_opname
SET status = 'approved', verified_by = 'owner_uuid'
WHERE id = 'opname_uuid';

-- Step 5: Apply adjustment ke products
UPDATE products p
SET stock_quantity = sod.actual_stock
FROM stock_opname_details sod
WHERE p.id = sod.product_id
AND sod.stock_opname_id = 'opname_uuid';
```

### 6. Kasbon Karyawan

```sql
-- Karyawan mengajukan kasbon
INSERT INTO cash_advances (
    store_id,
    user_id,
    amount,
    purpose,
    status,
    installment_count
) VALUES (
    'store_uuid',
    'employee_uuid',
    2000000,
    'Biaya rumah sakit',
    'pending',
    4
);

-- Owner approve
UPDATE cash_advances
SET 
    status = 'approved',
    approved_by = 'owner_uuid',
    approval_date = CURRENT_TIMESTAMP,
    remaining_amount = amount
WHERE id = 'cash_advance_uuid';

-- Pembayaran cicilan
INSERT INTO cash_advance_payments (
    cash_advance_id,
    amount,
    payment_method,
    created_by
) VALUES (
    'cash_advance_uuid',
    500000,
    'salary_deduction',
    'owner_uuid'
);

-- Update remaining amount
UPDATE cash_advances
SET 
    paid_amount = paid_amount + 500000,
    remaining_amount = amount - (paid_amount + 500000),
    installment_paid = installment_paid + 1,
    status = CASE 
        WHEN (paid_amount + 500000) >= amount THEN 'paid'
        ELSE 'partial'
    END
WHERE id = 'cash_advance_uuid';
```

---

## 🔗 API Endpoints (Contoh)

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
GET    /api/auth/me
```

### Products
```
GET    /api/products              # List all products
GET    /api/products/:id          # Get product detail
POST   /api/products              # Create product (owner/manager)
PUT    /api/products/:id          # Update product (owner/manager)
DELETE /api/products/:id          # Delete product (owner only)
GET    /api/products/low-stock    # Low stock alert
POST   /api/products/import       # Import from Excel
GET    /api/products/export       # Export to Excel
```

### Transactions
```
GET    /api/transactions          # List transactions
GET    /api/transactions/:id      # Get transaction detail
POST   /api/transactions          # Create transaction
PUT    /api/transactions/:id      # Edit transaction (owner only)
DELETE /api/transactions/:id      # Void transaction (owner only)
POST   /api/transactions/:id/print # Reprint receipt
GET    /api/transactions/report   # Sales report
```

### Shifts
```
GET    /api/shifts                # List shifts
POST   /api/shifts/open           # Open shift
POST   /api/shifts/close          # Close shift
GET    /api/shifts/current        # Get current shift
GET    /api/shifts/history        # Shift history
```

### Cash Advances
```
GET    /api/cash-advances         # List kasbon
POST   /api/cash-advances         # Request kasbon
PUT    /api/cash-advances/:id/approve   # Approve (owner)
PUT    /api/cash-advances/:id/reject    # Reject (owner)
POST   /api/cash-advances/:id/payment   # Add payment
```

### Stock Opname
```
GET    /api/stock-opname          # List opname
POST   /api/stock-opname          # Create opname
PUT    /api/stock-opname/:id      # Update opname
POST   /api/stock-opname/:id/approve # Approve & apply
GET    /api/stock-opname/:id/report  # Opname report
```

### Reports
```
GET    /api/reports/daily         # Daily report
GET    /api/reports/sales         # Sales report
GET    /api/reports/profit        # Profit report
GET    /api/reports/employee      # Employee performance
GET    /api/reports/product       # Product performance
GET    /api/reports/export        # Export to Excel/PDF
```

---

## 🔐 Security & Best Practices

### 1. Password Hashing
```javascript
// Gunakan bcrypt untuk hash password
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Hash password
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### 2. JWT Authentication
```javascript
// Generate JWT token
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { 
    userId: user.id,
    username: user.username,
    role: user.role,
    storeId: user.store_id
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 3. Row Level Security (RLS)
```sql
-- Set store context untuk setiap request
SET LOCAL app.current_store_id = 'store_uuid_here';

-- Query akan otomatis filter by store
SELECT * FROM products; -- hanya show produk store ini
```

### 4. Activity Logging
```javascript
// Log setiap action penting
async function logActivity(userId, action, tableName, recordId, oldValue, newValue) {
  await db.activity_logs.insert({
    user_id: userId,
    action: action, // 'create', 'update', 'delete', 'void'
    table_name: tableName,
    record_id: recordId,
    old_value: oldValue,
    new_value: newValue,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });
}
```

### 5. Soft Delete
```javascript
// Jangan hard delete, gunakan soft delete
async function deleteTransaction(transactionId, userId) {
  await db.transactions.update({
    id: transactionId
  }, {
    deleted_at: new Date(),
    deleted_by: userId,
    status: 'cancelled'
  });
}
```

### 6. Permission Check
```javascript
// Middleware untuk check permission
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions' 
      });
    }
    next();
  };
}

// Usage
app.delete('/api/transactions/:id', 
  authenticate, 
  requireRole(['owner']), 
  deleteTransaction
);
```

### 7. Input Validation
```javascript
// Gunakan library seperti Joi atau Zod
const Joi = require('joi');

const transactionSchema = Joi.object({
  customer_name: Joi.string().max(100),
  items: Joi.array().min(1).required(),
  payment_method: Joi.string().valid('cash', 'card', 'qris', 'transfer').required(),
  amount_paid: Joi.number().positive().required()
});

// Validate
const { error, value } = transactionSchema.validate(req.body);
```

### 8. Rate Limiting
```javascript
// Protect API dari abuse
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📱 Thermal Printer Integration

### ESC/POS Command Example

```javascript
const escpos = require('escpos');
const device = new escpos.USB();
const printer = new escpos.Printer(device);

function printReceipt(transaction) {
  device.open(function(){
    printer
      .align('ct') // center
      .style('bu') // bold + underline
      .size(2, 2)
      .text('TOKO SERBA ADA')
      .size(1, 1)
      .style('normal')
      .text('Jl. Merdeka No. 123')
      .text('Telp: 021-12345678')
      .text('--------------------------------')
      .align('lt') // left
      .text(`No: ${transaction.invoice_number}`)
      .text(`Tanggal: ${formatDate(transaction.transaction_date)}`)
      .text(`Kasir: ${transaction.cashier_name}`)
      .text('--------------------------------')
      .tableCustom([
        { text: 'Item', width: 0.5 },
        { text: 'Qty', width: 0.15, align: 'right' },
        { text: 'Harga', width: 0.35, align: 'right' }
      ]);
      
    transaction.items.forEach(item => {
      printer.tableCustom([
        { text: item.name, width: 0.5 },
        { text: item.quantity.toString(), width: 0.15, align: 'right' },
        { text: formatCurrency(item.subtotal), width: 0.35, align: 'right' }
      ]);
    });
    
    printer
      .text('--------------------------------')
      .tableCustom([
        { text: 'Subtotal', width: 0.65 },
        { text: formatCurrency(transaction.subtotal), width: 0.35, align: 'right' }
      ])
      .tableCustom([
        { text: 'Pajak', width: 0.65 },
        { text: formatCurrency(transaction.tax_amount), width: 0.35, align: 'right' }
      ])
      .tableCustom([
        { text: 'TOTAL', width: 0.65 },
        { text: formatCurrency(transaction.total_amount), width: 0.35, align: 'right' }
      ])
      .text('--------------------------------')
      .tableCustom([
        { text: 'Bayar', width: 0.65 },
        { text: formatCurrency(transaction.amount_paid), width: 0.35, align: 'right' }
      ])
      .tableCustom([
        { text: 'Kembali', width: 0.65 },
        { text: formatCurrency(transaction.change_amount), width: 0.35, align: 'right' }
      ])
      .text('--------------------------------')
      .align('ct')
      .text('Terima Kasih')
      .text('Barang yang sudah dibeli')
      .text('tidak dapat dikembalikan')
      .feed(3)
      .cut()
      .close();
  });
}
```

---

## 🎯 Best Practices

1. **Selalu gunakan Transaction** untuk operasi yang melibatkan multiple tables
2. **Backup database** secara berkala (minimal daily)
3. **Monitor performance** dengan slow query log
4. **Implement caching** untuk data yang sering diakses (Redis)
5. **Gunakan prepared statements** untuk prevent SQL injection
6. **Validasi input** di backend, jangan hanya di frontend
7. **Log semua critical actions** di activity_logs
8. **Test disaster recovery** procedure secara berkala
9. **Implement feature flags** untuk rollout bertahap
10. **Document API** dengan Swagger/OpenAPI

---

## 📞 Support

Jika ada pertanyaan atau issue:
- Email: support@yourcompany.com
- Dokumentasi: https://docs.yourcompany.com
- Issue Tracker: https://github.com/yourcompany/pos-pro

---

**Version:** 1.0.0  
**Last Updated:** 2025-02-05  
**License:** Proprietary
