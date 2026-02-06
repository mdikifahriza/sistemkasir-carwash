import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const allowedTables = new Set([
  'stores',
  'users',
  'categories',
  'products',
  'customers',
  'shifts',
  'shift_sessions',
  'transactions',
  'transaction_details',
  'transaction_employees',
  'cash_advances',
  'cash_advance_payments',
  'suppliers',
  'expenses',
  'expense_categories',
  'purchase_orders',
  'stock_opname',
  'stock_opname_details',
  'activity_logs',
]);

export async function POST(req: NextRequest) {
  try {
    const { action, table, match, data, order, single } = await req.json();

    if (!allowedTables.has(table)) {
      return NextResponse.json({ error: 'Table tidak diizinkan' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    if (action === 'select') {
      let query = supabase.from(table).select('*');

      if (match) {
        Object.entries(match).forEach(([key, value]) => {
          query = query.eq(key, value as string);
        });
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      const { data: rows, error } = single ? await query.single() : await query;
      if (error) throw error;
      return NextResponse.json({ data: rows });
    }

    if (action === 'insert') {
      const { data: rows, error } = await supabase.from(table).insert(data).select('*');
      if (error) throw error;
      return NextResponse.json({ data: rows });
    }

    if (action === 'update') {
      if (!match) {
        return NextResponse.json({ error: 'Match wajib diisi' }, { status: 400 });
      }
      let query = supabase.from(table).update(data).select('*');
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value as string);
      });
      const { data: rows, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data: rows });
    }

    if (action === 'delete') {
      if (!match) {
        return NextResponse.json({ error: 'Match wajib diisi' }, { status: 400 });
      }
      let query = supabase.from(table).delete().select('*');
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value as string);
      });
      const { data: rows, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data: rows });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
