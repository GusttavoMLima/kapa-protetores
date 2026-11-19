import { z } from 'zod';
import { apiRequest } from './api';

const statusSchema = z.enum(['pending', 'approved', 'rejected']);
const applicationSchema = z.object({
  id: z.string().cuid(),
  availability: z.string().nullable(),
  availableFrom: z.string().date().nullable(),
  availableUntil: z.string().date().nullable(),
  homeNotes: z.string(),
  homeAddress: z.string().nullable(),
  hasOtherAnimals: z.boolean().nullable(),
  hasPerimeterBarrier: z.boolean().nullable(),
  hasSecureGate: z.boolean().nullable(),
  status: statusSchema,
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
const applicantApplicationSchema = applicationSchema.extend({
  canEdit: z.boolean(),
  canSubmitNew: z.boolean(),
});
const pageSchema = z.object({
  items: z.array(applicationSchema.extend({
    applicant: z.object({ username: z.string(), email: z.string().email() }),
  })),
  total: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
});

export type FosterDecision = 'approved' | 'rejected';
export type FosterApplication = z.infer<typeof applicationSchema>;
export type ApplicantFosterApplication = z.infer<typeof applicantApplicationSchema>;
export const fosterStatusLabel: Record<z.infer<typeof statusSchema>, string> = {
  pending: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Recusada',
};

const path = '/foster-applications';

export async function fetchMyFosterApplication() {
  return applicantApplicationSchema.nullable().parse(await apiRequest<unknown>(`${path}/mine`));
}

export type FosterApplicationInput = {
  availableFrom: string;
  availableUntil: string | null;
  homeNotes: string;
  homeAddress: string;
  hasOtherAnimals: boolean;
  hasPerimeterBarrier: boolean;
  hasSecureGate: boolean;
};

export async function submitFosterApplication(application: FosterApplicationInput) {
  return applicantApplicationSchema.parse(await apiRequest<unknown>(path, {
    method: 'POST', body: JSON.stringify(application),
  }));
}

export async function editFosterApplication(id: string, application: FosterApplicationInput) {
  return applicantApplicationSchema.parse(await apiRequest<unknown>(`${path}/${encodeURIComponent(id)}`, {
    method: 'PATCH', body: JSON.stringify(application),
  }));
}

export type FosterAvailabilityFilter = 'available' | 'indefinite' | 'ended';
export type FosterApplicationFilters = {
  status?: z.infer<typeof statusSchema>;
  availability?: FosterAvailabilityFilter;
  search?: string;
};

export async function fetchFosterApplications(page: number, filters: FosterApplicationFilters = {}) {
  const params = new URLSearchParams({ page: String(page) });
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return pageSchema.parse(await apiRequest<unknown>(`${path}?${params.toString()}`));
}

export async function reviewFosterApplication(id: string, status: FosterDecision) {
  await apiRequest<unknown>(`${path}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
}
