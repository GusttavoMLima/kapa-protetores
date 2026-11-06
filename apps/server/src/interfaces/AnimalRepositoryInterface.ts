import { Animal } from '../models/Animal';
import type {
  AnimalManagementQuery,
  AnimalManagementPage,
  AnimalPost,
  UpdateAnimalInput,
} from '@kapa/shared';

export interface IAnimalRepository {
  findAll(): Promise<Animal[]>;
  findById(id: string): Promise<Animal | null>;
  create(animal: Animal): Promise<Animal>;
  findManagementPage(query: AnimalManagementQuery): Promise<AnimalManagementPage>;
  update(id: string, input: UpdateAnimalInput): Promise<Animal | null>;
  findPostsByAnimalId(animalId: string): Promise<AnimalPost[]>;
  createPost(animalId: string, description: string): Promise<AnimalPost>;
}

export type AnimalRepositoryInterface = IAnimalRepository;

