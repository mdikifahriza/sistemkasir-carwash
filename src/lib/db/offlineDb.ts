/**
 * Offline Database using Dexie.js (IndexedDB wrapper)
 * Provides offline-first capability for POS PRO
 */

import Dexie, { Table, type IndexableType } from 'dexie';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Product {
    id: string;
    store_id: string;
    category_id: string | null;
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    unit: string;
    purchase_price: number;
    selling_price: number;
    stock_quantity: number;
    min_stock: number;
    max_stock: number | null;
    is_trackable: boolean;
    is_active: boolean;
    image_url: string | null;
    tax_percentage: number;
    discount_percentage: number;
    created_at: string;
    updated_at: string;
    synced_at?: string;
}

export interface Category {
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    synced_at?: string;
}

export interface Customer {
    id: string;
    store_id: string;
    customer_code: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
    loyalty_points: number;
    total_spent: number;
    total_transactions: number;
    is_member: boolean;
    member_since: string | null;
    is_active: boolean;
    synced_at?: string;
}

export interface User {
    id: string;
    store_id: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: 'owner' | 'manager' | 'cashier' | 'warehouse';
    pin_code: string | null;
    avatar_url: string | null;
    employee_id: string | null;
    salary: number;
    commission_percentage: number;
    is_active: boolean;
    synced_at?: string;
}

export interface Shift {
    id: string;
    store_id: string;
    shift_name: string;
    start_time: string;
    end_time: string;
    color_code: string;
    is_active: boolean;
    synced_at?: string;
}

export interface ShiftSession {
    id: string;
    shift_id: string;
    user_id: string;
    session_date: string;
    opening_balance: number;
    actual_opening_balance: number | null;
    closing_balance: number;
    actual_closing_balance: number | null;
    discrepancy: number;
    total_sales: number;
    total_transactions: number;
    total_cash: number;
    total_cashless: number;
    total_expenses: number;
    opened_at: string | null;
    closed_at: string | null;
    notes: string | null;
    status: 'open' | 'closed';
    synced_at?: string;
}

export interface Transaction {
    id: string;
    store_id: string;
    shift_session_id: string | null;
    customer_id: string | null;
    invoice_number: string;
    customer_name: string | null;
    customer_phone: string | null;
    transaction_date: string;
    subtotal: number;
    discount_amount: number;
    discount_percentage: number;
    tax_amount: number;
    total_amount: number;
    payment_method: 'cash' | 'card' | 'qris' | 'transfer' | 'e-wallet' | 'split';
    amount_paid: number;
    change_amount: number;
    notes: string | null;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    deleted_by: string | null;
    // Offline-specific fields
    synced: boolean;
    synced_at?: string;
    offline_id?: string;
}

export interface TransactionDetail {
    id: string;
    transaction_id: string;
    product_id: string | null;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    subtotal: number;
    notes: string | null;
    synced?: boolean;
}

export interface TransactionEmployee {
    id: string;
    transaction_id: string;
    user_id: string;
    percentage: number;
    amount: number;
    notes: string | null;
    synced?: boolean;
}

export interface SyncQueue {
    id: string;
    action: 'create' | 'update' | 'delete';
    table_name: string;
    record_id: string;
    data: any;
    created_at: string;
    retry_count: number;
    last_error: string | null;
    status: 'pending' | 'processing' | 'failed' | 'completed';
}

export interface AppSettings {
    id: string;
    key: string;
    value: any;
    updated_at: string;
}

// =====================================================
// DATABASE CLASS
// =====================================================

export class OfflineDatabase extends Dexie {
    // Tables
    products!: Table<Product, string>;
    categories!: Table<Category, string>;
    customers!: Table<Customer, string>;
    users!: Table<User, string>;
    shifts!: Table<Shift, string>;
    shiftSessions!: Table<ShiftSession, string>;
    transactions!: Table<Transaction, string>;
    transactionDetails!: Table<TransactionDetail, string>;
    transactionEmployees!: Table<TransactionEmployee, string>;
    syncQueue!: Table<SyncQueue, string>;
    settings!: Table<AppSettings, string>;

