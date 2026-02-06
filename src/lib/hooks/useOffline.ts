/**
 * Custom hooks for offline-first functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../db/offlineDb';
import { subscribeSyncState, getSyncState, isOnline } from '../sync/syncManager';

// =====================================================
// useOnlineStatus - Track online/offline status
// =====================================================

export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState<boolean>(true); // Default true to prevent hydration mismatch

    useEffect(() => {
        // Function to update status
        const updateStatus = () => {
            setOnline(navigator.onLine);
        };

        // Set initial status on client mount
        updateStatus();

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        // Polling as checks-and-balances (every 5 seconds)
        const interval = setInterval(updateStatus, 5000);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            clearInterval(interval);
        };
    }, []);

    return online;
}

// =====================================================
// useSyncStatus - Track sync state
// =====================================================

interface SyncStatusHook {
    status: 'idle' | 'syncing' | 'error' | 'offline';
    isOnline: boolean;
    pendingCount: number;
    lastSyncAt: Date | null;
    errorMessage: string | null;
}

export function useSyncStatus(): SyncStatusHook {
    const [state, setState] = useState<SyncStatusHook>(() => {
        const initial = getSyncState();
        return {
            status: initial.status,
            isOnline: initial.isOnline,
            pendingCount: initial.pendingCount,
            lastSyncAt: initial.lastSyncAt,
            errorMessage: initial.errorMessage,
        };
    });

    useEffect(() => {
        const unsubscribe = subscribeSyncState((newState) => {
            setState({
                status: newState.status,
                isOnline: newState.isOnline,
                pendingCount: newState.pendingCount,
                lastSyncAt: newState.lastSyncAt,
                errorMessage: newState.errorMessage,
            });
        });

        return unsubscribe;
    }, []);

    return state;
}

// =====================================================
// useOfflineProducts - Get products from IndexedDB
// =====================================================

interface UseOfflineProductsOptions {
    categoryId?: string | null;
    searchQuery?: string;
    limit?: number;
}

export function useOfflineProducts(options: UseOfflineProductsOptions = {}) {
    const { categoryId, searchQuery, limit = 100 } = options;

    const products = useLiveQuery(async () => {
        // Use filter instead of where for boolean fields
        let results = await db.products.filter(p => p.is_active === true).toArray();

        // Filter by category
        if (categoryId) {
            results = results.filter(p => p.category_id === categoryId);
        }

        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.sku.toLowerCase().includes(lowerQuery) ||
                (p.barcode && p.barcode.includes(searchQuery))
            );
        }

        // Limit results
        return results.slice(0, limit);
    }, [categoryId, searchQuery, limit]);

    return {
        products: products || [],
        isLoading: products === undefined,
    };
}

// =====================================================
// useOfflineCategories - Get categories from IndexedDB
// =====================================================

export function useOfflineCategories() {
    const categories = useLiveQuery(async () => {
        const results = await db.categories.filter(c => c.is_active === true).toArray();
        return results.sort((a, b) => a.sort_order - b.sort_order);
    }, []);

    return {
        categories: categories || [],
        isLoading: categories === undefined,
    };
}

// =====================================================
// useOfflineCustomers - Get customers from IndexedDB
// =====================================================

interface UseOfflineCustomersOptions {
    searchQuery?: string;
    membersOnly?: boolean;
    limit?: number;
}

export function useOfflineCustomers(options: UseOfflineCustomersOptions = {}) {
    const { searchQuery, membersOnly, limit = 100 } = options;

    const customers = useLiveQuery(async () => {
        let results = await db.customers.filter(c => c.is_active === true).toArray();

        // Filter members only
        if (membersOnly) {
            results = results.filter(c => c.is_member);
        }

        // Filter by search query
        if (searchQuery && searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                (c.phone && c.phone.includes(searchQuery)) ||
                c.customer_code.toLowerCase().includes(lowerQuery)
            );
        }

        return results.slice(0, limit);
    }, [searchQuery, membersOnly, limit]);

    return {
        customers: customers || [],
        isLoading: customers === undefined,
    };
}

// =====================================================
// useOfflineShifts - Get shifts from IndexedDB
// =====================================================

export function useOfflineShifts() {
    const shifts = useLiveQuery(async () => {
        return await db.shifts.filter(s => s.is_active === true).toArray();
    }, []);

    return {
        shifts: shifts || [],
        isLoading: shifts === undefined,
    };
}

// =====================================================
// useOfflineUsers - Get users from IndexedDB
// =====================================================

interface UseOfflineUsersOptions {
    role?: 'owner' | 'manager' | 'cashier' | 'warehouse';
}

export function useOfflineUsers(options: UseOfflineUsersOptions = {}) {
    const { role } = options;

    const users = useLiveQuery(async () => {
        let results = await db.users.filter(u => u.is_active === true).toArray();

        if (role) {
            results = results.filter(u => u.role === role);
        }

        return results;
    }, [role]);

    return {
        users: users || [],
        isLoading: users === undefined,
    };
}

// =====================================================
// useProductByBarcode - Get product by barcode scan
// =====================================================

export function useProductByBarcode() {
    const [product, setProduct] = useState<Product | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const searchByBarcode = useCallback(async (barcode: string) => {
        setIsSearching(true);
        try {
            const found = await db.getProductByBarcode(barcode);
            setProduct(found || null);
            return found || null;
        } catch (error) {
            console.error('Error searching by barcode:', error);
            return null;
        } finally {
            setIsSearching(false);
        }
    }, []);

    const clear = useCallback(() => {
        setProduct(null);
    }, []);

    return {
        product,
        isSearching,
        searchByBarcode,
        clear,
    };
}

// =====================================================
// useActiveShiftSession - Get current user's active shift
// =====================================================

export function useActiveShiftSession(userId: string | null) {
    const session = useLiveQuery(async () => {
        if (!userId) return null;
        return await db.getActiveShiftSession(userId);
    }, [userId]);

    return {
        session: session || null,
        isLoading: session === undefined,
        hasActiveShift: !!session,
    };
}

// =====================================================
// useTodayTransactions - Get today's transactions
// =====================================================

export function useTodayTransactions() {
    const transactions = useLiveQuery(async () => {
        return await db.getTodayTransactions();
    }, []);

    const summary = useLiveQuery(async () => {
        const txs = await db.getTodayTransactions();

        return {
            count: txs.length,
            totalSales: txs.reduce((sum, t) => sum + t.total_amount, 0),
            totalCash: txs
                .filter(t => t.payment_method === 'cash')
                .reduce((sum, t) => sum + t.total_amount, 0),
            totalCashless: txs
                .filter(t => t.payment_method !== 'cash')
                .reduce((sum, t) => sum + t.total_amount, 0),
        };
    }, []);

    return {
        transactions: transactions || [],
        summary: summary || { count: 0, totalSales: 0, totalCash: 0, totalCashless: 0 },
        isLoading: transactions === undefined,
    };
}

// =====================================================
// usePendingSyncCount - Get pending sync items count
// =====================================================

export function usePendingSyncCount() {
    const count = useLiveQuery(async () => {
        return await db.getPendingSyncCount();
    }, []);

    return count || 0;
}
