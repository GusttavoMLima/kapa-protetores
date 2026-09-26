import { PrismaClient, Prisma } from '@prisma/client';
import { IAnimalRepository } from '../interfaces/AnimalRepositoryInterface';
import { Animal } from '../models/Animal';
import type { Animal as PrismaAnimal, AnimalPhotos } from '@prisma/client';
import type { AnimalManagementQuery, AnimalManagementPage, UpdateAnimalInput } from '@kapa/shared';

export class PostgresAnimalRepository implements IAnimalRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  private mapToDomain(record: PrismaAnimal & { photos?: AnimalPhotos[] }): Animal {
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
    animal.setPhotos((record.photos ?? []).map((photo) => ({
      id: photo.id, photoUrl: photo.photo_url, uploadedAt: photo.uploaded_at.toISOString(), animalId: photo.animal_id,
    })));
    return animal;
  }

  public async findAll(): Promise<Animal[]> {
    const records = await this.prismaClient.animal.findMany({
      where: { status: 'available' },
      include: { photos: { orderBy: { uploaded_at: 'desc' } } },
      orderBy: { created_at: 'desc' },
    });
    return records.map((record) => this.mapToDomain(record));
  }

  public async findById(id: string): Promise<Animal | null> {
    const record = await this.prismaClient.animal.findUnique({
      where: { id },
      include: { photos: { orderBy: { uploaded_at: 'desc' } } },
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

  public async findManagementPage(query: AnimalManagementQuery): Promise<AnimalManagementPage> {
    const where: Prisma.AnimalWhereInput = {
      species: query.species,
      status: query.status,
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { breed: { contains: query.search, mode: 'insensitive' } },
      ] } : {}),
    };
    const groupedCounts = this.prismaClient.animal.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } });
    const [records, total, groups] = await this.prismaClient.$transaction([
      this.prismaClient.animal.findMany({
        where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        orderBy: query.sort === 'name' ? [{ name: 'asc' }, { id: 'asc' }] : [{ created_at: 'desc' }, { id: 'desc' }],
        include: { photos: { orderBy: { uploaded_at: 'desc' }, take: 1 } },
      }),
      this.prismaClient.animal.count({ where }),
      groupedCounts,
    ]);
    const counts = { rescued: 0, treating: 0, available: 0, adopted: 0 };
    for (const group of groups) counts[group.status] = group._count._all;
    return { items: records.map((record) => this.mapToDomain(record).toDTO()), total, page: query.page, pageSize: query.pageSize, counts };
  }

  public async update(id: string, input: UpdateAnimalInput): Promise<Animal | null> {
    try {
      const record = await this.prismaClient.animal.update({
        where: { id },
        data: {
          name: input.name, breed: input.breed, species: input.species, gender: input.gender,
          weight_kg: input.weightKg, age: input.age, age_stage: input.ageStage,
          size: input.size, energy_level: input.energyLevel, kid_friendly: input.kidFriendly,
          noise_level: input.noiseLevel, apartment_friendly: input.apartmentFriendly,
          other_pet_friendly: input.otherPetFriendly, health_condition: input.healthCondition,
          castrated: input.castrated, vaccinated: input.vaccinated, dewormed: input.dewormed,
          rescued_at: input.rescuedAt === undefined ? undefined : new Date(input.rescuedAt),
          place: input.place, mood: input.mood, observations: input.observations, status: input.status,
        },
        include: { photos: { orderBy: { uploaded_at: 'desc' } } },
      });
      return this.mapToDomain(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
      throw error;
    }
  }
}

