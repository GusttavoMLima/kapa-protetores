import { PrismaClient, Prisma } from '@prisma/client';
import { AdopterPreferences, IAdopterProfileRepository } from '../interfaces';
import { UUID } from '../domains/UUID';
import { AdopterProfile } from '../models';
import { AdopterProfile as AdopterProfilePrisma } from '@prisma/client';
import { ValidationError } from '../errors';

export class AdopterProfileRepository implements IAdopterProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToDomain(record: AdopterProfilePrisma): AdopterProfile {
    const profile = new AdopterProfile();
    profile.setId(record.id);
    profile.setUserId(record.user_id);
    profile.setPreferredSpecies(record.preferred_species);
    profile.setPreferredGender(record.preferred_gender);
    profile.setPreferredSize(record.preferred_size);
    profile.setPreferredEnergy(record.preferred_energy);
    profile.setPreferredKidFriendly(record.preferred_kid_friendly);
    profile.setPreferredNoise(record.preferred_noise);
    profile.setPreferredAgeStage(record.preferred_age_stage);
    profile.setLivesInApartment(record.lives_in_apartment);
    profile.setHasOtherPets(record.has_other_pets);
    profile.setCreatedAt(record.created_at.toISOString());
    profile.setUpdatedAt(record.updated_at.toISOString());

    return profile;
  }

  private mapPreferencesToPrismaWhere(
    filters: Partial<AdopterPreferences>,
  ): Prisma.AdopterProfileWhereInput {
    const where: Prisma.AdopterProfileWhereInput = {};

    if (filters.preferredSpecies !== undefined) {
      where.preferred_species = filters.preferredSpecies;
    }
    if (filters.preferredGender !== undefined) {
      where.preferred_gender = filters.preferredGender;
    }
    if (filters.preferredSize !== undefined) {
      where.preferred_size = filters.preferredSize;
    }
    if (filters.preferredEnergy !== undefined) {
      where.preferred_energy = filters.preferredEnergy;
    }
    if (filters.preferredKidFriendly !== undefined) {
      where.preferred_kid_friendly = filters.preferredKidFriendly;
    }
    if (filters.preferredNoise !== undefined) {
      where.preferred_noise = filters.preferredNoise;
    }
    if (filters.preferredAgeStage !== undefined) {
      where.preferred_age_stage = filters.preferredAgeStage;
    }
    if (filters.livesInApartment !== undefined) {
      where.lives_in_apartment = filters.livesInApartment;
    }
    if (filters.hasOtherPets !== undefined) {
      where.has_other_pets = filters.hasOtherPets;
    }

    return where;
  }

  async count(): Promise<number> {
    return await this.prisma.adopterProfile.count();
  }

  async findAll(): Promise<AdopterProfile[]> {
    const records = await this.prisma.adopterProfile.findMany();
    return records.map((profile) => this.mapToDomain(profile));
  }

  async findById(id: UUID): Promise<AdopterProfile | null> {
    if (!id) return null;

    const data = await this.prisma.adopterProfile.findUnique({
      where: {
        id: id.toString(),
      },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findByUserId(userId: UUID): Promise<AdopterProfile | null> {
    if (!userId) return null;

    const data = await this.prisma.adopterProfile.findUnique({
      where: {
        user_id: userId.toString(),
      },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findByPreferences(
    filters: Partial<AdopterPreferences>,
  ): Promise<AdopterProfile[]> {
    const where = this.mapPreferencesToPrismaWhere(filters);

    const records = await this.prisma.adopterProfile.findMany({
      where,
    });

    return records.map((record) => this.mapToDomain(record));
  }

  async findByPreference<K extends keyof AdopterPreferences>(
    key: K,
    value: AdopterPreferences[K],
  ): Promise<AdopterProfile[]> {
    return this.findByPreferences({
      [key]: value,
    } as Partial<AdopterPreferences>);
  }

  async create(adopterProfile: AdopterProfile): Promise<AdopterProfile> {
    const id = adopterProfile.getId()
      ? adopterProfile.getId().toString()
      : undefined;
    const userId = adopterProfile.getUserId()
      ? adopterProfile.getUserId().toString()
      : undefined;

    if (!userId) {
      throw new ValidationError(
        'userId is required to create an adopter profile',
      );
    }

    const record = await this.prisma.adopterProfile.create({
      data: {
        ...(id ? { id } : {}),
        user_id: userId,
        preferred_species: adopterProfile.getPreferredSpecies(),
        preferred_gender: adopterProfile.getPreferredGender(),
        preferred_size: adopterProfile.getPreferredSize(),
        preferred_energy: adopterProfile.getPreferredEnergy(),
        preferred_kid_friendly: adopterProfile.getPreferredKidFriendly(),
        preferred_noise: adopterProfile.getPreferredNoise(),
        preferred_age_stage: adopterProfile.getPreferredAgeStage(),
        lives_in_apartment: adopterProfile.getLivesInApartment(),
        has_other_pets: adopterProfile.getHasOtherPets(),
      },
    });

    return this.mapToDomain(record);
  }

  async update(updatedProfile: AdopterProfile): Promise<AdopterProfile> {
    const id = updatedProfile.getId()?.toString();
    const userId = updatedProfile.getUserId()?.toString();

    if (!id && !userId) {
      throw new ValidationError(
        'Profile id or userId is required to update an adopter profile',
      );
    }

    const where: Prisma.AdopterProfileWhereUniqueInput = id
      ? { id }
      : { user_id: userId! };

    const record = await this.prisma.adopterProfile.update({
      where,
      data: {
        preferred_species: updatedProfile.getPreferredSpecies(),
        preferred_gender: updatedProfile.getPreferredGender(),
        preferred_size: updatedProfile.getPreferredSize(),
        preferred_energy: updatedProfile.getPreferredEnergy(),
        preferred_kid_friendly: updatedProfile.getPreferredKidFriendly(),
        preferred_noise: updatedProfile.getPreferredNoise(),
        preferred_age_stage: updatedProfile.getPreferredAgeStage(),
        lives_in_apartment: updatedProfile.getLivesInApartment(),
        has_other_pets: updatedProfile.getHasOtherPets(),
      },
    });

    return this.mapToDomain(record);
  }

  async deleteById(id: UUID): Promise<AdopterProfile | null> {
    if (!id) return null;

    try {
      const record = await this.prisma.adopterProfile.delete({
        where: {
          id: id.toString(),
        },
      });

      return this.mapToDomain(record);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        return null;
      }
      throw error;
    }
  }

  async deleteByUserId(userId: UUID): Promise<AdopterProfile | null> {
    if (!userId) return null;

    try {
      const record = await this.prisma.adopterProfile.delete({
        where: {
          user_id: userId.toString(),
        },
      });

      return this.mapToDomain(record);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        return null;
      }
      throw error;
    }
  }
}
