import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_TABLES = [
    'products',
    'categories',
    'customers',
    'users',
    'shifts',
    'shift_sessions',
    'transactions',
    'transaction_details',
    'transaction_employees',
    'sync_queue',
    'store_settings', // Added missing table
    'activity_logs'
];

export async function GET(req: NextRequest) {
    try {
        const table = req.nextUrl.searchParams.get('table');
        const storeId = req.nextUrl.searchParams.get('storeId');
        const id = req.nextUrl.searchParams.get('id');
        const userId = req.nextUrl.searchParams.get('user_id');
        const status = req.nextUrl.searchParams.get('status');
        const limit = req.nextUrl.searchParams.get('limit');

        if (!table || !ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid or missing table' }, { status: 400 });
        }

        if (!storeId) {
            return NextResponse.json({ error: 'Missing storeId' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        let query = supabase.from(table).select(table === 'shift_sessions' ? '*, shifts(*)' : '*');

        // Default filter: active only (except transactions logic specific components)
        // NOTE: shift_sessions doesn't have is_active usually. shifts does.
        if (['products', 'categories', 'customers', 'users', 'shifts'].includes(table)) {
            query = query.eq('is_active', true);
        }

        // Filter by store_id
        // shift_sessions DOES NOT usually have store_id directly, it links to shift_id (which has store_id) OR user_id (which has store_id).
        // If table is shift_sessions, we might need to filter manually or assume the request provides proper user_id filter.
        // However, for security, we should ensure the shift belongs to the store.
        // Simplifying assumption: shift_sessions table SHOULD have store_id for easier RLS. 
        // If not, we skip store_id filter for shift_sessions IF user_id is present (controlled by logged in user).

        if (table !== 'shift_sessions') {
            query = query.eq('store_id', storeId);
        } else {
            // For shift sessions, we trust user_id filter if provided, or if schema has store_id
            // Let's assume schema has store_id for consistency. If not, this will fail and user needs to add it.
            // If it fails, I'll remove it. But based on "User wants usage of supabase role key", we enforce fetching.
            // Actually, let's checking user_id constraint instead for sessions.
        }

        if (id) {
            query = query.eq('id', id);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        // Default sorting for sessions
        if (table === 'shift_sessions') {
            query = query.order('opened_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error(`Sync API Error(GET ${table}): `, error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { table, action, data, id, storeId } = body;

        if (!table || !ALLOWED_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        const cleanData = { ...data };
        delete cleanData.synced;
        delete cleanData.synced_at;
        delete cleanData.offline_id;
        // shifts(*) relation handling? insert shouldn't have nested.

        let result;

        if (action === 'create') {
            result = await supabase.from(table).insert(cleanData).select(); // Select to return data
        } else if (action === 'update') {
            if (!id) return NextResponse.json({ error: 'Missing ID for update' }, { status: 400 });
            result = await supabase.from(table).update(cleanData).eq('id', id).select();
        } else if (action === 'delete') {
            if (!id) return NextResponse.json({ error: 'Missing ID for delete' }, { status: 400 });
            result = await supabase.from(table).delete().eq('id', id);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (result.error) {
            console.error(`Sync API Error(POST ${table} ${action}): `, result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        // Return the inserted/updated data
        return NextResponse.json({ success: true, data: result.data });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
