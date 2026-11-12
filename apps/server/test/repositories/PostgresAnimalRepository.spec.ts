import { PostgresAnimalRepository } from '../../src/repositories/PostgresAnimalRepository';
import { Animal } from '../../src/models/Animal';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { DoseRecord } from '@kapa/shared';

describe('PostgresAnimalRepository unit tests', () => {
  const dummyPrismaAnimal = {
    id: 'c000000000000000000000001',
    name: 'Rex',
    breed: 'SRD',
    species: 'dog' as const,
    gender: 'male' as const,
    weight_kg: new Prisma.Decimal(12.5),
    age: 3,
    age_stage: 2,
    size: 3,
    energy_level: 3,
    kid_friendly: 4,
    noise_level: 2,
    apartment_friendly: true,
    other_pet_friendly: true,
    health_condition: 'healthy' as const,
    castrated: 'yes' as const,
    vaccinated: true,
    dewormed: 'yes' as const,
    v10_doses: [{ status: 'sim', data: '01/01/2026' }],
    rabies_doses: [{ status: 'sim', data: '02/01/2026' }],
    deworming_doses: [{ status: 'nao' }],
    rescued_at: new Date('2026-01-01T12:00:00Z'),
    place: 'Rua A',
    mood: 'Dócil',
    observations: 'Nenhuma',
    medication_notes: 'Orientação veterinária registrada',
    status: 'available' as const,
    created_at: new Date('2026-01-01T12:00:00Z'),
    photos: [
      {
        id: 'photo-1',
        photo_url: 'https://example.com/rex.jpg',
        uploaded_at: new Date('2026-01-01T12:00:00Z'),
        animal_id: 'c000000000000000000000001',
      },
    ],
  };

  it('findById maps doses, photos and returns an Animal instance', async () => {
    const mockPrisma = {
      animal: {
        findUnique: jest.fn().mockResolvedValue(dummyPrismaAnimal),
      },
    } as unknown as PrismaClient;

    const repository = new PostgresAnimalRepository(mockPrisma);
    const animal = await repository.findById('c000000000000000000000001');

    expect(animal).not.toBeNull();
    const dto = animal!.toDTO();
    expect(dto.name).toBe('Rex');
    expect(dto.medicationNotes).toBe(dummyPrismaAnimal.medication_notes);
    expect(dto.v10Doses).toEqual([{ status: 'sim', data: '01/01/2026' }]);
    expect(dto.vacinaRaivaDoses).toEqual([{ status: 'sim', data: '02/01/2026' }]);
    expect(dto.vermifugoDoses).toEqual([{ status: 'nao' }]);
    expect(dto.photos).toHaveLength(1);
  });

  it('findById returns null if record does not exist', async () => {
    const mockPrisma = {
      animal: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaClient;

    const repository = new PostgresAnimalRepository(mockPrisma);
    const animal = await repository.findById('non-existent');
    expect(animal).toBeNull();
  });

  it('create maps domain animal to Prisma input with doses', async () => {
    const mockCreate = jest.fn().mockResolvedValue(dummyPrismaAnimal);
    const mockPrisma = {
      animal: {
        create: mockCreate,
      },
    } as unknown as PrismaClient;

    const domainAnimal = new Animal();
    domainAnimal.setName('Rex');
    domainAnimal.setSpecie('dog');
    domainAnimal.setBreed('SRD');
    domainAnimal.setGender('male');
    domainAnimal.setWeightKg(12.5);
    domainAnimal.setAge(3);
    domainAnimal.setAgeStage(2);
    domainAnimal.setSize(3);
    domainAnimal.setEnergyLevel(3);
    domainAnimal.setKidFriendly(4);
    domainAnimal.setNoiseLevel(2);
    domainAnimal.setApartamentFriendly(true);
    domainAnimal.setOtherPetFriendly(true);
    domainAnimal.setHealthCondition('healthy');
    domainAnimal.setCastrated('yes');
    domainAnimal.setVaccinated(true);
    domainAnimal.setDewormed('yes');
    const sampleDoses: DoseRecord[] = [{ status: 'sim', data: '01/01/2026' }];
    domainAnimal.setV10Doses(sampleDoses);
    domainAnimal.setVacinaRaivaDoses(sampleDoses);
    domainAnimal.setVermifugoDoses([{ status: 'nao' }]);
    domainAnimal.setRescuedAt('2026-01-01T12:00:00.000Z');
    domainAnimal.setPlace('Rua A');
    domainAnimal.setMood('Dócil');
    domainAnimal.setObservations('Nenhuma');
    domainAnimal.setMedicationNotes(dummyPrismaAnimal.medication_notes);
    domainAnimal.setStatus('available');

    const repository = new PostgresAnimalRepository(mockPrisma);
    const created = await repository.create(domainAnimal);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.medication_notes).toBe(dummyPrismaAnimal.medication_notes);
    expect(createData.v10_doses).toEqual(sampleDoses);
    expect(createData.rabies_doses).toEqual(sampleDoses);
    expect(createData.deworming_doses).toEqual([{ status: 'nao' }]);
    expect(created.getName()).toBe('Rex');
  });

  it('update maps partial doses and preserves omitted ones', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(dummyPrismaAnimal);
    const mockPrisma = {
      animal: {
        update: mockUpdate,
      },
    } as unknown as PrismaClient;

    const repository = new PostgresAnimalRepository(mockPrisma);
    const updated = await repository.update('c000000000000000000000001', {
      v10Doses: [],
      medicationNotes: null,
      vacinaRaivaDoses: [{ status: 'sim', data: '02/01/2026' }],
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateData = mockUpdate.mock.calls[0][0].data;
    expect(updateData.medication_notes).toBeNull();
    expect(updateData.v10_doses).toEqual([]);
    expect(updateData.rabies_doses).toEqual([{ status: 'sim', data: '02/01/2026' }]);
    expect(updateData.deworming_doses).toBeUndefined();
    expect(updated).not.toBeNull();
  });

  it('update returns null on P2025 error and rethrows unexpected errors', async () => {
    const p2025Error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
    const mockPrismaP2025 = {
      animal: {
        update: jest.fn().mockRejectedValue(p2025Error),
      },
    } as unknown as PrismaClient;

    const repository = new PostgresAnimalRepository(mockPrismaP2025);
    const result = await repository.update('c000000000000000000000001', { name: 'Novo' });
    expect(result).toBeNull();

    const mockPrismaUnknown = {
      animal: {
        update: jest.fn().mockRejectedValue(new Error('DB failure')),
      },
    } as unknown as PrismaClient;
    const repoFail = new PostgresAnimalRepository(mockPrismaUnknown);
    await expect(repoFail.update('c000000000000000000000001', { name: 'Novo' })).rejects.toThrow('DB failure');
  });

  it('findAll returns array of domain animals', async () => {
    const mockPrisma = {
      animal: {
        findMany: jest.fn().mockResolvedValue([dummyPrismaAnimal]),
      },
    } as unknown as PrismaClient;

    const repository = new PostgresAnimalRepository(mockPrisma);
    const animals = await repository.findAll();
    expect(animals).toHaveLength(1);
    expect(animals[0].getName()).toBe('Rex');
  });
});
