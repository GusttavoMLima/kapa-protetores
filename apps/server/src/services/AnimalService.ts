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

    if (!input.name || !input.name.trim()) {
      throw AppError.badRequest('O nome do animal é obrigatório.');
    }

    if (!input.species) {
      throw AppError.badRequest('A espécie do animal é obrigatória.');
    }

    const animal = new Animal();
    animal.setName(input.name);
    animal.setSpecie(input.species);
    if (input.breed !== undefined) animal.setBreed(input.breed);
    if (input.gender !== undefined) animal.setGender(input.gender);
    if (input.weightKg !== undefined) animal.setWeightKg(input.weightKg);
    if (input.age !== undefined) animal.setAge(input.age);
    if (input.ageStage !== undefined) animal.setAgeStage(input.ageStage);
    if (input.size !== undefined) animal.setSize(input.size);
    if (input.energyLevel !== undefined)
      animal.setEnergyLevel(input.energyLevel);
    if (input.kidFriendly !== undefined)
      animal.setKidFriendly(input.kidFriendly);
    if (input.noiseLevel !== undefined) animal.setNoiseLevel(input.noiseLevel);
    if (input.apartmentFriendly !== undefined)
      animal.setApartamentFriendly(input.apartmentFriendly);
    if (input.otherPetFriendly !== undefined)
      animal.setOtherPetFriendly(input.otherPetFriendly);
    if (input.healthCondition !== undefined)
      animal.setHealthCondition(input.healthCondition);
    if (input.castrated !== undefined) animal.setCastrated(input.castrated);
    if (input.vaccinated !== undefined) animal.setVaccinated(input.vaccinated);
    if (input.dewormed !== undefined) animal.setDewormed(input.dewormed);
    if (input.rescuedAt !== undefined) animal.setRescuedAt(input.rescuedAt);
    if (input.place !== undefined) animal.setPlace(input.place);
    if (input.mood !== undefined) animal.setMood(input.mood);
    if (input.observations !== undefined)
      animal.setObservations(input.observations);
    if (input.status !== undefined) animal.setStatus(input.status);

    return this.animalRepository.create(animal);
  }
}
