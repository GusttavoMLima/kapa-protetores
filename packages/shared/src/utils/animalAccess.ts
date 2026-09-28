import type { UserRole } from '../types';

export function canManageAnimals(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'protector' || role === 'volunteer';
}
