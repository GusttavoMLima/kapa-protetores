import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import type { AdoptionStatus, Adoption as SharedAdoption } from '@kapa/shared';

export interface IAdoption {
  getId(): Cuid;
  getAdopterId(): UUID;
  getAnimalId(): Cuid;
  getStatus(): AdoptionStatus;
  getAppliedAt(): string;
  getUpdatedAt(): string;

  setId(id: string | Cuid): void;
  setAdopterId(id: string | UUID): void;
  setAnimalId(id: string | Cuid): void;
  setStatus(status: AdoptionStatus): void;
  setAppliedAt(date: string): void;
  setUpdatedAt(date: string): void;
  toDTO(): SharedAdoption;
}

