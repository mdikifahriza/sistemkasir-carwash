-- =====================================================
-- POS PRO DATABASE SCHEMA & SEEDER
-- PostgreSQL / Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP TABLES (untuk reset database)
-- =====================================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS purchase_order_details CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS stock_opname_details CASCADE;
DROP TABLE IF EXISTS stock_opname CASCADE;
DROP TABLE IF EXISTS cash_advance_payments CASCADE;
DROP TABLE IF EXISTS cash_advances CASCADE;
DROP TABLE IF EXISTS transaction_employees CASCADE;
DROP TABLE IF EXISTS transaction_details CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS shift_sessions CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- =====================================================
-- TABLE: stores (Multi-Store Support)
-- =====================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: users (Pengguna/Karyawan)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'warehouse')),
    pin_code VARCHAR(6),
    avatar_url TEXT,
    employee_id VARCHAR(20),
    salary DECIMAL(15,2) DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: categories (Kategori Produk)
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: products (Produk)
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'pcs',
    purchase_price DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) NOT NULL,
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    is_trackable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: customers (Pelanggan)
-- =====================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    is_member BOOLEAN DEFAULT false,
    member_since DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: shifts (Master Shift)
-- =====================================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    shift_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: shift_sessions (Sesi Shift per Hari)
-- =====================================================
CREATE TABLE shift_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    actual_opening_balance DECIMAL(15,2),
    closing_balance DECIMAL(15,2) DEFAULT 0,
    actual_closing_balance DECIMAL(15,2),
    discrepancy DECIMAL(15,2) DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_cash DECIMAL(15,2) DEFAULT 0,
    total_cashless DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: transactions (Transaksi Penjualan)
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    shift_session_id UUID REFERENCES shift_sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'qris', 'transfer', 'e-wallet', 'split')),
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: transaction_details (Detail Item Transaksi)
-- =====================================================
CREATE TABLE transaction_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: transaction_employees (Pembagian Komisi)
-- =====================================================
CREATE TABLE transaction_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: cash_advances (Kasbon Karyawan)
-- =====================================================
CREATE TABLE cash_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    purpose TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'partial')),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2),
    paid_date TIMESTAMP,
    payment_method VARCHAR(20) CHECK (payment_method IN ('salary_deduction', 'cash', 'transfer')),
    installment_count INTEGER DEFAULT 1,
    installment_paid INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: cash_advance_payments (Pembayaran Kasbon)
-- =====================================================
CREATE TABLE cash_advance_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_advance_id UUID REFERENCES cash_advances(id) ON DELETE CASCADE,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: stock_opname (Stock Opname)
-- =====================================================
CREATE TABLE stock_opname (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    opname_number VARCHAR(50) UNIQUE NOT NULL,
    opname_date DATE NOT NULL,
    conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved')),
    total_items INTEGER DEFAULT 0,
    total_difference DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    approved_at TIMESTAMP
);

-- =====================================================
-- TABLE: stock_opname_details (Detail Stock Opname)
-- =====================================================
CREATE TABLE stock_opname_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_opname_id UUID REFERENCES stock_opname(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    system_stock DECIMAL(10,2) NOT NULL,
    actual_stock DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) GENERATED ALWAYS AS (actual_stock - system_stock) STORED,
    value_difference DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: suppliers (Pemasok)
-- =====================================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supplier_code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: purchase_orders (Pembelian)
-- =====================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'partial', 'received', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: purchase_order_details (Detail Pembelian)
-- =====================================================
CREATE TABLE purchase_order_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: expense_categories (Kategori Pengeluaran)
-- =====================================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: expenses (Pengeluaran)
-- =====================================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    shift_session_id UUID REFERENCES shift_sessions(id) ON DELETE SET NULL,
    expense_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    receipt_image TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: daily_reports (Laporan Harian)
-- =====================================================
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    report_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_cash DECIMAL(15,2) DEFAULT 0,
    total_cashless DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    total_purchases DECIMAL(15,2) DEFAULT 0,
    net_income DECIMAL(15,2) DEFAULT 0,
    gross_profit DECIMAL(15,2) DEFAULT 0,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: activity_logs (Audit Trail)
-- =====================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CREATE INDEXES untuk Performance
-- =====================================================
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(is_active);

CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_session ON transactions(shift_session_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);

CREATE INDEX idx_shift_sessions_date ON shift_sessions(session_date);
CREATE INDEX idx_shift_sessions_status ON shift_sessions(status);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_table ON activity_logs(table_name);

