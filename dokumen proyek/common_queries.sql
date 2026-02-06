-- =====================================================
-- COMMON QUERIES untuk POS PRO
-- Query-query yang sering digunakan
-- =====================================================

-- =====================================================
-- 1. DASHBOARD QUERIES
-- =====================================================

-- Dashboard: Summary Hari Ini
SELECT 
    COUNT(*) as total_transactions,
    SUM(total_amount) as total_sales,
    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN payment_method != 'cash' THEN total_amount ELSE 0 END) as cashless_sales,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM transactions
WHERE DATE(transaction_date) = CURRENT_DATE
AND status = 'completed';

-- Dashboard: Top 5 Products Hari Ini
SELECT 
    p.name,
    p.sku,
    SUM(td.quantity) as total_sold,
    SUM(td.subtotal) as total_revenue
FROM transaction_details td
JOIN products p ON td.product_id = p.id
JOIN transactions t ON td.transaction_id = t.id
WHERE DATE(t.transaction_date) = CURRENT_DATE
AND t.status = 'completed'
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 5;

-- Dashboard: Sales Trend Last 7 Days
SELECT 
    DATE(transaction_date) as date,
    COUNT(*) as transactions,
    SUM(total_amount) as sales,
    AVG(total_amount) as avg_order_value
FROM transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '7 days'
AND status = 'completed'
GROUP BY DATE(transaction_date)
ORDER BY date;

-- Dashboard: Low Stock Alert
SELECT 
    p.id,
    p.sku,
    p.name,
    c.name as category,
    p.stock_quantity,
    p.min_stock,
    (p.min_stock - p.stock_quantity) as need_restock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock
AND p.is_active = true
ORDER BY (p.min_stock - p.stock_quantity) DESC;

-- Dashboard: Shift yang Sedang Berjalan
SELECT 
    ss.id,
    s.shift_name,
    u.full_name as cashier,
    ss.session_date,
    ss.opened_at,
    ss.opening_balance,
    COUNT(DISTINCT t.id) as transactions_count,
    COALESCE(SUM(t.total_amount), 0) as current_sales
FROM shift_sessions ss
JOIN shifts s ON ss.shift_id = s.id
JOIN users u ON ss.user_id = u.id
LEFT JOIN transactions t ON ss.id = t.shift_session_id AND t.status = 'completed'
WHERE ss.status = 'open'
GROUP BY ss.id, s.shift_name, u.full_name, ss.session_date, ss.opened_at, ss.opening_balance;

-- =====================================================
-- 2. REPORTING QUERIES
-- =====================================================

-- Report: Penjualan per Kategori (Bulan Ini)
SELECT 
    c.name as category,
    COUNT(DISTINCT t.id) as transactions,
    SUM(td.quantity) as items_sold,
    SUM(td.subtotal) as total_sales,
    ROUND(SUM(td.subtotal) * 100.0 / (SELECT SUM(total_amount) FROM transactions WHERE DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) AND status = 'completed'), 2) as percentage
FROM transaction_details td
JOIN products p ON td.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN transactions t ON td.transaction_id = t.id
WHERE DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
AND t.status = 'completed'
GROUP BY c.id, c.name
ORDER BY total_sales DESC;

-- Report: Performance per Kasir (Bulan Ini)
SELECT 
    u.full_name as cashier,
    COUNT(DISTINCT t.id) as total_transactions,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction,
    SUM(te.amount) as total_commission,
    COUNT(DISTINCT DATE(t.transaction_date)) as active_days
FROM users u
LEFT JOIN transactions t ON u.id = t.created_by AND t.status = 'completed'
LEFT JOIN transaction_employees te ON u.id = te.user_id
WHERE u.role = 'cashier'
AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.full_name
ORDER BY total_sales DESC;

-- Report: Laba Rugi Harian
SELECT 
    DATE(t.transaction_date) as date,
    SUM(t.total_amount) as gross_sales,
    SUM(t.discount_amount) as total_discounts,
    SUM(t.total_amount - t.discount_amount) as net_sales,
    SUM(td.quantity * p.purchase_price) as cogs,
    SUM(t.total_amount - t.discount_amount) - SUM(td.quantity * p.purchase_price) as gross_profit,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE(expense_date) = DATE(t.transaction_date)) as expenses,
    SUM(t.total_amount - t.discount_amount) - SUM(td.quantity * p.purchase_price) - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE(expense_date) = DATE(t.transaction_date)) as net_profit
FROM transactions t
JOIN transaction_details td ON t.id = td.transaction_id
JOIN products p ON td.product_id = p.id
WHERE t.status = 'completed'
AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(t.transaction_date)
ORDER BY date DESC;

