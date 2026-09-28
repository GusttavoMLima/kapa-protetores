import { Animal } from '../models/Animal';
import type { AnimalManagementQuery, AnimalManagementPage, UpdateAnimalInput } from '@kapa/shared';

export interface IAnimalRepository {
  findAll(): Promise<Animal[]>;
  findById(id: string): Promise<Animal | null>;
  create(animal: Animal): Promise<Animal>;
  findManagementPage(query: AnimalManagementQuery): Promise<AnimalManagementPage>;
  update(id: string, input: UpdateAnimalInput): Promise<Animal | null>;
}

export type AnimalRepositoryInterface = IAnimalRepository;

