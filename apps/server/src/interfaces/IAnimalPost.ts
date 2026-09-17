import { Cuid } from '../domains/Cuid';
import type { AnimalPost as SharedAnimalPost } from '@kapa/shared';

export interface IAnimalPost {
  getId(): Cuid;
  getAnimalId(): Cuid;
  getDescription(): string;
  getCreatedAt(): string;

  setId(id: string | Cuid): void;
  setAnimalId(animalId: string | Cuid): void;
  setDescription(description: string): void;
  setCreatedAt(date: string): void;
  toDTO(): SharedAnimalPost;
}

