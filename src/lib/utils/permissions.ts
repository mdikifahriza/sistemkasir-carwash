import { Role } from '@/lib/data/types';

export const permissions: Record<string, Role[]> = {
  'products.view': ['owner', 'manager', 'cashier', 'warehouse'],
  'products.create': ['owner', 'manager'],
  'products.edit': ['owner', 'manager'],
  'products.delete': ['owner'],
  'transactions.view': ['owner', 'manager', 'cashier'],
  'transactions.create': ['owner', 'manager', 'cashier'],
  'transactions.edit': ['owner'],
  'transactions.delete': ['owner'],
  'transactions.refund': ['owner', 'manager'],
  'employees.view': ['owner', 'manager'],
  'employees.create': ['owner'],
  'employees.edit': ['owner'],
  'employees.delete': ['owner'],
  'cash_advances.view': ['owner', 'manager', 'cashier'],
  'cash_advances.request': ['cashier', 'warehouse'],
  'cash_advances.approve': ['owner'],
  'reports.view': ['owner', 'manager'],
  'reports.export': ['owner', 'manager'],
  'settings.view': ['owner'],
  'settings.edit': ['owner'],
  'activity_logs.view': ['owner'],
};

export function hasPermission(role: Role | undefined, permission: string) {
  if (!role) return false;
  return permissions[permission]?.includes(role) ?? false;
}

export function isOwner(role?: Role) {
  return role === 'owner';
}
