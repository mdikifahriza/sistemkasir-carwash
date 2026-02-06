/**
 * Sync Manager - Handles data synchronization between IndexedDB and Supabase
 * Implements offline-first strategy with background sync
 * Uses Server-side Proxy API to bypass RLS/Configuration issues
 */

import { db, SyncQueue, generateUUID, Transaction, TransactionDetail, TransactionEmployee } from '../db/offlineDb';
import { useAuthStore } from '@/store/authStore';

const ACTIVITY_LOG_TRIGGERS_ENABLED = process.env.NEXT_PUBLIC_ACTIVITY_LOG_TRIGGERS === 'true';

// =====================================================
// SYNC STATUS
// =====================================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
    status: SyncStatus;
    lastSyncAt: Date | null;
    pendingCount: number;
    errorMessage: string | null;
    isOnline: boolean;
}

let syncState: SyncState = {
    status: 'idle',
    lastSyncAt: null,
    pendingCount: 0,
    errorMessage: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

const listeners: Set<(state: SyncState) => void> = new Set();

function notifyListeners() {
    listeners.forEach(listener => listener({ ...syncState }));
}

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
    listeners.add(listener);
    listener({ ...syncState });
    return () => listeners.delete(listener);
}

export function getSyncState(): SyncState {
    return { ...syncState };
}

// =====================================================
// ONLINE/OFFLINE DETECTION
// =====================================================

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        syncState.isOnline = true;
        syncState.status = 'idle';
        notifyListeners();
        // Trigger sync when coming online
        syncAll();
    });

    window.addEventListener('offline', () => {
        syncState.isOnline = false;
        syncState.status = 'offline';
        notifyListeners();
    });
}

export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// =====================================================
// API HELPER
// =====================================================

async function getStoreId(): Promise<string> {
    const storeId = useAuthStore.getState().storeId;
    if (!storeId) {
        throw new Error('Store ID tidak ditemukan. Silakan login kembali.');
    }
    return storeId;
}

async function apiFetch(method: 'GET' | 'POST', params: any = {}): Promise<any> {
    let url = '/api/sync';
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (method === 'GET') {
        const queryParams = new URLSearchParams(params);
        url += `?${queryParams.toString()}`;
    } else {
        options.body = JSON.stringify(params);
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan sinkronisasi');
    }

    return data;
}

// =====================================================
// SYNC QUEUE MANAGEMENT
// =====================================================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    data: any
): Promise<void> {
    const queueItem: SyncQueue = {
        id: generateUUID(),
        action,
        table_name: tableName,
        record_id: recordId,
        data,
        created_at: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
        status: 'pending',
    };

    await db.syncQueue.add(queueItem);
    syncState.pendingCount = await db.getPendingSyncCount();
    notifyListeners();

    // Try to sync immediately if online
    if (isOnline()) {
        processSyncQueue();
    }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(): Promise<void> {
    if (!isOnline()) {
        console.log('[SyncManager] Offline, skipping sync');
        return;
    }

    if (syncState.status === 'syncing') {
        console.log('[SyncManager] Already syncing, skipping');
        return;
    }

    try {
        // Ensure we have store context before starting
        await getStoreId();

        syncState.status = 'syncing';
        notifyListeners();

        const pendingItems = await db.syncQueue
            .where('status')
            .equals('pending')
            .sortBy('created_at');

        const transactionCreateIds = new Set(
            pendingItems
                .filter(item => item.table_name === 'transactions' && item.action === 'create')
                .map(item => item.record_id)
        );
        const syncedTransactionIds = new Set<string>();

        const priority = (item: SyncQueue): number => {
            if (item.action === 'create' && item.table_name === 'transactions') return 1;
            if (item.action === 'create' && item.table_name === 'transaction_details') return 2;
            if (item.action === 'create' && item.table_name === 'transaction_employees') return 3;
            return 10;
        };

        const orderedItems = [...pendingItems].sort((a, b) => {
            const pa = priority(a);
            const pb = priority(b);
            if (pa !== pb) return pa - pb;
            if (a.created_at === b.created_at) return a.id.localeCompare(b.id);
            return a.created_at.localeCompare(b.created_at);
        });

        console.log(`[SyncManager] Processing ${orderedItems.length} items`);

        for (const item of orderedItems) {
            if (item.action === 'create' && (item.table_name === 'transaction_details' || item.table_name === 'transaction_employees')) {
                const transactionId = item.data?.transaction_id;
                if (transactionId && transactionCreateIds.has(transactionId) && !syncedTransactionIds.has(transactionId)) {
                    continue;
                }
            }

            try {
                await syncItem(item);
                if (item.action === 'create' && item.table_name === 'transactions') {
                    syncedTransactionIds.add(item.record_id);
                }
                await db.syncQueue.update(item.id, { status: 'completed' });
            } catch (error: any) {
                console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);

                const newRetryCount = item.retry_count + 1;
                if (newRetryCount >= 5) {
                    await db.syncQueue.update(item.id, {
                        status: 'failed',
                        retry_count: newRetryCount,
                        last_error: error.message,
                    });
                } else {
                    await db.syncQueue.update(item.id, {
                        retry_count: newRetryCount,
                        last_error: error.message,
                    });
                }
            }
        }

        // Clean up completed items older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const oldCompleted = await db.syncQueue
            .where('status')
            .equals('completed')
            .filter(item => item.created_at < oneDayAgo)
            .toArray(); // DEXIE: toArray first before keys mapping for delete might be safer or use delete directly on collection

        await db.syncQueue
            .where('status')
            .equals('completed')
            .filter(item => item.created_at < oneDayAgo)
            .delete();

        syncState.status = 'idle';
        syncState.lastSyncAt = new Date();
        syncState.pendingCount = await db.getPendingSyncCount();
        syncState.errorMessage = null;
    } catch (error: any) {
        syncState.status = 'error';
        syncState.errorMessage = error.message;
    }

    notifyListeners();
}

