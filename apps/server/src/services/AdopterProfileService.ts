import {
  CreateAdopterProfileInput,
  UpdateAdopterProfileInput,
} from '@kapa/shared';
import { UUID } from '../domains/UUID';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../errors';
import {
  AdopterPreferences,
  IAdopterProfileRepository,
} from '../interfaces';
import { AdopterProfile } from '../models';

export class AdopterProfileService {
  constructor(private readonly repository: IAdopterProfileRepository) {}

  private applyPreferences(
    profile: AdopterProfile,
    input: Partial<AdopterPreferences>,
  ): void {
    const setters: {
      [K in keyof AdopterPreferences]-?: (
        val: NonNullable<AdopterPreferences[K]> | null,
      ) => void;
    } = {
      preferredSpecies: (val) => profile.setPreferredSpecies(val),
      preferredGender: (val) => profile.setPreferredGender(val),
      preferredSize: (val) => profile.setPreferredSize(val),
      preferredEnergy: (val) => profile.setPreferredEnergy(val),
      preferredKidFriendly: (val) => profile.setPreferredKidFriendly(val),
      preferredNoise: (val) => profile.setPreferredNoise(val),
      preferredAgeStage: (val) => profile.setPreferredAgeStage(val),
      livesInApartment: (val) => profile.setLivesInApartment(val),
      hasOtherPets: (val) => profile.setHasOtherPets(val),
    };

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && key in setters) {
        const setter = setters[key as keyof AdopterPreferences];
        (setter as (val: unknown) => void)(value);
      }
    }
  }

  async countAll(): Promise<number> {
    return this.repository.count();
  }

  async getAll(): Promise<AdopterProfile[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<AdopterProfile> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Id is required.');
    }

    const safeId = UUID.create(id);
    const profile = await this.repository.findById(safeId);

    if (!profile) {
      throw new NotFoundError('Adopter Profile not found with id: ' + id);
    }

    return profile;
  }

  async getByUserId(userId: string): Promise<AdopterProfile> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestError('User id is required.');
    }

    const safeUserId = UUID.create(userId);
    const profile = await this.repository.findByUserId(safeUserId);

    if (!profile) {
      throw new NotFoundError(
        'Adopter Profile not found with user id: ' + userId,
      );
    }

    return profile;
  }

  async getByPreferences(
    filters: Partial<AdopterPreferences>,
  ): Promise<AdopterProfile[]> {
    if (!filters || typeof filters !== 'object') {
      throw new BadRequestError('Invalid preferences filter.');
    }

    return this.repository.findByPreferences(filters);
  }

  async getByPreference<K extends keyof AdopterPreferences>(
    key: K,
    value: AdopterPreferences[K],
  ): Promise<AdopterProfile[]> {
    return this.repository.findByPreference(key, value);
  }

  async create(input: CreateAdopterProfileInput): Promise<AdopterProfile> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestError('User data invalid.');
    }

    if (!input.userId) {
      throw new BadRequestError('user_id is required.');
    }

    const safeUserId = UUID.create(input.userId);
    const existing = await this.repository.findByUserId(safeUserId);

    if (existing) {
      throw new ConflictError(
        'Adopter Profile already exists for user id: ' + input.userId,
      );
    }

    const profile = new AdopterProfile();
    profile.setUserId(safeUserId);
    this.applyPreferences(profile, input);

    return this.repository.create(profile);
  }

  async update(
    id: string,
    input: UpdateAdopterProfileInput,
  ): Promise<AdopterProfile> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestError('Invalid update data.');
    }

    const profile = await this.getById(id);
    this.applyPreferences(profile, input);

    return this.repository.update(profile);
  }

  async updateByUserId(
    userId: string,
    input: UpdateAdopterProfileInput,
  ): Promise<AdopterProfile> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestError('Invalid update data.');
    }

    const profile = await this.getByUserId(userId);
    this.applyPreferences(profile, input);

    return this.repository.update(profile);
  }

  async upsert(
    userId: string,
    input: UpdateAdopterProfileInput,
  ): Promise<AdopterProfile> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestError('User id is required.');
    }

    const safeUserId = UUID.create(userId);
    const existing = await this.repository.findByUserId(safeUserId);

    if (existing) {
      this.applyPreferences(existing, input);
      return this.repository.update(existing);
    }

    return this.create({
      ...input,
      userId,
    });
  }

  async delete(id: string): Promise<AdopterProfile> {
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Id is required.');
    }

    const safeId = UUID.create(id);
    const deleted = await this.repository.deleteById(safeId);

    if (!deleted) {
      throw new NotFoundError('Adopter Profile not found with id: ' + id);
    }

    return deleted;
  }

  async deleteByUserId(userId: string): Promise<AdopterProfile> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestError('User id is required.');
    }

    const safeUserId = UUID.create(userId);
    const deleted = await this.repository.deleteByUserId(safeUserId);

    if (!deleted) {
      throw new NotFoundError(
        'Adopter Profile not found with user id: ' + userId,
      );
    }

    return deleted;
  }
}
