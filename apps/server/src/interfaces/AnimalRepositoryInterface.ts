import { Animal } from '../models/Animal';

export interface IAnimalRepository {
  findAll(): Promise<Animal[]>;
  findById(id: string): Promise<Animal | null>;
  create(animal: Animal): Promise<Animal>;
}

export type AnimalRepositoryInterface = IAnimalRepository;

