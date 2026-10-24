import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import type { SystemEvent, SystemEventTypes } from '@kapa/shared';

export interface IEvent {
  getId(): Cuid;
  getType(): SystemEventTypes;
  getUserId(): UUID | null;
  getAnimalId(): Cuid | null;
  getPayload(): Record<string, unknown> | null;
  getEmittedAt(): string;

  setId(id: string | Cuid): void;
  setType(type: SystemEventTypes): void;
  setUserId(userId: string | UUID | null): void;
  setAnimalId(animalId: string | Cuid | null): void;
  setPayload(payload: Record<string, unknown> | null): void;
  setEmittedAt(emittedAt: string): void;
  toDTO(): SystemEvent;
}
