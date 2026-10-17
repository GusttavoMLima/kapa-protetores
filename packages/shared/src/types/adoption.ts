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
  application?: AdoptionApplication;
}

export interface AdoptionApplication {
  fullName: string;
  birthDate: string;
  phone: string;
  postalCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  housingType: 'house' | 'apartment' | 'farm' | 'rural';
  housingSituation: 'own' | 'rented' | 'loaned';
  residenceProtection: 'yes' | 'partial' | 'no';
  hasChildren: 'yes' | 'no';
  childrenAges?: string;
  hasOtherPets: 'yes' | 'no';
  otherPetsDetails?: string;
  residentsAgree: 'yes' | 'no';
  freeStreetAccess: 'yes' | 'no';
  awareOfResponsibilities: 'yes' | 'no';
}

export interface CreateAdoptionInput {
  animalId: string;
  application: AdoptionApplication;
}

export interface UpdateAdoptionStatusInput {
  status: AdoptionStatus;
}
