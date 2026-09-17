import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import type { CommunityEventVolunteer as SharedCommunityEventVolunteer } from '@kapa/shared';

export interface ICommunityEventVolunteer {
  getVolunteerId(): UUID;
  getCommunityEventId(): Cuid;

  setVolunteerId(id: string | UUID): void;
  setCommunityEventId(id: string | Cuid): void;
  toDTO(): SharedCommunityEventVolunteer;
}

