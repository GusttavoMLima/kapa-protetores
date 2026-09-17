import { Cuid } from '../domains/Cuid';
import { UUID } from '../domains/UUID';
import type { Favorite as SharedFavorite } from '@kapa/shared';

export interface IFavorite {
  getUserId(): UUID;
  getAnimalId(): Cuid;
  getCreatedAt(): string;

  setUserId(id: string | UUID): void;
  setAnimalId(id: string | Cuid): void;
  setCreatedAt(date: string): void;
  toDTO(): SharedFavorite;
}

