import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapToCamel } from '@/lib/utils/case';

export async function POST(req: NextRequest) {
  try {
    const { storeCode, storeId: requestedStoreId } = await req.json();
    const supabase = createSupabaseServerClient();

    const resolvedStoreCode = storeCode || process.env.NEXT_PUBLIC_STORE_CODE;

    let storeQuery = supabase.from('stores').select('*');
    if (requestedStoreId) {
      storeQuery = storeQuery.eq('id', requestedStoreId).limit(1);
    } else if (resolvedStoreCode) {
      storeQuery = storeQuery.eq('store_code', resolvedStoreCode).limit(1);
    }

    const { data: stores, error: storeError } = await storeQuery;
    if (storeError) throw storeError;

    const storeRow = stores?.[0];
    if (!storeRow) {
      return NextResponse.json({ error: 'Store tidak ditemukan' }, { status: 404 });
    }

    const storeId = storeRow.id as string;

    const [
      usersRes,
      categoriesRes,
      productsRes,
      customersRes,
      shiftsRes,
      transactionsRes,
      cashAdvancesRes,
      suppliersRes,
      expensesRes,
      expenseCategoriesRes,
      purchaseOrdersRes,
      stockOpnamesRes,
      activityLogsRes,
    ] = await Promise.all([
      supabase.from('users').select('*').eq('store_id', storeId),
      supabase.from('categories').select('*').eq('store_id', storeId),
      supabase.from('products').select('*').eq('store_id', storeId),
      supabase.from('customers').select('*').eq('store_id', storeId),
      supabase.from('shifts').select('*').eq('store_id', storeId),
      supabase.from('transactions').select('*').eq('store_id', storeId).order('transaction_date', { ascending: false }),
      supabase.from('cash_advances').select('*').eq('store_id', storeId),
      supabase.from('suppliers').select('*').eq('store_id', storeId),
      supabase.from('expenses').select('*').eq('store_id', storeId),
      supabase.from('expense_categories').select('*').eq('store_id', storeId),
      supabase.from('purchase_orders').select('*').eq('store_id', storeId),
      supabase.from('stock_opname').select('*').eq('store_id', storeId),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    const errors = [
      usersRes.error,
      categoriesRes.error,
      productsRes.error,
      customersRes.error,
      shiftsRes.error,
      transactionsRes.error,
      cashAdvancesRes.error,
      suppliersRes.error,
      expensesRes.error,
      expenseCategoriesRes.error,
      purchaseOrdersRes.error,
      stockOpnamesRes.error,
      activityLogsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    const shiftIds = (shiftsRes.data || []).map((shift) => shift.id);
    const transactionIds = (transactionsRes.data || []).map((trx) => trx.id);
    const stockOpnameIds = (stockOpnamesRes.data || []).map((opname) => opname.id);
    const cashAdvanceIds = (cashAdvancesRes.data || []).map((item) => item.id);
    const userIds = (usersRes.data || []).map((user) => user.id);

    const [
      shiftSessionsRes,
      transactionDetailsRes,
      transactionEmployeesRes,
      cashAdvancePaymentsRes,
      stockOpnameDetailsRes,
      logsRes,
    ] = await Promise.all([
      shiftIds.length ? supabase.from('shift_sessions').select('*').in('shift_id', shiftIds) : Promise.resolve({ data: [], error: null }),
      transactionIds.length ? supabase.from('transaction_details').select('*').in('transaction_id', transactionIds) : Promise.resolve({ data: [], error: null }),
      transactionIds.length ? supabase.from('transaction_employees').select('*').in('transaction_id', transactionIds) : Promise.resolve({ data: [], error: null }),
      cashAdvanceIds.length ? supabase.from('cash_advance_payments').select('*').in('cash_advance_id', cashAdvanceIds) : Promise.resolve({ data: [], error: null }),
      stockOpnameIds.length ? supabase.from('stock_opname_details').select('*').in('stock_opname_id', stockOpnameIds) : Promise.resolve({ data: [], error: null }),
      userIds.length ? supabase.from('activity_logs').select('*').in('user_id', userIds).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
    ]);

    const extraErrors = [
      shiftSessionsRes.error,
      transactionDetailsRes.error,
      transactionEmployeesRes.error,
      cashAdvancePaymentsRes.error,
      stockOpnameDetailsRes.error,
      logsRes.error,
    ].filter(Boolean);

    if (extraErrors.length > 0) {
      throw extraErrors[0];
    }

    const payload = {
      store: mapToCamel(storeRow),
      users: mapToCamel(usersRes.data || []),
      categories: mapToCamel(categoriesRes.data || []),
      products: mapToCamel(productsRes.data || []),
      customers: mapToCamel(customersRes.data || []),
      shifts: mapToCamel(shiftsRes.data || []),
      shiftSessions: mapToCamel(shiftSessionsRes.data || []),
      transactions: mapToCamel(transactionsRes.data || []),
      transactionDetails: mapToCamel(transactionDetailsRes.data || []),
      transactionEmployees: mapToCamel(transactionEmployeesRes.data || []),
      cashAdvances: mapToCamel(cashAdvancesRes.data || []),
      cashAdvancePayments: mapToCamel(cashAdvancePaymentsRes.data || []),
      suppliers: mapToCamel(suppliersRes.data || []),
      expenses: mapToCamel(expensesRes.data || []),
      expenseCategories: mapToCamel(expenseCategoriesRes.data || []),
      purchaseOrders: mapToCamel(purchaseOrdersRes.data || []),
      stockOpnames: mapToCamel(stockOpnamesRes.data || []),
      stockOpnameDetails: mapToCamel(stockOpnameDetailsRes.data || []),
      activityLogs: mapToCamel(logsRes.data && logsRes.data.length ? logsRes.data : activityLogsRes.data || []),
    };

    return NextResponse.json({ data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