-- =====================================================
-- TRIGGERS: Activity Logs (Auto Audit)
-- =====================================================
CREATE OR REPLACE FUNCTION log_activity_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_record_id UUID;
    v_row JSONB;
    v_user_text TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_row := to_jsonb(OLD);
    ELSE
        v_row := to_jsonb(NEW);
    END IF;

    v_user_text := COALESCE(
        v_row->>'user_id',
        v_row->>'created_by',
        v_row->>'approved_by',
        v_row->>'conducted_by',
        v_row->>'verified_by',
        v_row->>'deleted_by'
    );

    v_user_id := COALESCE(
        auth.uid(),
        CASE
            WHEN v_user_text ~* '^[0-9a-f-]{36}$' THEN v_user_text::uuid
            ELSE NULL
        END
    );

    v_record_id := CASE
        WHEN (v_row->>'id') ~* '^[0-9a-f-]{36}$' THEN (v_row->>'id')::uuid
        ELSE NULL
    END;

    INSERT INTO activity_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_value,
        new_value,
        description
    ) VALUES (
        v_user_id,
        lower(TG_OP) || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        v_record_id,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        NULL
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all main tables (exclude activity_logs to avoid recursion)
DROP TRIGGER IF EXISTS trg_activity_logs_products ON products;
CREATE TRIGGER trg_activity_logs_products AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_categories ON categories;
CREATE TRIGGER trg_activity_logs_categories AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_customers ON customers;
CREATE TRIGGER trg_activity_logs_customers AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_users ON users;
CREATE TRIGGER trg_activity_logs_users AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_shifts ON shifts;
CREATE TRIGGER trg_activity_logs_shifts AFTER INSERT OR UPDATE OR DELETE ON shifts
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_shift_sessions ON shift_sessions;
CREATE TRIGGER trg_activity_logs_shift_sessions AFTER INSERT OR UPDATE OR DELETE ON shift_sessions
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_transactions ON transactions;
CREATE TRIGGER trg_activity_logs_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_transaction_details ON transaction_details;
CREATE TRIGGER trg_activity_logs_transaction_details AFTER INSERT OR UPDATE OR DELETE ON transaction_details
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_transaction_employees ON transaction_employees;
CREATE TRIGGER trg_activity_logs_transaction_employees AFTER INSERT OR UPDATE OR DELETE ON transaction_employees
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_cash_advances ON cash_advances;
CREATE TRIGGER trg_activity_logs_cash_advances AFTER INSERT OR UPDATE OR DELETE ON cash_advances
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_cash_advance_payments ON cash_advance_payments;
CREATE TRIGGER trg_activity_logs_cash_advance_payments AFTER INSERT OR UPDATE OR DELETE ON cash_advance_payments
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_suppliers ON suppliers;
CREATE TRIGGER trg_activity_logs_suppliers AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_purchase_orders ON purchase_orders;
CREATE TRIGGER trg_activity_logs_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_purchase_order_details ON purchase_order_details;
CREATE TRIGGER trg_activity_logs_purchase_order_details AFTER INSERT OR UPDATE OR DELETE ON purchase_order_details
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_expense_categories ON expense_categories;
CREATE TRIGGER trg_activity_logs_expense_categories AFTER INSERT OR UPDATE OR DELETE ON expense_categories
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_expenses ON expenses;
CREATE TRIGGER trg_activity_logs_expenses AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_stock_opname ON stock_opname;
CREATE TRIGGER trg_activity_logs_stock_opname AFTER INSERT OR UPDATE OR DELETE ON stock_opname
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_stock_opname_details ON stock_opname_details;
CREATE TRIGGER trg_activity_logs_stock_opname_details AFTER INSERT OR UPDATE OR DELETE ON stock_opname_details
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_stores ON stores;
CREATE TRIGGER trg_activity_logs_stores AFTER INSERT OR UPDATE OR DELETE ON stores
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

DROP TRIGGER IF EXISTS trg_activity_logs_daily_reports ON daily_reports;
CREATE TRIGGER trg_activity_logs_daily_reports AFTER INSERT OR UPDATE OR DELETE ON daily_reports
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

-- =====================================================
-- TRIGGERS untuk updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_sessions_updated_at BEFORE UPDATE ON shift_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_advances_updated_at BEFORE UPDATE ON cash_advances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEEDER DATA
-- =====================================================

-- Seeder: Store
INSERT INTO stores (store_code, name, address, phone, email, tax_percentage) VALUES
('STORE001', 'Toko Serba Ada Cabang Utama', 'Jl. Merdeka No. 123, Jakarta', '021-12345678', 'info@tokoserbaada.com', 11.00);

-- Get store_id untuk digunakan di seeder lainnya
DO $$
DECLARE
    store_uuid UUID;
    owner_uuid UUID;
    manager_uuid UUID;
    cashier1_uuid UUID;
    cashier2_uuid UUID;
    category_food_uuid UUID;
    category_drink_uuid UUID;
    category_snack_uuid UUID;
    shift_pagi_uuid UUID;
    shift_siang_uuid UUID;
    shift_malam_uuid UUID;
    session_uuid UUID;
    supplier_uuid UUID;
    product1_uuid UUID;
    product2_uuid UUID;
    product3_uuid UUID;
    expense_cat_uuid UUID;
    customer_uuid UUID;
    trx_uuid UUID;
BEGIN
    SELECT id INTO store_uuid FROM stores WHERE store_code = 'STORE001' LIMIT 1;

    -- Seeder: Users
    INSERT INTO users (store_id, username, password, full_name, email, phone, role, pin_code, employee_id, salary, commission_percentage) VALUES
    (store_uuid, 'owner', '$2b$10$rZ5qJ5pXQ5ZqJ5pXQ5ZqJON1234567890ABCDEFGH', 'Budi Santoso', 'owner@tokoserbaada.com', '08123456789', 'owner', '123456', 'EMP001', 0, 0),
    (store_uuid, 'manager', '$2b$10$rZ5qJ5pXQ5ZqJ5pXQ5ZqJON1234567890ABCDEFGH', 'Siti Nurhaliza', 'manager@tokoserbaada.com', '08234567890', 'manager', '234567', 'EMP002', 5000000, 0),
    (store_uuid, 'kasir1', '$2b$10$rZ5qJ5pXQ5ZqJ5pXQ5ZqJON1234567890ABCDEFGH', 'Andi Wijaya', 'andi@tokoserbaada.com', '08345678901', 'cashier', '345678', 'EMP003', 3500000, 2.5),
    (store_uuid, 'kasir2', '$2b$10$rZ5qJ5pXQ5ZqJ5pXQ5ZqJON1234567890ABCDEFGH', 'Dewi Lestari', 'dewi@tokoserbaada.com', '08456789012', 'cashier', '456789', 'EMP004', 3500000, 2.5),
    (store_uuid, 'warehouse', '$2b$10$rZ5qJ5pXQ5ZqJ5pXQ5ZqJON1234567890ABCDEFGH', 'Agus Setiawan', 'agus@tokoserbaada.com', '08567890123', 'warehouse', '567890', 'EMP005', 4000000, 0);

    SELECT id INTO owner_uuid FROM users WHERE username = 'owner' LIMIT 1;
    SELECT id INTO manager_uuid FROM users WHERE username = 'manager' LIMIT 1;
    SELECT id INTO cashier1_uuid FROM users WHERE username = 'kasir1' LIMIT 1;
    SELECT id INTO cashier2_uuid FROM users WHERE username = 'kasir2' LIMIT 1;

    -- Seeder: Categories
    INSERT INTO categories (store_id, name, description, icon, sort_order) VALUES
    (store_uuid, 'Makanan', 'Produk makanan dan bahan pokok', '🍚', 1),
    (store_uuid, 'Minuman', 'Minuman ringan dan berkarbonasi', '🥤', 2),
    (store_uuid, 'Snack', 'Camilan dan makanan ringan', '🍿', 3),
    (store_uuid, 'Kebutuhan Rumah Tangga', 'Alat dan bahan rumah tangga', '🏠', 4),
    (store_uuid, 'Perawatan Pribadi', 'Produk kebersihan dan perawatan', '🧴', 5);

    SELECT id INTO category_food_uuid FROM categories WHERE name = 'Makanan' LIMIT 1;
    SELECT id INTO category_drink_uuid FROM categories WHERE name = 'Minuman' LIMIT 1;
    SELECT id INTO category_snack_uuid FROM categories WHERE name = 'Snack' LIMIT 1;

    -- Seeder: Products
    INSERT INTO products (store_id, category_id, sku, barcode, name, unit, purchase_price, selling_price, stock_quantity, min_stock, created_by) VALUES
    -- Makanan
    (store_uuid, category_food_uuid, 'SKU001', '8991234567890', 'Beras Premium 5kg', 'pcs', 55000, 65000, 50, 10, owner_uuid),
    (store_uuid, category_food_uuid, 'SKU002', '8991234567891', 'Minyak Goreng 2L', 'pcs', 28000, 35000, 30, 5, owner_uuid),
    (store_uuid, category_food_uuid, 'SKU003', '8991234567892', 'Gula Pasir 1kg', 'kg', 12000, 15000, 40, 10, owner_uuid),
    (store_uuid, category_food_uuid, 'SKU004', '8991234567893', 'Tepung Terigu 1kg', 'kg', 8000, 11000, 25, 5, owner_uuid),
    
    -- Minuman
    (store_uuid, category_drink_uuid, 'SKU005', '8991234567894', 'Air Mineral 600ml', 'pcs', 2500, 3500, 100, 20, owner_uuid),
    (store_uuid, category_drink_uuid, 'SKU006', '8991234567895', 'Teh Botol Sosro 450ml', 'pcs', 3500, 5000, 80, 15, owner_uuid),
    (store_uuid, category_drink_uuid, 'SKU007', '8991234567896', 'Coca Cola 390ml', 'pcs', 4000, 6000, 60, 15, owner_uuid),
    (store_uuid, category_drink_uuid, 'SKU008', '8991234567897', 'Susu Ultra Milk 1L', 'pcs', 14000, 18000, 40, 10, owner_uuid),
    
    -- Snack
    (store_uuid, category_snack_uuid, 'SKU009', '8991234567898', 'Chitato 68g', 'pcs', 8000, 11000, 50, 10, owner_uuid),
    (store_uuid, category_snack_uuid, 'SKU010', '8991234567899', 'Oreo 137g', 'pcs', 9000, 12000, 45, 10, owner_uuid),
    (store_uuid, category_snack_uuid, 'SKU011', '8991234567900', 'Indomie Goreng', 'pcs', 2500, 3500, 200, 50, owner_uuid),
    (store_uuid, category_snack_uuid, 'SKU012', '8991234567901', 'Wafer Tango 47g', 'pcs', 2000, 3000, 60, 15, owner_uuid);

    SELECT id INTO product1_uuid FROM products WHERE sku = 'SKU001' LIMIT 1;
    SELECT id INTO product2_uuid FROM products WHERE sku = 'SKU005' LIMIT 1;
    SELECT id INTO product3_uuid FROM products WHERE sku = 'SKU009' LIMIT 1;

    -- Seeder: Customers
    INSERT INTO customers (store_id, customer_code, name, phone, email, is_member, member_since) VALUES
    (store_uuid, 'CUST001', 'Ibu Ratna', '08111222333', 'ratna@email.com', true, '2024-01-15'),
    (store_uuid, 'CUST002', 'Pak Ahmad', '08222333444', 'ahmad@email.com', true, '2024-02-20'),
    (store_uuid, 'CUST003', 'Mbak Rina', '08333444555', NULL, false, NULL),
    (store_uuid, 'CUST004', 'Bapak Hadi', '08444555666', 'hadi@email.com', true, '2023-12-10');

    SELECT id INTO customer_uuid FROM customers WHERE customer_code = 'CUST001' LIMIT 1;

    -- Seeder: Shifts
    INSERT INTO shifts (store_id, shift_name, start_time, end_time, color_code) VALUES
    (store_uuid, 'Shift Pagi', '07:00:00', '15:00:00', '#FCD34D'),
    (store_uuid, 'Shift Siang', '15:00:00', '23:00:00', '#60A5FA'),
    (store_uuid, 'Shift Malam', '23:00:00', '07:00:00', '#A78BFA');

    SELECT id INTO shift_pagi_uuid FROM shifts WHERE shift_name = 'Shift Pagi' LIMIT 1;
    SELECT id INTO shift_siang_uuid FROM shifts WHERE shift_name = 'Shift Siang' LIMIT 1;

    -- Seeder: Shift Sessions
    INSERT INTO shift_sessions (shift_id, user_id, session_date, opening_balance, actual_opening_balance, opened_at, status) VALUES
    (shift_pagi_uuid, cashier1_uuid, CURRENT_DATE, 500000, 500000, CURRENT_TIMESTAMP - INTERVAL '5 hours', 'open'),
    (shift_siang_uuid, cashier2_uuid, CURRENT_DATE - INTERVAL '1 day', 500000, 500000, CURRENT_TIMESTAMP - INTERVAL '1 day 8 hours', 'closed');

    SELECT id INTO session_uuid FROM shift_sessions WHERE status = 'open' LIMIT 1;

    -- Seeder: Suppliers
    INSERT INTO suppliers (store_id, supplier_code, name, contact_person, phone, email, payment_terms) VALUES
    (store_uuid, 'SUP001', 'PT Maju Jaya', 'Pak Budi', '021-87654321', 'purchasing@majujaya.com', 30),
    (store_uuid, 'SUP002', 'CV Sumber Rejeki', 'Bu Sari', '021-12349876', 'sari@sumberrejeki.com', 14),
    (store_uuid, 'SUP003', 'Toko Grosir Berkah', 'Pak Agus', '021-55556666', 'berkah@gmail.com', 7);

    SELECT id INTO supplier_uuid FROM suppliers WHERE supplier_code = 'SUP001' LIMIT 1;

    -- Seeder: Expense Categories
    INSERT INTO expense_categories (store_id, name, description, icon) VALUES
    (store_uuid, 'Operasional', 'Biaya operasional toko', '⚙️'),
    (store_uuid, 'Transportasi', 'Biaya transport dan pengiriman', '🚗'),
    (store_uuid, 'Utilitas', 'Listrik, air, internet', '💡'),
    (store_uuid, 'Perawatan', 'Perbaikan dan maintenance', '🔧'),
    (store_uuid, 'Lain-lain', 'Pengeluaran lainnya', '📋');

    SELECT id INTO expense_cat_uuid FROM expense_categories WHERE name = 'Operasional' LIMIT 1;

    -- Seeder: Transactions (Sample)
    INSERT INTO transactions (
        store_id, shift_session_id, customer_id, invoice_number, customer_name, 
        transaction_date, subtotal, tax_amount, total_amount, 
        payment_method, amount_paid, change_amount, created_by
    ) VALUES
    (
        store_uuid, session_uuid, customer_uuid, 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-0001', 
        'Ibu Ratna', CURRENT_TIMESTAMP - INTERVAL '2 hours', 
        100000, 11000, 111000, 'cash', 120000, 9000, cashier1_uuid
    );

    SELECT id INTO trx_uuid FROM transactions WHERE invoice_number LIKE 'INV-%0001' LIMIT 1;

    -- Seeder: Transaction Details
    INSERT INTO transaction_details (transaction_id, product_id, product_name, product_sku, quantity, unit_price, subtotal) VALUES
    (trx_uuid, product1_uuid, 'Beras Premium 5kg', 'SKU001', 1, 65000, 65000),
    (trx_uuid, product2_uuid, 'Air Mineral 600ml', 'SKU005', 10, 3500, 35000);

    -- Seeder: Transaction Employees (Komisi dibagi 2 kasir)
    INSERT INTO transaction_employees (transaction_id, user_id, percentage, amount) VALUES
    (trx_uuid, cashier1_uuid, 60.00, 66600),
    (trx_uuid, cashier2_uuid, 40.00, 44400);

    -- Seeder: Cash Advances
    INSERT INTO cash_advances (
        store_id, user_id, amount, purpose, status, 
        approved_by, approval_date, installment_count
    ) VALUES
    (store_uuid, cashier1_uuid, 2000000, 'Keperluan keluarga mendesak', 'approved', owner_uuid, CURRENT_TIMESTAMP - INTERVAL '5 days', 4),
    (store_uuid, cashier2_uuid, 1500000, 'Biaya pendidikan anak', 'pending', NULL, NULL, 3);

    -- Seeder: Expenses
    INSERT INTO expenses (
        store_id, shift_session_id, expense_category_id, amount, 
        description, expense_date, status, created_by, approved_by
    ) VALUES
    (store_uuid, session_uuid, expense_cat_uuid, 150000, 'Listrik bulan ini', CURRENT_DATE, 'approved', cashier1_uuid, manager_uuid),
    (store_uuid, session_uuid, expense_cat_uuid, 50000, 'Tinta printer', CURRENT_DATE, 'approved', cashier1_uuid, manager_uuid);

    -- Seeder: Purchase Orders
    INSERT INTO purchase_orders (
        store_id, supplier_id, po_number, order_date, 
        total_amount, payment_status, delivery_status, created_by
    ) VALUES
    (store_uuid, supplier_uuid, 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-001', CURRENT_DATE - INTERVAL '3 days', 5000000, 'unpaid', 'pending', manager_uuid);

END $$;

-- =====================================================
-- VIEWS untuk Reporting
-- =====================================================

-- View: Sales Summary per Product
CREATE OR REPLACE VIEW v_product_sales_summary AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.category_id,
    c.name as category_name,
    COUNT(DISTINCT td.transaction_id) as total_transactions,
    SUM(td.quantity) as total_quantity_sold,
    SUM(td.subtotal) as total_sales,
    AVG(td.unit_price) as avg_selling_price,
    p.purchase_price,
    SUM(td.subtotal) - (SUM(td.quantity) * p.purchase_price) as gross_profit
FROM products p
LEFT JOIN transaction_details td ON p.id = td.product_id
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.id, p.sku, p.name, p.category_id, c.name, p.purchase_price;

-- View: Daily Sales Report
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(t.transaction_date) as sales_date,
    t.store_id,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    SUM(t.subtotal) as total_subtotal,
    SUM(t.discount_amount) as total_discount,
    SUM(t.tax_amount) as total_tax,
    SUM(t.total_amount) as total_sales,
    SUM(CASE WHEN t.payment_method = 'cash' THEN t.total_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN t.payment_method != 'cash' THEN t.total_amount ELSE 0 END) as cashless_sales
FROM transactions t
WHERE t.status = 'completed'
GROUP BY DATE(t.transaction_date), t.store_id;

-- View: Employee Performance
CREATE OR REPLACE VIEW v_employee_performance AS
SELECT 
    u.id,
    u.full_name,
    u.role,
    COUNT(DISTINCT t.id) as total_transactions,
    SUM(t.total_amount) as total_sales,
    SUM(te.amount) as total_commission,
    COUNT(DISTINCT DATE(t.transaction_date)) as active_days
FROM users u
LEFT JOIN transactions t ON u.id = t.created_by AND t.status = 'completed'
LEFT JOIN transaction_employees te ON u.id = te.user_id
WHERE u.role IN ('cashier', 'manager')
GROUP BY u.id, u.full_name, u.role;

-- View: Low Stock Products
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    c.name as category_name,
    p.stock_quantity,
    p.min_stock,
    (p.min_stock - p.stock_quantity) as stock_needed,
    p.purchase_price,
    (p.min_stock - p.stock_quantity) * p.purchase_price as estimated_purchase_cost
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock
AND p.is_active = true
ORDER BY (p.min_stock - p.stock_quantity) DESC;

-- =====================================================
-- FUNCTIONS untuk Business Logic
-- =====================================================

-- Function: Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number(store_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
    today_date VARCHAR;
    counter INTEGER;
    invoice_num VARCHAR;
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO counter
    FROM transactions
    WHERE store_id = store_uuid
    AND DATE(transaction_date) = CURRENT_DATE;
    
    invoice_num := 'INV-' || today_date || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Transaction Total
CREATE OR REPLACE FUNCTION calculate_transaction_total(trx_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    subtotal_amount DECIMAL;
    discount_amt DECIMAL;
    tax_amt DECIMAL;
    total DECIMAL;
BEGIN
    SELECT 
        SUM(td.subtotal),
        COALESCE(t.discount_amount, 0),
        COALESCE(t.tax_amount, 0)
    INTO subtotal_amount, discount_amt, tax_amt
    FROM transaction_details td
    JOIN transactions t ON td.transaction_id = t.id
    WHERE td.transaction_id = trx_id
    GROUP BY t.discount_amount, t.tax_amount;
    
    total := subtotal_amount - discount_amt + tax_amt;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function: Update Product Stock after Transaction
CREATE OR REPLACE FUNCTION update_product_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_after_transaction
AFTER INSERT ON transaction_details
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_after_transaction();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) untuk Multi-Store
-- =====================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own store data
CREATE POLICY store_isolation_policy ON users
    FOR ALL
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy_products ON products
    FOR ALL
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy_transactions ON transactions
    FOR ALL
    USING (store_id = current_setting('app.current_store_id')::UUID);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Sesuaikan dengan user Supabase Anda
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Database schema dan seeder berhasil dibuat
-- Total Tables: 21
-- Total Views: 4
-- Total Functions: 3
-- Total Triggers: 15+
