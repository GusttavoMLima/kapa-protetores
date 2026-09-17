import type { Animal } from './animal';

export interface Favorite {
  userId: string;
  animalId: string;
  createdAt: string;
  animal?: Animal;
}

export interface ToggleFavoriteInput {
  animalId: string;
}