-- Report: Top Customers (by Total Spending)
SELECT 
    c.customer_code,
    c.name,
    c.phone,
    COUNT(t.id) as total_transactions,
    SUM(t.total_amount) as total_spent,
    MAX(t.transaction_date) as last_transaction,
    c.loyalty_points
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
GROUP BY c.id, c.customer_code, c.name, c.phone, c.loyalty_points
ORDER BY total_spent DESC NULLS LAST
LIMIT 20;

-- Report: Hourly Sales Pattern
SELECT 
    EXTRACT(HOUR FROM transaction_date) as hour,
    COUNT(*) as transactions,
    SUM(total_amount) as sales,
    AVG(total_amount) as avg_order_value
FROM transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
AND status = 'completed'
GROUP BY EXTRACT(HOUR FROM transaction_date)
ORDER BY hour;

-- Report: Product Movement (Fast vs Slow Moving)
WITH product_sales AS (
    SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(td.quantity) as total_sold,
        SUM(td.subtotal) as total_revenue,
        p.stock_quantity,
        CASE 
            WHEN SUM(td.quantity) >= 100 THEN 'Fast Moving'
            WHEN SUM(td.quantity) >= 50 THEN 'Medium Moving'
            WHEN SUM(td.quantity) > 0 THEN 'Slow Moving'
            ELSE 'No Movement'
        END as movement_category
    FROM products p
    LEFT JOIN transaction_details td ON p.id = td.product_id
    LEFT JOIN transactions t ON td.transaction_id = t.id 
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        AND t.status = 'completed'
    GROUP BY p.id, p.name, p.sku, p.stock_quantity
)
SELECT 
    movement_category,
    COUNT(*) as product_count,
    SUM(total_sold) as total_units_sold,
    SUM(total_revenue) as total_revenue
FROM product_sales
GROUP BY movement_category
ORDER BY 
    CASE movement_category
        WHEN 'Fast Moving' THEN 1
        WHEN 'Medium Moving' THEN 2
        WHEN 'Slow Moving' THEN 3
        WHEN 'No Movement' THEN 4
    END;

-- =====================================================
-- 3. INVENTORY QUERIES
-- =====================================================

-- Inventory: Stock Value
SELECT 
    c.name as category,
    COUNT(p.id) as total_products,
    SUM(p.stock_quantity) as total_units,
    SUM(p.stock_quantity * p.purchase_price) as purchase_value,
    SUM(p.stock_quantity * p.selling_price) as selling_value,
    SUM(p.stock_quantity * (p.selling_price - p.purchase_price)) as potential_profit
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
GROUP BY c.id, c.name
ORDER BY purchase_value DESC;

-- Inventory: Products Need Restock
SELECT 
    p.sku,
    p.name,
    c.name as category,
    p.stock_quantity as current_stock,
    p.min_stock,
    (p.min_stock - p.stock_quantity + 10) as suggested_order_qty,
    p.purchase_price,
    (p.min_stock - p.stock_quantity + 10) * p.purchase_price as estimated_cost
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock
AND p.is_active = true
ORDER BY (p.min_stock - p.stock_quantity) DESC;

-- Inventory: Stock Movement History (Last 30 days)
SELECT 
    DATE(t.transaction_date) as date,
    p.name as product,
    p.sku,
    SUM(td.quantity) as qty_sold,
    p.stock_quantity as current_stock
FROM transaction_details td
JOIN products p ON td.product_id = p.id
JOIN transactions t ON td.transaction_id = t.id
WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
AND t.status = 'completed'
GROUP BY DATE(t.transaction_date), p.id, p.name, p.sku, p.stock_quantity
ORDER BY date DESC, qty_sold DESC;

-- Inventory: Dead Stock (No sales in 90 days)
SELECT 
    p.id,
    p.sku,
    p.name,
    p.stock_quantity,
    p.stock_quantity * p.purchase_price as tied_capital,
    MAX(t.transaction_date) as last_sold_date,
    CURRENT_DATE - MAX(DATE(t.transaction_date)) as days_since_last_sale
FROM products p
LEFT JOIN transaction_details td ON p.id = td.product_id
LEFT JOIN transactions t ON td.transaction_id = t.id AND t.status = 'completed'
WHERE p.is_active = true
GROUP BY p.id, p.sku, p.name, p.stock_quantity, p.purchase_price
HAVING MAX(t.transaction_date) < CURRENT_DATE - INTERVAL '90 days' OR MAX(t.transaction_date) IS NULL
ORDER BY tied_capital DESC;

-- =====================================================
-- 4. EMPLOYEE & PAYROLL QUERIES
-- =====================================================