/**
 * Sync individual item to Cloud via Proxy
 */
async function syncItem(item: SyncQueue): Promise<void> {
    const { action, table_name, record_id, data } = item;
    const storeId = await getStoreId();

    await apiFetch('POST', {
        table: table_name,
        action,
        id: record_id,
        data,
        storeId
    });

    if (!ACTIVITY_LOG_TRIGGERS_ENABLED && table_name === 'transactions' && action === 'create') {
        const actorId = data?.created_by ?? data?.createdBy ?? useAuthStore.getState().userId ?? null;
        const invoiceNumber = data?.invoice_number ?? data?.invoiceNumber ?? record_id;
        await apiFetch('POST', {
            table: 'activity_logs',
            action: 'create',
            data: {
                user_id: actorId,
                action: 'create_transaction',
                table_name: 'transactions',
                record_id,
                description: `Transaksi ${invoiceNumber} disinkronkan`,
                new_value: data ?? null,
            },
            storeId
        });
    }
}

// =====================================================
// DATA SYNC FROM SERVER
// =====================================================

/**
 * Sync all data from Server to IndexedDB
 */
export async function syncAll(): Promise<void> {
    if (!isOnline()) {
        console.log('[SyncManager] Offline, cannot sync from server');
        return;
    }

    // Check if user is logged in
    const storeId = useAuthStore.getState().storeId;
    if (!storeId) {
        console.log('[SyncManager] No store ID (not logged in), skipping sync');
        return;
    }

    try {
        syncState.status = 'syncing';
        notifyListeners();

        // Sync reference data first
        await syncProducts(storeId);
        await syncCategories(storeId);
        await syncCustomers(storeId);
        await syncUsers(storeId);
        await syncShifts(storeId);

        // Then process outgoing queue
        await processSyncQueue();

        syncState.status = 'idle';
        syncState.lastSyncAt = new Date();
    } catch (error: any) {
        console.error('[SyncManager] Sync failed:', error);
        syncState.status = 'error';
        syncState.errorMessage = error.message;
    }

    notifyListeners();
}

/**
 * Sync products
 */
export async function syncProducts(storeId: string): Promise<void> {
    console.log('[SyncManager] Syncing products...');
    const result = await apiFetch('GET', { table: 'products', storeId });
    const data = result.data;

    if (data && data.length > 0) {
        await db.transaction('rw', db.products, async () => {
            for (const product of data) {
                await db.products.put({
                    ...product,
                    synced_at: new Date().toISOString(),
                });
            }
        });
        console.log(`[SyncManager] Synced ${data.length} products`);
    }
}

/**
 * Sync categories
 */
export async function syncCategories(storeId: string): Promise<void> {
    console.log('[SyncManager] Syncing categories...');
    const result = await apiFetch('GET', { table: 'categories', storeId });
    const data = result.data;

    if (data && data.length > 0) {
        await db.transaction('rw', db.categories, async () => {
            for (const category of data) {
                await db.categories.put({
                    ...category,
                    synced_at: new Date().toISOString(),
                });
            }
        });
        console.log(`[SyncManager] Synced ${data.length} categories`);
    }
}

/**
 * Sync customers
 */
export async function syncCustomers(storeId: string): Promise<void> {
    console.log('[SyncManager] Syncing customers...');
    const result = await apiFetch('GET', { table: 'customers', storeId });
    const data = result.data;

    if (data && data.length > 0) {
        await db.transaction('rw', db.customers, async () => {
            for (const customer of data) {
                await db.customers.put({
                    ...customer,
                    synced_at: new Date().toISOString(),
                });
            }
        });
        console.log(`[SyncManager] Synced ${data.length} customers`);
    }
}

