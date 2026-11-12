import { z } from 'zod';
import { apiRequest } from './api';

const statusSchema = z.enum(['pending', 'approved', 'rejected']);
const applicationSchema = z.object({
  id: z.string().cuid(),
  availability: z.string(),
  homeNotes: z.string(),
  homeAddress: z.string().nullable(),
  hasOtherAnimals: z.boolean().nullable(),
  hasPerimeterBarrier: z.boolean().nullable(),
  hasSecureGate: z.boolean().nullable(),
  status: statusSchema,
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
export const fosterStatusLabel: Record<z.infer<typeof statusSchema>, string> = {
  pending: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Recusada',
};

const path = '/foster-applications';

export async function fetchMyFosterApplication() {
  return applicationSchema.nullable().parse(await apiRequest<unknown>(`${path}/mine`));
}

export async function submitFosterApplication(application: {
  availability: string;
  homeNotes: string;
  homeAddress: string;
  hasOtherAnimals: boolean;
  hasPerimeterBarrier: boolean;
  hasSecureGate: boolean;
}) {
  return applicationSchema.parse(await apiRequest<unknown>(path, {
    method: 'POST', body: JSON.stringify(application),
  }));
}

export async function fetchFosterApplications(page: number) {
  return pageSchema.parse(await apiRequest<unknown>(`${path}?page=${page}`));
}

export async function reviewFosterApplication(id: string, status: FosterDecision) {
  await apiRequest<unknown>(`${path}/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
}