-- Employee: Commission Summary (Bulan Ini)
SELECT 
    u.employee_id,
    u.full_name,
    u.salary as base_salary,
    COUNT(DISTINCT te.transaction_id) as transactions_with_commission,
    SUM(te.amount) as total_commission,
    u.salary + COALESCE(SUM(te.amount), 0) as total_earning
FROM users u
LEFT JOIN transaction_employees te ON u.id = te.user_id
LEFT JOIN transactions t ON te.transaction_id = t.id 
    AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
    AND t.status = 'completed'
WHERE u.role IN ('cashier', 'manager')
GROUP BY u.id, u.employee_id, u.full_name, u.salary
ORDER BY total_earning DESC;

-- Employee: Kasbon Status
SELECT 
    u.employee_id,
    u.full_name,
    ca.amount as kasbon_amount,
    ca.paid_amount,
    ca.remaining_amount,
    ca.installment_count,
    ca.installment_paid,
    ca.status,
    ca.purpose,
    ca.created_at as request_date,
    ca.approval_date
FROM cash_advances ca
JOIN users u ON ca.user_id = u.id
WHERE ca.status IN ('approved', 'partial')
ORDER BY ca.created_at DESC;

-- Employee: Attendance & Work Hours per Shift
SELECT 
    u.full_name,
    COUNT(DISTINCT ss.id) as shifts_worked,
    SUM(EXTRACT(EPOCH FROM (ss.closed_at - ss.opened_at))/3600) as total_hours,
    AVG(EXTRACT(EPOCH FROM (ss.closed_at - ss.opened_at))/3600) as avg_hours_per_shift
FROM users u
JOIN shift_sessions ss ON u.id = ss.user_id
WHERE ss.status = 'closed'
AND ss.session_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.full_name
ORDER BY shifts_worked DESC;

-- =====================================================
-- 5. FINANCIAL QUERIES
-- =====================================================

-- Finance: Daily Cash Flow
SELECT 
    DATE(transaction_date) as date,
    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_in,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE(expense_date) = DATE(t.transaction_date)) as cash_out,
    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) - 
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE(expense_date) = DATE(t.transaction_date)) as net_cash_flow
FROM transactions t
WHERE t.status = 'completed'
AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(transaction_date)
ORDER BY date DESC;

-- Finance: Expense Breakdown by Category
SELECT 
    ec.name as category,
    COUNT(e.id) as transactions,
    SUM(e.amount) as total_amount,
    ROUND(SUM(e.amount) * 100.0 / (SELECT SUM(amount) FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)), 2) as percentage
FROM expenses e
LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
WHERE DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
AND e.status = 'approved'
GROUP BY ec.id, ec.name
ORDER BY total_amount DESC;

-- Finance: Payment Method Distribution
SELECT 
    payment_method,
    COUNT(*) as transactions,
    SUM(total_amount) as total_sales,
    ROUND(AVG(total_amount), 0) as avg_transaction,
    ROUND(SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM transactions WHERE status = 'completed'), 2) as percentage
FROM transactions
WHERE status = 'completed'
AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY payment_method
ORDER BY total_sales DESC;

-- Finance: Outstanding Payables (Supplier)
SELECT 
    s.name as supplier,
    COUNT(po.id) as total_po,
    SUM(po.total_amount) as total_amount,
    SUM(po.paid_amount) as paid_amount,
    SUM(po.total_amount - po.paid_amount) as outstanding,
    MIN(po.order_date) as oldest_po_date
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.payment_status IN ('unpaid', 'partial')
GROUP BY s.id, s.name
ORDER BY outstanding DESC;

-- =====================================================
-- 6. CUSTOMER QUERIES
-- =====================================================

-- Customer: RFM Analysis (Recency, Frequency, Monetary)
WITH rfm AS (
    SELECT 
        c.id,
        c.name,
        c.customer_code,
        CURRENT_DATE - MAX(DATE(t.transaction_date)) as recency_days,
        COUNT(t.id) as frequency,
        SUM(t.total_amount) as monetary
    FROM customers c
    LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
    GROUP BY c.id, c.name, c.customer_code
)
SELECT 
    customer_code,
    name,
    recency_days,
    frequency,
    monetary,
    CASE 
        WHEN recency_days <= 30 AND frequency >= 10 AND monetary >= 1000000 THEN 'VIP'
        WHEN recency_days <= 60 AND frequency >= 5 AND monetary >= 500000 THEN 'Loyal'
        WHEN recency_days <= 90 THEN 'Active'
        WHEN recency_days > 90 THEN 'At Risk'
        ELSE 'New'
    END as customer_segment
FROM rfm
ORDER BY monetary DESC;

-- Customer: Birthday This Month (for Promo)
SELECT 
    customer_code,
    name,
    phone,
    email,
    date_of_birth,
    loyalty_points,
    total_spent
