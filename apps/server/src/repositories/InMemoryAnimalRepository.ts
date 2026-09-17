import { IAnimalRepository } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';

export class InMemoryAnimalRepository implements IAnimalRepository {
  private readonly animals: Animal[] = [];

  public async findAll(): Promise<Animal[]> {
    return [...this.animals];
  }

  public async findById(id: string): Promise<Animal | null> {
    const animal = this.animals.find((a) => a.getId()?.getValue() === id);
    return animal ?? null;
  }

  public async create(animal: Animal): Promise<Animal> {
    this.animals.unshift(animal);
    return animal;
  }
}
