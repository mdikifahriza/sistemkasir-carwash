import type { Role } from '@/lib/data/types';

const roleLabels: Record<Role, string> = {
  owner: 'Pemilik',
  manager: 'Manajer',
  cashier: 'Kasir',
  warehouse: 'Gudang',
};

export function formatRole(role?: Role) {
  if (!role) return '-';
  return roleLabels[role] || role;
}
