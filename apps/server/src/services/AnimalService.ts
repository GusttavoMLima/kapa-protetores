import { AnimalRepositoryInterface } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';
import { NotFoundError, BadRequestError } from '../errors';
import type { CreateAnimalInput, AnimalManagementQuery, UpdateAnimalInput, Animal as AnimalDTO } from '@kapa/shared';
import { Cuid } from '../domains/Cuid';
import type { CacheProvider } from './RedisService';

export const AVAILABLE_ANIMALS_CACHE_KEY = 'animals:available';
const AVAILABLE_ANIMALS_CACHE_TTL_SECONDS = 60;

export function buildPublicAnimalCacheKey(id: string): string {
  return `animal:public:${id}`;
}

export class AnimalService {
  constructor(
    private readonly animalRepository: AnimalRepositoryInterface,
    private readonly cache?: CacheProvider,
  ) {}

  public async getAll() {
    if (this.cache) {
      const cached = await this.cache.getCache<ReturnType<AnimalService['publicView']>[]>(
        AVAILABLE_ANIMALS_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const animals = await this.animalRepository.findAll();
    const publicAnimals = animals
      .filter((animal) => animal.getStatus() === 'available')
      .map((animal) => this.publicView(animal.toDTO()));

    if (this.cache) {
      await this.cache.setCache(
        AVAILABLE_ANIMALS_CACHE_KEY,
        publicAnimals,
        AVAILABLE_ANIMALS_CACHE_TTL_SECONDS,
      );
    }

    return publicAnimals;
  }

  public async getById(id: string) {
    Cuid.create(id);
    const cacheKey = buildPublicAnimalCacheKey(id);
    if (this.cache) {
      const cached =
        await this.cache.getCache<ReturnType<AnimalService['publicView']>>(
          cacheKey,
        );
      if (cached) {
        return cached;
      }
    }

    const animal = await this.getManagedById(id);
    if (animal.getStatus() !== 'available') throw new NotFoundError('Animal não encontrado.');
    const view = this.publicView(animal.toDTO());

    if (this.cache) {
      await this.cache.setCache(
        cacheKey,
        view,
        AVAILABLE_ANIMALS_CACHE_TTL_SECONDS,
      );
    }

    return view;
  }

  private publicView(animal: AnimalDTO) {
    const { id, name, breed, species, gender, age, ageStage, size, weightKg, energyLevel,
      kidFriendly, noiseLevel, apartmentFriendly, otherPetFriendly, castrated,
      vaccinated, dewormed, mood, status, photos } = animal;
    return { id, name, breed, species, gender, age, ageStage, size, weightKg, energyLevel,
      kidFriendly, noiseLevel, apartmentFriendly, otherPetFriendly, castrated,
      vaccinated, dewormed, mood, status, photos };
  }

  public getManagementPage(query: AnimalManagementQuery) {
    return this.animalRepository.findManagementPage(query);
  }

  public async update(id: string, input: UpdateAnimalInput): Promise<Animal> {
    Cuid.create(id);
    const animal = await this.animalRepository.update(id, input);
    if (!animal) throw new NotFoundError('Animal não encontrado.');
    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(AVAILABLE_ANIMALS_CACHE_KEY),
        this.cache.deleteCache(buildPublicAnimalCacheKey(id)),
      ]);
    }
    return animal;
  }

  public async getManagedById(id: string): Promise<Animal> {
    Cuid.create(id);
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new NotFoundError(`Animal com ID "${id}" não encontrado.`);
    }
    return animal;
  }

  public async create(input: CreateAnimalInput): Promise<Animal> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestError('Dados do animal inválidos.');
    }

    if (!input.name || !input.name.trim()) {
      throw new BadRequestError('O nome do animal é obrigatório.');
    }

    if (!input.species) {
      throw new BadRequestError('A espécie do animal é obrigatória.');
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
    if (input.v10Doses !== undefined) animal.setV10Doses(input.v10Doses);
    if (input.vacinaRaivaDoses !== undefined) animal.setVacinaRaivaDoses(input.vacinaRaivaDoses);
    if (input.vermifugoDoses !== undefined) animal.setVermifugoDoses(input.vermifugoDoses);
    if (input.rescuedAt !== undefined) animal.setRescuedAt(input.rescuedAt);
    if (input.place !== undefined) animal.setPlace(input.place);
    if (input.mood !== undefined) animal.setMood(input.mood);
    if (input.observations !== undefined)
      animal.setObservations(input.observations);
    if (input.status !== undefined) animal.setStatus(input.status);

    const created = await this.animalRepository.create(animal);
    if (this.cache) {
      await this.cache.deleteCache(AVAILABLE_ANIMALS_CACHE_KEY);
    }
    return created;
  }
}
