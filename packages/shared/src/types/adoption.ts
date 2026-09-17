import type { Animal } from './animal';
import type { User } from './user';

export type AdoptionStatus =
  | 'pending'
  | 'interviewing'
  | 'approved'
  | 'rejected'
  | 'canceled';

export interface Adoption {
  id: string;
  adopterId: string;
  animalId: string;
  status: AdoptionStatus;
  appliedAt: string;
  updatedAt: string;
  animal?: Animal;
  adopter?: User;
}

export interface CreateAdoptionInput {
  animalId: string;
  adopterId?: string;
  notes?: string;
}

export interface UpdateAdoptionStatusInput {
  status: AdoptionStatus;
}
