import { Animal } from '../models/Animal';

export interface AnimalRepositoryInterface {
  findAll(): Promise<Animal[]>;
  findById(id: string): Promise<Animal | null>;
  create(animal: Animal): Promise<Animal>;
}