    constructor() {
        super('POSProOfflineDB');

        this.version(1).stores({
            // Primary data tables
            products: 'id, store_id, category_id, sku, barcode, name, is_active, synced_at',
            categories: 'id, store_id, parent_id, name, is_active',
            customers: 'id, store_id, customer_code, name, phone, is_member',
            users: 'id, store_id, username, role, is_active',
            shifts: 'id, store_id, shift_name, is_active',
            shiftSessions: 'id, shift_id, user_id, session_date, status',

            // Transaction tables
            transactions: 'id, store_id, shift_session_id, invoice_number, transaction_date, status, synced, created_by',
            transactionDetails: 'id, transaction_id, product_id',
            transactionEmployees: 'id, transaction_id, user_id',

            // Sync management
            syncQueue: 'id, action, table_name, record_id, status, created_at',

            // App settings
            settings: 'id, key',
        });
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Clear all offline data (useful for logout)
     */
    async clearAllData(): Promise<void> {
        await this.transaction('rw', [
            this.products,
            this.categories,
            this.customers,
            this.users,
            this.shifts,
            this.shiftSessions,
            this.transactions,
            this.transactionDetails,
            this.transactionEmployees,
            this.syncQueue,
        ], async () => {
            await this.products.clear();
            await this.categories.clear();
            await this.customers.clear();
            await this.users.clear();
            await this.shifts.clear();
            await this.shiftSessions.clear();
            await this.transactions.clear();
            await this.transactionDetails.clear();
            await this.transactionEmployees.clear();
            await this.syncQueue.clear();
        });
    }

    /**
     * Get pending sync items count
     */
    async getPendingSyncCount(): Promise<number> {
        return await this.syncQueue
            .where('status')
            .equals('pending')
            .count();
    }

    /**
     * Get unsynced transactions
     */
    async getUnsyncedTransactions(): Promise<Transaction[]> {
        return await this.transactions
            .where('synced')
            .equals(false as unknown as IndexableType)
            .toArray();
    }

    /**
     * Search products by name or SKU
     */
    async searchProducts(query: string, limit = 50): Promise<Product[]> {
        const lowerQuery = query.toLowerCase();
        return await this.products
            .filter(p =>
                p.is_active && (
                    p.name.toLowerCase().includes(lowerQuery) ||
                    p.sku.toLowerCase().includes(lowerQuery) ||
                    (p.barcode ? p.barcode.includes(query) : false)
                )
            )
            .limit(limit)
            .toArray();
    }

    /**
     * Get product by barcode
     */
    async getProductByBarcode(barcode: string): Promise<Product | undefined> {
        return await this.products
            .where('barcode')
            .equals(barcode)
            .first();
    }

    /**
     * Get active shift session for current user
     */
    async getActiveShiftSession(userId: string): Promise<ShiftSession | undefined> {
        return await this.shiftSessions
            .where(['user_id', 'status'])
            .equals([userId, 'open'])
            .first();
    }

    /**
     * Get today's transactions
     */
    async getTodayTransactions(): Promise<Transaction[]> {
        const today = new Date().toISOString().split('T')[0];
        return await this.transactions
            .filter(t => t.transaction_date.startsWith(today) && t.status === 'completed')
            .toArray();
    }

    /**
     * Generate offline invoice number
     */
    async generateOfflineInvoiceNumber(storeCode: string): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        // Count today's transactions
        const todayPrefix = `INV-${dateStr}`;
        const count = await this.transactions
            .filter(t => t.invoice_number.startsWith(todayPrefix))
            .count();

        const sequence = String(count + 1).padStart(4, '0');
        return `${todayPrefix}-${sequence}-OFF`; // OFF suffix for offline transactions
    }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const db = new OfflineDatabase();

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
    try {
        await db.products.count();
        return true;
    } catch {
        return false;
    }
}
