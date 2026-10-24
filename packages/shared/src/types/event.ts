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

export enum SystemEventTypes {
  ADOPTION_REQUESTED = 'ADOPTION_REQUESTED',
  ADOPTION_APPROVED = 'ADOPTION_APPROVED',
  ADOPTION_REJECTED = 'ADOPTION_REJECTED',
  ADOPTION_CANCELED = 'ADOPTION_CANCELED',
  ANIMAL_CREATED = 'ANIMAL_CREATED',
  ANIMAL_STATUS_UPDATED = 'ANIMAL_STATUS_UPDATED',
  VOLUNTEER_REGISTERED = 'VOLUNTEER_REGISTERED',
  PET_FAVORITED = 'PET_FAVORITED',
  PET_UNFAVORITED = 'PET_UNFAVORITED',
  USER_REGISTERED = 'USER_REGISTERED',
}

export const SYSTEM_EVENT_TYPES = Object.values(SystemEventTypes);

export interface AdoptionRequestedEventPayload {
  adoptionId: string;
  animalName?: string;
}

export interface AdoptionApprovedEventPayload {
  adoptionId: string;
  approvedByUserId?: string;
  animalName?: string;
}

export interface AdoptionRejectedEventPayload {
  adoptionId: string;
  rejectedByUserId?: string;
  reason?: string;
}

export interface AdoptionCanceledEventPayload {
  adoptionId: string;
  canceledByUserId?: string;
}

export interface AnimalCreatedEventPayload {
  animalName: string;
  species: 'dog' | 'cat' | 'other';
  status: 'rescued' | 'treating' | 'available' | 'adopted';
}

export interface AnimalStatusUpdatedEventPayload {
  previousStatus: 'rescued' | 'treating' | 'available' | 'adopted';
  newStatus: 'rescued' | 'treating' | 'available' | 'adopted';
  updatedByUserId?: string;
}

export interface VolunteerRegisteredEventPayload {
  communityEventId: string;
  eventTitle?: string;
}

export interface PetFavoritedEventPayload {
  animalName?: string;
}

export interface PetUnfavoritedEventPayload {
  animalName?: string;
}

export interface UserRegisteredEventPayload {
  role: 'adopter' | 'protector' | 'admin' | 'volunteer';
  provider?: 'local' | 'google';
}

export interface SystemEventPayloadMap {
  [SystemEventTypes.ADOPTION_REQUESTED]: AdoptionRequestedEventPayload;
  [SystemEventTypes.ADOPTION_APPROVED]: AdoptionApprovedEventPayload;
  [SystemEventTypes.ADOPTION_REJECTED]: AdoptionRejectedEventPayload;
  [SystemEventTypes.ADOPTION_CANCELED]: AdoptionCanceledEventPayload;
  [SystemEventTypes.ANIMAL_CREATED]: AnimalCreatedEventPayload;
  [SystemEventTypes.ANIMAL_STATUS_UPDATED]: AnimalStatusUpdatedEventPayload;
  [SystemEventTypes.VOLUNTEER_REGISTERED]: VolunteerRegisteredEventPayload;
  [SystemEventTypes.PET_FAVORITED]: PetFavoritedEventPayload;
  [SystemEventTypes.PET_UNFAVORITED]: PetUnfavoritedEventPayload;
  [SystemEventTypes.USER_REGISTERED]: UserRegisteredEventPayload;
}

export type SystemEventPayload<T extends SystemEventTypes = SystemEventTypes> =
  SystemEventPayloadMap[T];

export interface CreateSystemEventInput<
  T extends SystemEventTypes = SystemEventTypes,
> {
  type: T;
  userId?: string | null;
  animalId?: string | null;
  payload?: SystemEventPayloadMap[T] | null;
}

export interface SystemEvent<T extends SystemEventTypes = SystemEventTypes> {
  id: string;
  type: T;
  userId?: string | null;
  animalId?: string | null;
  payload?: SystemEventPayloadMap[T] | Record<string, unknown> | null;
  emittedAt: string;
}

export interface PaginatedSystemEvents {
  items: SystemEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
