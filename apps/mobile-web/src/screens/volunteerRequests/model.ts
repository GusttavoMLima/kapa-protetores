import type { VolunteerApplication, VolunteerApplicationStatus } from '@kapa/shared';

export type VolunteerStatusFilter = VolunteerApplicationStatus | 'all';

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerApplicationStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Recusada',
};

const STATUS_ORDER: readonly VolunteerApplicationStatus[] = ['pending', 'approved', 'rejected'];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Filtra por status e por nome (ignora acentos e maiúsculas); pendentes primeiro, depois as mais recentes. */
export function filterVolunteerApplications(
  applications: readonly VolunteerApplication[],
  status: VolunteerStatusFilter,
  search: string,
): VolunteerApplication[] {
  const term = normalize(search.trim());

  return applications
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => !term || normalize(item.application.fullName).includes(term)
      || normalize(item.user?.username ?? '').includes(term))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      || b.appliedAt.localeCompare(a.appliedAt));
}

export function countVolunteerApplications(
  applications: readonly VolunteerApplication[],
): Record<VolunteerStatusFilter, number> {
  const counts: Record<VolunteerStatusFilter, number> = { all: applications.length, pending: 0, approved: 0, rejected: 0 };
  for (const item of applications) counts[item.status] += 1;
  return counts;
}
