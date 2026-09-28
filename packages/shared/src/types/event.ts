import type { User } from './user';

export interface CommunityEventVolunteer {
  volunteerId: string;
  communityEventId: string;
  user?: User;
}

export type CommunityEventType = 'care' | 'cleaning' | 'event' | 'transport';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  cep: number;
  type: CommunityEventType;
  startAt: string;
  endAt: string | null;
  location: string | null;
  vacancies: number | null;
  createdAt: string;
  volunteers?: CommunityEventVolunteer[];
}

export interface CommunityEventListItem extends CommunityEvent {
  isSignedUp: boolean;
  volunteerCount: number;
  remainingVacancies: number | null;
}

export interface CreateCommunityEventInput {
  title: string;
  description: string;
  cep: number;
  type: CommunityEventType;
  startAt: string;
  endAt: string;
  location: string;
  vacancies: number;
}

export interface SystemEvent {
  id: string;
  type: string;
  userId?: string | null;
  animalId?: string | null;
  payload?: Record<string, unknown> | null;
  emittedAt: string;
}
