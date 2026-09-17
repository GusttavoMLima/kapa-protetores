import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import type { SystemEvent } from '@kapa/shared';

export interface IEvent {
  getId(): Cuid;
  getType(): string;
  getUserId(): UUID | null;
  getAnimalId(): Cuid | null;
  getPayload(): Record<string, unknown> | null;
  getEmittedAt(): string;

  setId(id: string | Cuid): void;
  setType(type: string): void;
  setUserId(userId: string | UUID | null): void;
  setAnimalId(animalId: string | Cuid | null): void;
  setPayload(payload: Record<string, unknown> | null): void;
  setEmittedAt(emittedAt: string): void;
  toDTO(): SystemEvent;
}