FROM customers
WHERE EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
AND is_active = true
ORDER BY EXTRACT(DAY FROM date_of_birth);

-- =====================================================
-- 7. AUDIT & COMPLIANCE QUERIES
-- =====================================================

-- Audit: Void/Deleted Transactions
SELECT 
    t.invoice_number,
    t.transaction_date,
    t.total_amount,
    t.status,
    t.deleted_at,
    u1.full_name as created_by,
    u2.full_name as deleted_by,
    t.notes
FROM transactions t
LEFT JOIN users u1 ON t.created_by = u1.id
LEFT JOIN users u2 ON t.deleted_by = u2.id
WHERE t.deleted_at IS NOT NULL
OR t.status IN ('cancelled', 'refunded')
ORDER BY t.deleted_at DESC;

-- Audit: Recent Activity Logs (Last 100)
SELECT 
    al.created_at,
    u.full_name as user,
    u.role,
    al.action,
    al.table_name,
    al.description,
    al.ip_address
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;

-- Audit: Price Changes
SELECT 
    al.created_at,
    u.full_name as changed_by,
    p.name as product,
    al.old_value->>'selling_price' as old_price,
    al.new_value->>'selling_price' as new_price,
    al.description
FROM activity_logs al
JOIN users u ON al.user_id = u.id
JOIN products p ON al.record_id = p.id
WHERE al.table_name = 'products'
AND al.action = 'update'
AND al.old_value->>'selling_price' IS DISTINCT FROM al.new_value->>'selling_price'
ORDER BY al.created_at DESC;

-- =====================================================
-- 8. ADVANCED ANALYTICS
-- =====================================================

-- Analytics: Cohort Analysis (Customer Retention)
WITH first_purchase AS (
    SELECT 
        customer_id,
        DATE_TRUNC('month', MIN(transaction_date)) as cohort_month
    FROM transactions
    WHERE status = 'completed'
    AND customer_id IS NOT NULL
    GROUP BY customer_id
),
purchases AS (
    SELECT 
        t.customer_id,
        DATE_TRUNC('month', t.transaction_date) as purchase_month,
        t.total_amount
    FROM transactions t
    WHERE t.status = 'completed'
    AND t.customer_id IS NOT NULL
)
SELECT 
    fp.cohort_month,
    EXTRACT(MONTH FROM AGE(p.purchase_month, fp.cohort_month)) as month_number,
    COUNT(DISTINCT p.customer_id) as customers,
    SUM(p.total_amount) as revenue
FROM first_purchase fp
JOIN purchases p ON fp.customer_id = p.customer_id
GROUP BY fp.cohort_month, EXTRACT(MONTH FROM AGE(p.purchase_month, fp.cohort_month))
ORDER BY fp.cohort_month, month_number;

-- Analytics: ABC Analysis (Products by Revenue Contribution)
WITH product_revenue AS (
    SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(td.subtotal) as total_revenue,
        SUM(SUM(td.subtotal)) OVER () as grand_total
    FROM products p
    LEFT JOIN transaction_details td ON p.id = td.product_id
    LEFT JOIN transactions t ON td.transaction_id = t.id 
        AND t.status = 'completed'
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY p.id, p.name, p.sku
),
ranked AS (
    SELECT 
        *,
        ROUND((total_revenue / grand_total * 100), 2) as revenue_percentage,
        ROUND(SUM(total_revenue) OVER (ORDER BY total_revenue DESC) / grand_total * 100, 2) as cumulative_percentage
    FROM product_revenue
)
SELECT 
    sku,
    name,
    total_revenue,
    revenue_percentage,
    cumulative_percentage,
    CASE 
        WHEN cumulative_percentage <= 80 THEN 'A'
        WHEN cumulative_percentage <= 95 THEN 'B'
        ELSE 'C'
    END as abc_category
FROM ranked
ORDER BY total_revenue DESC;

-- Analytics: Sales Forecast (Simple Moving Average)
WITH daily_sales AS (
    SELECT 
        DATE(transaction_date) as date,
        SUM(total_amount) as sales
    FROM transactions
    WHERE status = 'completed'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(transaction_date)
)
SELECT 
    date,
    sales,
    AVG(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma_7_days,
    AVG(sales) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as ma_30_days
FROM daily_sales
ORDER BY date DESC;

-- =====================================================
-- 9. PERFORMANCE OPTIMIZATION QUERIES
-- =====================================================

-- Check Table Sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check Index Usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Find Slow Queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT 
    round(total_exec_time::numeric, 2) as total_time_ms,
    calls,
    round(mean_exec_time::numeric, 2) as mean_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as percentage,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
