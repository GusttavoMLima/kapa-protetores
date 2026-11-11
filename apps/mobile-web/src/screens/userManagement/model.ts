import type { User, UserRole } from '@kapa/shared';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  protector: 'Protetor',
  volunteer: 'Voluntário',
  adopter: 'Adotante',
};

export const ROLE_PLURAL_LABELS: Record<UserRole, string> = {
  admin: 'Administradores',
  protector: 'Protetores',
  volunteer: 'Voluntários',
  adopter: 'Adotantes',
};

export const ROLE_ORDER: readonly UserRole[] = [
  'admin',
  'protector',
  'volunteer',
  'adopter',
];

export const PAGE_SIZE = 10;

export type RoleFilter = UserRole | 'all';
export type StatusFilter = 'all' | 'active' | 'inactive';
export type SortKey = 'recent' | 'name';

export interface UserFilters {
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  sort: SortKey;
}

export const DEFAULT_FILTERS: UserFilters = {
  search: '',
  role: 'all',
  status: 'all',
  sort: 'recent',
};

export function hasActiveFilters(filters: UserFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.role !== 'all' ||
    filters.status !== 'all'
  );
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function filterAndSortUsers(
  users: readonly User[],
  { search, role, status, sort }: UserFilters,
): User[] {
  const term = normalize(search.trim());

  return users
    .filter((user) => {
      if (role !== 'all' && user.role !== role) return false;
      if (status === 'active' && user.deactivatedAt) return false;
      if (status === 'inactive' && !user.deactivatedAt) return false;
      if (!term) return true;
      return (
        normalize(user.username).includes(term) ||
        normalize(user.email).includes(term)
      );
    })
    .sort((a, b) =>
      sort === 'name'
        ? a.username.localeCompare(b.username, 'pt-BR', { sensitivity: 'base' })
        : b.createdAt.localeCompare(a.createdAt),
    );
}

export function countByRole(
  users: readonly User[],
): Record<RoleFilter, number> {
  const counts: Record<RoleFilter, number> = {
    all: users.length,
    admin: 0,
    protector: 0,
    volunteer: 0,
    adopter: 0,
  };

  for (const user of users) counts[user.role] += 1;

  return counts;
}

export function paginate<T>(items: readonly T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, items.length),
  };
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0] ?? '?').slice(0, 2);

  return letters.toUpperCase();
}

export function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR').format(date);
}

export function readApiErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  return typeof message === 'string' && message
    ? message
    : 'Não foi possível concluir a ação. Tente novamente.';
}
