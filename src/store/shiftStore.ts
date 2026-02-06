/**
 * Shift Store - Manages shift sessions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, ShiftSession, Shift, generateUUID } from '@/lib/db/offlineDb';
import { addToSyncQueue, isOnline } from '@/lib/sync/syncManager'; // Keep syncManager utility usage? 
// No, syncManager utility adds to queue.
import { apiRequest } from '@/lib/api/client';

interface ShiftState {
    // Current shift session
    currentSession: ShiftSession | null;
    currentShift: Shift | null;
    isShiftOpen: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    openShift: (shiftId: string, openingBalance: number, userId: string) => Promise<void>;
    closeShift: (actualClosingBalance: number, notes?: string) => Promise<void>;
    refreshShift: (userId: string) => Promise<void>;
    clearShift: () => void;
}

export const useShiftStore = create<ShiftState>()(
    persist(
        (set, get) => ({
            currentSession: null,
            currentShift: null,
            isShiftOpen: false,
            isLoading: false,
            isInitialized: false,
            error: null,

            openShift: async (shiftId: string, openingBalance: number, userId: string) => {
                set({ isLoading: true, error: null });

                try {
                    const today = new Date().toISOString().split('T')[0];
                    const now = new Date().toISOString();
                    const sessionId = generateUUID();

                    // Get shift info
                    let shift: Shift | undefined;

                    if (isOnline()) {
                        try {
                            const res = await apiRequest('GET', { table: 'shifts', id: shiftId });
                            if (res.data && res.data.length > 0) {
                                shift = res.data[0];
                            }
                        } catch (e) {
                            // Fallback to local if API fails despite isOnline check (e.g. server error)
                            shift = await db.shifts.get(shiftId);
                        }
                    } else {
                        shift = await db.shifts.get(shiftId);
                    }

                    if (!shift) {
                        throw new Error('Shift tidak ditemukan');
                    }

                    // Create session
                    const session: ShiftSession = {
                        id: sessionId,
                        shift_id: shiftId,
                        user_id: userId,
                        session_date: today,
                        opening_balance: openingBalance,
                        actual_opening_balance: openingBalance,
                        closing_balance: 0,
                        actual_closing_balance: null,
                        discrepancy: 0,
                        total_sales: 0,
                        total_transactions: 0,
                        total_cash: 0,
                        total_cashless: 0,
                        total_expenses: 0,
                        opened_at: now,
                        closed_at: null,
                        notes: null,
                        status: 'open',
                    };

                    if (isOnline()) {
                        // Save to Supabase via Proxy
                        // We use queue logic for consistency? 
                        // User wants "usage of supabase role key". 
                        // Direct call via proxy is safer than sync queue processing potentially failing?
                        // Let's do both: Try direct, if fail -> queue. 
                        // But SyncManager logic: Add to local DB, then Add to Queue.
                        // If online, SyncManager processes queue via proxy.
                        // So, we just use addToSyncQueue!

                        // Wait, user explicitly asked for "refactor so ALL use supabase role key".
                        // `addToSyncQueue` uses `processSyncQueue` which uses `syncItem` which I updated to use `apiFetch` (Proxy).
                        // So leveraging `addToSyncQueue` IS using role key eventually.

                        // BUT `shiftStore` old code had EXPLICIT `supabase.insert` AND `addToSyncQueue`.
                        // This double write is redundant if online. SyncManager handles it.
                        // Ideally: write local, add to queue. SyncManager flushes queue.
                        // Direct write here was for immediate feedback?

                        // Let's simplify: Write Local + Queue. SyncManager will pick it up (immediately if online).
                        // This removes duplicate logic.
                        // BUT user might want immediate confirmation.

                        // Current `syncManager.ts` (new):
                        // `addToSyncQueue` -> calls `processSyncQueue` (if online).
                        // `processSyncQueue` -> calls `syncItem` -> `apiFetch`.

                        // So simply calling `addToSyncQueue` satisfies the requirement!
                        // No need for direct `apiRequest` here if we rely on Queue Manager.

                        // EXCEPT for `refreshShift` (Read). This needs direct `apiRequest`.

                        // Let's remove explicit online write for `openShift` and rely on Queue Manager.
                        // It's cleaner.
                    }

                    // Save to IndexedDB
                    await db.shiftSessions.add({ ...session, synced_at: undefined }); // synced_at undefined marks it for sync? No, queue item does.

                    // Add to queue
                    await addToSyncQueue('create', 'shift_sessions', sessionId, session);

                    set({
                        currentSession: session,
                        currentShift: shift,
                        isShiftOpen: true,
                        isLoading: false,
                    });

                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            closeShift: async (actualClosingBalance: number, notes?: string) => {
                const { currentSession } = get();

                if (!currentSession) {
                    throw new Error('Tidak ada shift yang aktif');
                }

                set({ isLoading: true, error: null });

                try {
                    const now = new Date().toISOString();
                    const expectedClosing =
                        currentSession.opening_balance +
                        currentSession.total_cash -
                        currentSession.total_expenses;

                    const discrepancy = actualClosingBalance - expectedClosing;

                    const updateData = {
                        actual_closing_balance: actualClosingBalance,
                        closing_balance: expectedClosing,
                        discrepancy,
                        closed_at: now,
                        notes: notes || null,
                        status: 'closed' as const,
                    };

                    // Update in IndexedDB
                    await db.shiftSessions.update(currentSession.id, updateData);

                    // Add to queue (SyncManager will handle online sync via Proxy)
                    await addToSyncQueue('update', 'shift_sessions', currentSession.id, {
                        ...currentSession,
                        ...updateData,
                    });

                    set({
                        currentSession: null,
                        currentShift: null,
                        isShiftOpen: false,
                        isLoading: false,
                    });

                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            refreshShift: async (userId: string) => {
                set({ isLoading: true, error: null });

                try {
                    let session: ShiftSession | null = null;
                    let shift: Shift | null = null;

                    if (isOnline()) {
                        try {
                            const res = await apiRequest('GET', {
                                table: 'shift_sessions',
                                user_id: userId,
                                status: 'open',
                                limit: 1
                            });

                            if (res.data && res.data.length > 0) {
                                session = res.data[0];
                                // shifts is nested in session due to select('*, shifts(*)') in proxy
                                shift = (session as any).shifts;

                                // Save/Update to IndexedDB
                                if (session) {
                                    // Remove nested object before saving to IDB (flat structure usually preferred, or dexie handles it?)
                                    // Dexie ignores extra props depending on definition, but better clean it.
                                    const { shifts: _, ...flatSession } = session as any;
                                    await db.shiftSessions.put(flatSession);
                                }
                                if (shift) {
                                    await db.shifts.put(shift);
                                }
                            }
                        } catch (e) {
                            console.warn('Shift refresh online failed, falling back to local', e);
                        }
                    }

                    if (!session) {
                        // Fallback/Main source: IndexedDB
                        session = await db.getActiveShiftSession(userId) || null;
                        if (session) {
                            shift = await db.shifts.get(session.shift_id) || null;
                        }
                    }

                    set({
                        currentSession: session,
                        currentShift: shift,
                        isShiftOpen: !!session,
                        isLoading: false,
                        isInitialized: true,
                    });

                } catch (error: any) {
                    set({
                        currentSession: null,
                        currentShift: null,
                        isShiftOpen: false,
                        isLoading: false,
                        isInitialized: true,
                    });
                }
            },

            clearShift: () => {
                set({
                    currentSession: null,
                    currentShift: null,
                    isShiftOpen: false,
                    error: null,
                    isInitialized: false,
                });
            },
        }),
        {
            name: 'shift-storage',
            partialize: (state) => ({
                currentSession: state.currentSession,
                currentShift: state.currentShift,
                isShiftOpen: state.isShiftOpen,
                isInitialized: state.isInitialized,
            }),
        }
    )
);

// Helpers
export async function updateShiftSales(
    sessionId: string,
    amount: number,
    paymentMethod: string
): Promise<void> {
    const isCash = paymentMethod === 'cash';

    const session = await db.shiftSessions.get(sessionId);
    if (session) {
        const updates = {
            total_sales: session.total_sales + amount,
            total_transactions: session.total_transactions + 1,
            total_cash: isCash ? session.total_cash + amount : session.total_cash,
            total_cashless: !isCash ? session.total_cashless + amount : session.total_cashless,
        };

        await db.shiftSessions.update(sessionId, updates);

        const store = useShiftStore.getState();
        if (store.currentSession?.id === sessionId) {
            useShiftStore.setState({
                currentSession: { ...session, ...updates },
            });
        }

        // Add to queue -> SyncManager handles via Proxy
        await addToSyncQueue('update', 'shift_sessions', sessionId, { ...session, ...updates });
    }
}

export async function addShiftExpense(
    sessionId: string,
    amount: number
): Promise<void> {
    const session = await db.shiftSessions.get(sessionId);
    if (session) {
        const newTotal = session.total_expenses + amount;
        await db.shiftSessions.update(sessionId, { total_expenses: newTotal });

        const store = useShiftStore.getState();
        if (store.currentSession?.id === sessionId) {
            useShiftStore.setState({
                currentSession: { ...session, total_expenses: newTotal },
            });
        }

        // Add to update queue
        await addToSyncQueue('update', 'shift_sessions', sessionId, { ...session, total_expenses: newTotal });
    }
}
