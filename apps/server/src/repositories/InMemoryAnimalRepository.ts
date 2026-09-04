import { AnimalRepositoryInterface } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';

export class InMemoryAnimalRepository implements AnimalRepositoryInterface {
  private readonly animals: Animal[] = [];

  public async findAll(): Promise<Animal[]> {
    return [...this.animals];
  }

  public async findById(id: string): Promise<Animal | null> {
    const animal = this.animals.find((a) => a.id === id);
    return animal ?? null;
  }

  public async create(animal: Animal): Promise<Animal> {
    this.animals.unshift(animal);
    return animal;
  }
}
