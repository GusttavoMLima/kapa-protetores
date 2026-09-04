import { AnimalRepositoryInterface } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';
import { AppError } from '../errors/AppError';
import type { CreateAnimalInput } from '@kapa/shared';

export class AnimalService {
  constructor(private readonly animalRepository: AnimalRepositoryInterface) {}

  public async getAll(): Promise<Animal[]> {
    return this.animalRepository.findAll();
  }

  public async getById(id: string): Promise<Animal> {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw AppError.notFound(`Animal com ID "${id}" não encontrado.`);
    }
    return animal;
  }

  public async create(input: CreateAnimalInput): Promise<Animal> {
    if (!input || typeof input !== 'object') {
      throw AppError.badRequest('Dados do animal inválidos.');
    }

    if (!input.nome || !input.nome.trim()) {
      throw AppError.badRequest('O nome do animal é obrigatório.');
    }

    if (!input.especie) {
      throw AppError.badRequest('A espécie do animal é obrigatória.');
    }

    const animal = new Animal(input);
    return this.animalRepository.create(animal);
  }
}
