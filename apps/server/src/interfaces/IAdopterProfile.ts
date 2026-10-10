import { AdopterProfile, Genders, Species } from '@kapa/shared';
import { UUID } from '../domains/UUID';

export interface IAdopterProfile {
  getId(): UUID;
  getUserId(): UUID;
  getPreferredSpecies(): Species | null;
  getPreferredGender(): Genders | null;
  getPreferredSize(): number | null;
  getPreferredEnergy(): number | null;
  getPreferredKidFriendly(): number | null;
  getPreferredNoise(): number | null;
  getPreferredAgeStage(): number | null;
  getLivesInApartment(): boolean | null;
  getHasOtherPets(): boolean | null;
  getCreatedAt(): string;
  getUpdatedAt(): string;

  setId(id: UUID | string): void;
  setUserId(id: UUID | string): void;
  setPreferredSpecies(specie: Species | null): void;
  setPreferredGender(gender: Genders | null): void;
  setPreferredSize(size: number | null): void;
  setPreferredEnergy(energy: number | null): void;
  setPreferredKidFriendly(friendly: number | null): void;
  setPreferredNoise(noise: number | null): void;
  setPreferredAgeStage(age_stage: number | null): void;
  setLivesInApartment(apartament: boolean | null): void;
  setHasOtherPets(otherPets: boolean | null): void;
  setCreatedAt(createdAt: string): void;
  setUpdatedAt(updatedAt: string): void;
  toDTO(): AdopterProfile;
  toJSON(): AdopterProfile;
}
