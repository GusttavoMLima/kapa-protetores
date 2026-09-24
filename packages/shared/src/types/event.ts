import type { User } from './user';

export interface CommunityEventVolunteer {
  volunteerId: string;
  communityEventId: string;
  user?: User;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  cep: number;
  startAt: string;
  createdAt: string;
  volunteers?: CommunityEventVolunteer[];
}

export interface CommunityEventListItem extends CommunityEvent {
  isSignedUp: boolean;
  volunteerCount: number;
}

export interface CreateCommunityEventInput {
  title: string;
  description: string;
  cep: number;
  startAt: string;
}

export interface SystemEvent {
  id: string;
  type: string;
  userId?: string | null;
  animalId?: string | null;
  payload?: Record<string, unknown> | null;
  emittedAt: string;
}
