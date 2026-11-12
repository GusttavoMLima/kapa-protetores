import type { Adoption, AdoptionStatus } from '@kapa/shared';

export const statusLabels: Record<AdoptionStatus, string> = {
  pending: 'Em análise', interviewing: 'Em contato', approved: 'Concluída', rejected: 'Recusada', canceled: 'Cancelada',
};
export const statusStyles: Record<AdoptionStatus, string> = {
  pending: 'bg-peach text-orange-dark', interviewing: 'bg-cream text-denim', approved: 'bg-success-soft text-success', rejected: 'bg-danger-soft text-danger', canceled: 'bg-cream text-ink-muted',
};
export type RequestFilter = 'all' | AdoptionStatus;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterRequests(requests: readonly Adoption[], filter: RequestFilter, search: string): Adoption[] {
  const query = normalize(search.trim());
  const priority: Record<AdoptionStatus, number> = { pending: 0, interviewing: 1, approved: 2, rejected: 3, canceled: 4 };
  return requests.filter((request) => (filter === 'all' || request.status === filter) && (!query || normalize(`${request.application?.fullName ?? request.adopter?.username ?? ''} ${request.animal?.name ?? ''} ${request.application?.city ?? ''}`).includes(query)))
    .sort((a, b) => priority[a.status] - priority[b.status] || new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
}

export function formatRequestDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function buildWhatsAppUrl(phone: string, adopterName: string, animalName: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;
  const message = `Olá, ${adopterName}! Somos da Kapa Protetores. Sua ficha para adoção de ${animalName} foi pré-aprovada e gostaríamos de continuar o processo com você.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
