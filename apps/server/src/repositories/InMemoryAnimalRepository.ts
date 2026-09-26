import { IAnimalRepository } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';
import { randomBytes } from 'node:crypto';
import type { AnimalManagementQuery, AnimalManagementPage, UpdateAnimalInput } from '@kapa/shared';

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
    if (!animal.getId()) animal.setId(`c${randomBytes(12).toString('hex')}`);
    if (!animal.getCreatedAt()) animal.setCreatedAt(new Date().toISOString());
    this.animals.unshift(animal);
    return animal;
  }

  public async findManagementPage(query: AnimalManagementQuery): Promise<AnimalManagementPage> {
    const all = this.animals.map((animal) => animal.toDTO());
    const counts = { rescued: 0, treating: 0, available: 0, adopted: 0 };
    for (const animal of all) counts[animal.status]++;
    const search = query.search?.toLocaleLowerCase('pt-BR') ?? '';
    const filtered = all.filter((animal) => (!query.status || animal.status === query.status)
      && (!query.species || animal.species === query.species)
      && `${animal.name} ${animal.breed}`.toLocaleLowerCase('pt-BR').includes(search));
    filtered.sort((a, b) => query.sort === 'name' ? a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
      : b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    const start = (query.page - 1) * query.pageSize;
    return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize, counts };
  }

  public async update(id: string, input: UpdateAnimalInput): Promise<Animal | null> {
    const animal = await this.findById(id);
    if (!animal) return null;
    if (input.name !== undefined) animal.setName(input.name);
    if (input.breed !== undefined) animal.setBreed(input.breed);
    if (input.species !== undefined) animal.setSpecie(input.species);
    if (input.gender !== undefined) animal.setGender(input.gender);
    if (input.weightKg !== undefined) animal.setWeightKg(input.weightKg);
    if (input.age !== undefined) animal.setAge(input.age);
    if (input.ageStage !== undefined) animal.setAgeStage(input.ageStage);
    if (input.size !== undefined) animal.setSize(input.size);
    if (input.energyLevel !== undefined) animal.setEnergyLevel(input.energyLevel);
    if (input.kidFriendly !== undefined) animal.setKidFriendly(input.kidFriendly);
    if (input.noiseLevel !== undefined) animal.setNoiseLevel(input.noiseLevel);
    if (input.apartmentFriendly !== undefined) animal.setApartmentFriendly(input.apartmentFriendly);
    if (input.otherPetFriendly !== undefined) animal.setOtherPetFriendly(input.otherPetFriendly);
    if (input.healthCondition !== undefined) animal.setHealthCondition(input.healthCondition);
    if (input.castrated !== undefined) animal.setCastrated(input.castrated);
    if (input.vaccinated !== undefined) animal.setVaccinated(input.vaccinated);
    if (input.dewormed !== undefined) animal.setDewormed(input.dewormed);
    if (input.rescuedAt !== undefined) animal.setRescuedAt(input.rescuedAt);
    if (input.place !== undefined) animal.setPlace(input.place);
    if (input.mood !== undefined) animal.setMood(input.mood);
    if (input.observations !== undefined) animal.setObservations(input.observations);
    if (input.status !== undefined) animal.setStatus(input.status);
    return animal;
  }
}