/**
 * Sync users
 */
export async function syncUsers(storeId: string): Promise<void> {
    console.log('[SyncManager] Syncing users...');
    const result = await apiFetch('GET', { table: 'users', storeId });
    const data = result.data;

    if (data && data.length > 0) {
        await db.transaction('rw', db.users, async () => {
            for (const user of data) {
                await db.users.put({
                    ...user,
                    synced_at: new Date().toISOString(),
                });
            }
        });
        console.log(`[SyncManager] Synced ${data.length} users`);
    }
}

/**
 * Sync shifts
 */
export async function syncShifts(storeId: string): Promise<void> {
    console.log('[SyncManager] Syncing shifts...');
    const result = await apiFetch('GET', { table: 'shifts', storeId });
    const data = result.data;

    if (data && data.length > 0) {
        await db.transaction('rw', db.shifts, async () => {
            for (const shift of data) {
                await db.shifts.put({
                    ...shift,
                    synced_at: new Date().toISOString(),
                });
            }
        });
        console.log(`[SyncManager] Synced ${data.length} shifts`);
    }
}

// =====================================================
// TRANSACTION SYNC
// =====================================================

/**
 * Save transaction offline and queue for sync
 */
/**
 * Save transaction offline and queue for sync
 */
export async function saveTransactionOffline(
    transaction: Transaction,
    details: TransactionDetail[],
    employees: TransactionEmployee[] = []
): Promise<void> {
    // Save to IndexedDB
    await db.transaction('rw', [db.transactions, db.transactionDetails, db.transactionEmployees], async () => {
        await db.transactions.add(transaction);
        await db.transactionDetails.bulkAdd(details);
        if (employees.length > 0) {
            await db.transactionEmployees.bulkAdd(employees);
        }
    });

    // Add to sync queue
    await addToSyncQueue('create', 'transactions', transaction.id, transaction);

    for (const detail of details) {
        // We use create even for details
        await addToSyncQueue('create', 'transaction_details', detail.id, detail);
    }

    // Add employees to sync queue
    for (const emp of employees) {
        await addToSyncQueue('create', 'transaction_employees', emp.id, emp);
    }
}

/**
 * Sync unsynced transactions (legacy/direct db check)
 */
export async function syncUnsyncedTransactions(): Promise<void> {
    // Deprecated? Mostly covered by processSyncQueue.
    // But keeping for safety if syncQueue empty but synced=false items exist
    const unsynced = await db.getUnsyncedTransactions();
    const storeId = useAuthStore.getState().storeId;

    if (!storeId) return;

    for (const transaction of unsynced) {
        try {
            const details = await db.transactionDetails
                .where('transaction_id')
                .equals(transaction.id)
                .toArray();

            // Sync transaction via API
            await apiFetch('POST', {
                table: 'transactions',
                action: 'create',
                id: transaction.id,
                data: transaction,
                storeId
            });

            // Sync details
            if (details.length > 0) {
                // Bulk insert not supported by simple proxy yet, loop
                for (const d of details) {
                    await apiFetch('POST', {
                        table: 'transaction_details',
                        action: 'create',
                        id: d.id,
                        data: d,
                        storeId
                    });
                }
            }

            // Mark as synced
            await db.transactions.update(transaction.id, {
                synced: true,
                synced_at: new Date().toISOString(),
            });

        } catch (error) {
            console.error(`[SyncManager] Failed to sync transaction ${transaction.id}:`, error);
        }
    }
}

// =====================================================
// BACKGROUND SYNC SCHEDULER
// =====================================================

let syncInterval: NodeJS.Timeout | null = null;

export function startBackgroundSync(intervalMs = 30000): void {
    if (syncInterval) {
        clearInterval(syncInterval);
    }

    syncInterval = setInterval(() => {
        if (isOnline()) {
            const storeId = useAuthStore.getState().storeId;
            if (storeId) {
                processSyncQueue();
            }
        }
    }, intervalMs);

    console.log('[SyncManager] Background sync started');
}

export function stopBackgroundSync(): void {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('[SyncManager] Background sync stopped');
    }
}

// =====================================================
// INITIALIZATION
// =====================================================

export async function initSyncManager(): Promise<void> {
    syncState.pendingCount = await db.getPendingSyncCount();
    syncState.isOnline = isOnline();
    notifyListeners();

    startBackgroundSync();

    if (isOnline()) {
        syncAll();
    }

    console.log('[SyncManager] Initialized');
}
