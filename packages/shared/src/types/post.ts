import type { Animal } from './animal';

export interface AnimalPost {
  id: string;
  animalId: string;
  description: string;
  createdAt: string;
  animal?: Animal;
}

export interface CreateAnimalPostInput {
  animalId: string;
  description: string;
}
