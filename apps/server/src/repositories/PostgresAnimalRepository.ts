import { PrismaClient } from '@prisma/client';
import { IAnimalRepository } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';
import type { Animal as PrismaAnimal } from '@prisma/client';

export class PostgresAnimalRepository implements IAnimalRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  private mapToDomain(record: PrismaAnimal): Animal {
    const animal = new Animal();
    animal.setId(record.id);
    animal.setName(record.name);
    animal.setBreed(record.breed);
    animal.setSpecie(record.species);
    animal.setGender(record.gender);
    animal.setWeightKg(Number(record.weight_kg));
    animal.setAge(record.age);
    animal.setAgeStage(record.age_stage);
    animal.setSize(record.size);
    animal.setEnergyLevel(record.energy_level);
    animal.setKidFriendly(record.kid_friendly);
    animal.setNoiseLevel(record.noise_level);
    animal.setApartamentFriendly(record.apartment_friendly);
    animal.setOtherPetFriendly(record.other_pet_friendly);
    animal.setHealthCondition(record.health_condition);
    animal.setCastrated(record.castrated);
    animal.setVaccinated(record.vaccinated);
    animal.setDewormed(record.dewormed);
    animal.setRescuedAt(record.rescued_at.toISOString());
    animal.setPlace(record.place);
    animal.setMood(record.mood);
    animal.setObservations(record.observations);
    animal.setStatus(record.status);
    animal.setCreatedAt(record.created_at.toISOString());
    return animal;
  }

  public async findAll(): Promise<Animal[]> {
    const records = await this.prismaClient.animal.findMany({
      orderBy: { created_at: 'desc' },
    });
    return records.map((record) => this.mapToDomain(record));
  }

  public async findById(id: string): Promise<Animal | null> {
    const record = await this.prismaClient.animal.findUnique({
      where: { id },
    });
    return record ? this.mapToDomain(record) : null;
  }

  public async create(animal: Animal): Promise<Animal> {
    const record = await this.prismaClient.animal.create({
      data: {
        id: animal.getId() ? animal.getId().getValue() : undefined,
        name: animal.getName(),
        breed: animal.getBreed(),
        species: animal.getSpecie(),
        gender: animal.getGender(),
        weight_kg: animal.getWeightKg(),
        age: animal.getAge(),
        age_stage: animal.getAgeStage(),
        size: animal.getSize(),
        energy_level: animal.getEnergyLevel(),
        kid_friendly: animal.getKidFriendly(),
        noise_level: animal.getNoiseLevel(),
        apartment_friendly: animal.getApartamentFriendly(),
        other_pet_friendly: animal.getOtherPetFriendly(),
        health_condition: animal.getHealthCondition(),
        castrated: animal.getCastrated(),
        vaccinated: animal.getVaccinated(),
        dewormed: animal.getDewormed(),
        rescued_at: new Date(animal.getRescuedAt()),
        place: animal.getPlace(),
        mood: animal.getMood(),
        observations: animal.getObservations(),
        status: animal.getStatus(),
      },
    });
    return this.mapToDomain(record);
  }
}

