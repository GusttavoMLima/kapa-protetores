import { UUID } from '../domains/UUID';
import { AdopterProfile } from '../models';
import type { AdopterProfile as SharedAdopterProfile } from '@kapa/shared';

export type AdopterPreferences = Pick<
  SharedAdopterProfile,
  | 'preferredSpecies'
  | 'preferredGender'
  | 'preferredSize'
  | 'preferredEnergy'
  | 'preferredKidFriendly'
  | 'preferredNoise'
  | 'preferredAgeStage'
  | 'livesInApartment'
  | 'hasOtherPets'
>;

export interface IAdopterProfileRepository {
  count(): Promise<number>;
  findAll(): Promise<AdopterProfile[]>;
  findById(id: UUID): Promise<AdopterProfile | null>;
  findByUserId(userId: UUID): Promise<AdopterProfile | null>;
  findByPreferences(
    filters: Partial<AdopterPreferences>,
  ): Promise<AdopterProfile[]>;
  findByPreference<K extends keyof AdopterPreferences>(
    key: K,
    value: AdopterPreferences[K],
  ): Promise<AdopterProfile[]>;
  create(adopterProfile: AdopterProfile): Promise<AdopterProfile>;
  update(updatedProfile: AdopterProfile): Promise<AdopterProfile>;
  deleteById(id: UUID): Promise<AdopterProfile | null>;
  deleteByUserId(userId: UUID): Promise<AdopterProfile | null>;
}
