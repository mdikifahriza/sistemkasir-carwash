'use client';

/**
 * Offline Provider - Initializes offline capabilities and sync
 */

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { initSyncManager, syncAll, getSyncState, subscribeSyncState } from '@/lib/sync/syncManager';
import { db, isDatabaseAvailable } from '@/lib/db/offlineDb';
import { useOnlineStatus } from '@/lib/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

// =====================================================
// CONTEXT
// =====================================================

interface OfflineContextValue {
    isOnline: boolean;
    isDbReady: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt: Date | null;
    error: string | null;
    manualSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
    isOnline: true,
    isDbReady: false,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    error: null,
    manualSync: async () => { },
});

export function useOfflineContext() {
    return useContext(OfflineContext);
}

// =====================================================
// PROVIDER COMPONENT
// =====================================================

interface OfflineProviderProps {
    children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
    const isOnline = useOnlineStatus();
    const [isDbReady, setIsDbReady] = useState(false);
    const [syncState, setSyncState] = useState(() => getSyncState());

    // Initialize database and sync manager
    useEffect(() => {
        async function init() {
            try {
                // Check if database is available
                const dbAvailable = await isDatabaseAvailable();
                setIsDbReady(dbAvailable);

                if (dbAvailable) {
                    // Initialize sync manager
                    await initSyncManager();
                }
            } catch (error) {
                console.error('Failed to initialize offline capabilities:', error);
                setIsDbReady(false);
            }
        }

        init();
    }, []);

    // Subscribe to sync state changes
    useEffect(() => {
        const unsubscribe = subscribeSyncState((state) => {
            setSyncState(state);
        });

        return unsubscribe;
    }, []);

    // Manual sync function
    const manualSync = async () => {
        if (isOnline) {
            await syncAll();
        }
    };

    const value: OfflineContextValue = {
        isOnline,
        isDbReady,
        isSyncing: syncState.status === 'syncing',
        pendingCount: syncState.pendingCount,
        lastSyncAt: syncState.lastSyncAt,
        error: syncState.errorMessage,
        manualSync,
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
}

// =====================================================
// OFFLINE STATUS BAR
// =====================================================

export function OfflineStatusBar() {
    const { isOnline, isSyncing, pendingCount, lastSyncAt, error, manualSync } = useOfflineContext();
    const [showDetails, setShowDetails] = useState(false);

    // Don't show anything if online and no pending items
    if (isOnline && pendingCount === 0 && !error) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Main badge */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`
          flex items-center gap-2 rounded-full px-4 py-2 shadow-lg
          transition-all duration-300
          ${isOnline
                        ? error
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                        : 'bg-gray-700 text-white'
                    }
        `}
            >
                {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                ) : isOnline ? (
                    error ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : (
                        <Wifi className="h-4 w-4" />
                    )
                ) : (
                    <WifiOff className="h-4 w-4" />
                )}

                <span className="text-sm font-medium">
                    {isSyncing
                        ? 'Menyinkronkan...'
                        : isOnline
                            ? error
                                ? 'Ada masalah'
                                : pendingCount > 0
                                    ? `${pendingCount} menunggu sync`
                                    : 'Online'
                            : 'Offline'
                    }
                </span>
            </button>

            {/* Details popup */}
            {showDetails && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-surface border border-border p-4 shadow-xl">
                    <div className="space-y-3">
                        {/* Status */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-ink-muted">Status:</span>
                            <span className={`font-medium ${isOnline ? 'text-green-500' : 'text-yellow-500'}`}>
                                {isOnline ? 'Terhubung' : 'Terputus'}
                            </span>
                        </div>

                        {/* Pending items */}
                        {pendingCount > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-muted">Menunggu sync:</span>
                                <span className="font-medium text-ink">{pendingCount} item</span>
                            </div>
                        )}

                        {/* Last sync */}
                        {lastSyncAt && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-muted">Sync terakhir:</span>
                                <span className="text-ink">
                                    {new Intl.DateTimeFormat('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }).format(lastSyncAt)}
                                </span>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="rounded bg-red-500/10 p-2 text-xs text-red-500">
                                {error}
                            </div>
                        )}

                        {/* Sync button */}
                        <button
                            onClick={manualSync}
                            disabled={!isOnline || isSyncing}
                            className={`
                w-full rounded-lg py-2 text-sm font-medium
                transition-colors
                ${isOnline && !isSyncing
                                    ? 'bg-primary text-white hover:bg-primary/90'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
              `}
                        >
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =====================================================
// OFFLINE INDICATOR (SIMPLE VERSION)
// =====================================================

export function OfflineIndicator() {
    const { isOnline, pendingCount, isSyncing } = useOfflineContext();

    return (
        <div className="flex items-center gap-2">
            {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            ) : isOnline ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <WifiOff className="h-4 w-4 text-yellow-500" />
            )}

            {pendingCount > 0 && (
                <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                    {pendingCount}
                </span>
            )}
        </div>
    );
}
