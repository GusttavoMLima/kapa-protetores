import { AdopterProfileService } from '../../src/services/AdopterProfileService';
import { IAdopterProfileRepository, AdopterPreferences } from '../../src/interfaces';
import type { CreateAdopterProfileInput } from '@kapa/shared';
import { AdopterProfile } from '../../src/models';
import { UUID } from '../../src/domains/UUID';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../src/errors';

class MockAdopterProfileRepository implements IAdopterProfileRepository {
  public profiles: AdopterProfile[] = [];

  async count(): Promise<number> {
    return this.profiles.length;
  }

  async findAll(): Promise<AdopterProfile[]> {
    return [...this.profiles];
  }

  async findById(id: UUID): Promise<AdopterProfile | null> {
    const found = this.profiles.find((p) => p.getId().equals(id));
    return found ?? null;
  }

  async findByUserId(userId: UUID): Promise<AdopterProfile | null> {
    const found = this.profiles.find((p) => p.getUserId().equals(userId));
    return found ?? null;
  }

  async findByPreferences(
    filters: Partial<AdopterPreferences>,
  ): Promise<AdopterProfile[]> {
    return this.profiles.filter((p) => {
      if (
        filters.preferredSpecies !== undefined &&
        p.getPreferredSpecies() !== filters.preferredSpecies
      ) {
        return false;
      }
      if (
        filters.preferredGender !== undefined &&
        p.getPreferredGender() !== filters.preferredGender
      ) {
        return false;
      }
      if (
        filters.livesInApartment !== undefined &&
        p.getLivesInApartment() !== filters.livesInApartment
      ) {
        return false;
      }
      return true;
    });
  }

  async findByPreference<K extends keyof AdopterPreferences>(
    key: K,
    value: AdopterPreferences[K],
  ): Promise<AdopterProfile[]> {
    return this.findByPreferences({ [key]: value } as Partial<AdopterPreferences>);
  }

  async create(adopterProfile: AdopterProfile): Promise<AdopterProfile> {
    if (!adopterProfile.getId()) {
      adopterProfile.setId(UUID.generate());
    }
    adopterProfile.setCreatedAt(new Date().toISOString());
    adopterProfile.setUpdatedAt(new Date().toISOString());
    this.profiles.push(adopterProfile);
    return adopterProfile;
  }

  async update(updatedProfile: AdopterProfile): Promise<AdopterProfile> {
    const index = this.profiles.findIndex(
      (p) =>
        (updatedProfile.getId() && p.getId().equals(updatedProfile.getId())) ||
        p.getUserId().equals(updatedProfile.getUserId()),
    );
    if (index === -1) {
      throw new Error('Not found');
    }
    updatedProfile.setUpdatedAt(new Date().toISOString());
    this.profiles[index] = updatedProfile;
    return updatedProfile;
  }

  async deleteById(id: UUID): Promise<AdopterProfile | null> {
    const index = this.profiles.findIndex((p) => p.getId().equals(id));
    if (index === -1) return null;
    const [deleted] = this.profiles.splice(index, 1);
    return deleted;
  }

  async deleteByUserId(userId: UUID): Promise<AdopterProfile | null> {
    const index = this.profiles.findIndex((p) => p.getUserId().equals(userId));
    if (index === -1) return null;
    const [deleted] = this.profiles.splice(index, 1);
    return deleted;
  }
}

describe('AdopterProfileService', () => {
  let repository: MockAdopterProfileRepository;
  let service: AdopterProfileService;
  const sampleUserId = '123e4567-e89b-12d3-a456-426614174000';
  const sampleProfileId = '223e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    repository = new MockAdopterProfileRepository();
    service = new AdopterProfileService(repository);
  });

  it('should countAll and getAll profiles', async () => {
    expect(await service.countAll()).toBe(0);
    expect(await service.getAll()).toEqual([]);

    await service.create({
      userId: sampleUserId,
      preferredSpecies: 'dog',
    });

    expect(await service.countAll()).toBe(1);
    const all = await service.getAll();
    expect(all.length).toBe(1);
    expect(all[0].getPreferredSpecies()).toBe('dog');
  });

  it('should get profile by id or throw NotFoundError', async () => {
    const created = await service.create({
      userId: sampleUserId,
      preferredSpecies: 'cat',
    });

    const found = await service.getById(created.getId().getValue());
    expect(found.getUserId().getValue()).toBe(sampleUserId);

    await expect(
      service.getById('999e4567-e89b-12d3-a456-426614174999'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should get profile by userId or throw NotFoundError', async () => {
    await service.create({
      userId: sampleUserId,
      preferredGender: 'female',
    });

    const found = await service.getByUserId(sampleUserId);
    expect(found.getPreferredGender()).toBe('female');

    await expect(
      service.getByUserId('999e4567-e89b-12d3-a456-426614174999'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should create an adopter profile and reject duplicate for same user', async () => {
    const created = await service.create({
      userId: sampleUserId,
      preferredSpecies: 'dog',
      preferredSize: 3,
      livesInApartment: true,
    });

    expect(created.getPreferredSpecies()).toBe('dog');
    expect(created.getPreferredSize()).toBe(3);
    expect(created.getLivesInApartment()).toBe(true);

    await expect(
      service.create({
        userId: sampleUserId,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should reject create with missing or invalid input', async () => {
    await expect(
      service.create(null as unknown as CreateAdopterProfileInput),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      service.create({ userId: '' } as unknown as CreateAdopterProfileInput),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should update profile by userId', async () => {
    await service.create({
      userId: sampleUserId,
      preferredSpecies: 'dog',
      preferredEnergy: 2,
    });

    const updated = await service.updateByUserId(sampleUserId, {
      preferredSpecies: 'cat',
      preferredEnergy: 5,
      hasOtherPets: true,
    });

    expect(updated.getPreferredSpecies()).toBe('cat');
    expect(updated.getPreferredEnergy()).toBe(5);
    expect(updated.getHasOtherPets()).toBe(true);
  });

  it('should throw NotFoundError when updating non-existent profile by userId', async () => {
    await expect(
      service.updateByUserId(sampleUserId, {
        preferredSpecies: 'dog',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should upsert profile correctly (create when absent, update when present)', async () => {
    const created = await service.upsert(sampleUserId, {
      preferredSpecies: 'dog',
      preferredSize: 2,
    });
    expect(created.getPreferredSpecies()).toBe('dog');
    expect(created.getPreferredSize()).toBe(2);

    const updated = await service.upsert(sampleUserId, {
      preferredSize: 4,
    });
    expect(updated.getPreferredSpecies()).toBe('dog');
    expect(updated.getPreferredSize()).toBe(4);
    expect(await service.countAll()).toBe(1);
  });

  it('should delete profile by id and by userId', async () => {
    const profile1 = await service.create({
      userId: sampleUserId,
    });
    const profile2 = await service.create({
      userId: '333e4567-e89b-12d3-a456-426614174333',
    });

    const deleted1 = await service.delete(profile1.getId().getValue());
    expect(deleted1.getId().getValue()).toBe(profile1.getId().getValue());
    expect(await service.countAll()).toBe(1);

    const deleted2 = await service.deleteByUserId(
      '333e4567-e89b-12d3-a456-426614174333',
    );
    expect(deleted2.getId().getValue()).toBe(profile2.getId().getValue());
    expect(await service.countAll()).toBe(0);

    await expect(service.delete(sampleProfileId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
