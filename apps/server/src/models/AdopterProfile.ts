import {
  Species,
  Genders,
  AdopterProfile as SharedAdopterProfile,
} from '@kapa/shared';
import { UUID } from '../domains/UUID';
import { IAdopterProfile } from '../interfaces/IAdopterProfile';
import { ValidationError } from '../errors';

export class AdopterProfile implements IAdopterProfile {
  private id!: UUID;
  private userId!: UUID;
  private preferredSpecies: Species | null = null;
  private preferredGender: Genders | null = null;
  private preferredSize: number | null = null;
  private preferredEnergy: number | null = null;
  private preferredKidFriendly: number | null = null;
  private preferredNoise: number | null = null;
  private preferredAgeStage: number | null = null;
  private livesInApartment: boolean | null = null;
  private hasOtherPets: boolean | null = null;
  private createdAt!: string;
  private updatedAt!: string;

  constructor() {}

  public getId(): UUID {
    return this.id;
  }

  public getUserId(): UUID {
    return this.userId;
  }

  public getPreferredSpecies(): Species | null {
    return this.preferredSpecies;
  }

  public getPreferredGender(): Genders | null {
    return this.preferredGender;
  }

  public getPreferredSize(): number | null {
    return this.preferredSize;
  }

  public getPreferredEnergy(): number | null {
    return this.preferredEnergy;
  }

  public getPreferredKidFriendly(): number | null {
    return this.preferredKidFriendly;
  }

  public getPreferredNoise(): number | null {
    return this.preferredNoise;
  }

  public getPreferredAgeStage(): number | null {
    return this.preferredAgeStage;
  }

  public getLivesInApartment(): boolean | null {
    return this.livesInApartment;
  }

  public getHasOtherPets(): boolean | null {
    return this.hasOtherPets;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public getUpdatedAt(): string {
    return this.updatedAt;
  }

  public setId(id: UUID | string): void {
    if (this.id) {
      return;
    }
    this.id = id instanceof UUID ? id : UUID.create(id);
  }

  public setUserId(id: UUID | string): void {
    if (this.userId) {
      return;
    }
    this.userId = id instanceof UUID ? id : UUID.create(id);
  }

  public setPreferredSpecies(specie: Species | null): void {
    this.preferredSpecies = specie;
  }

  public setPreferredGender(gender: Genders | null): void {
    this.preferredGender = gender;
  }

  public setPreferredSize(size: number | null): void {
    if (size !== null && size !== undefined && size < 0) {
      throw new ValidationError('Preferred size cannot be negative');
    }
    this.preferredSize = size ?? null;
  }

  public setPreferredEnergy(energy: number | null): void {
    if (energy !== null && energy !== undefined && energy < 0) {
      throw new ValidationError('Preferred energy cannot be negative');
    }
    this.preferredEnergy = energy ?? null;
  }

  public setPreferredKidFriendly(friendly: number | null): void {
    if (friendly !== null && friendly !== undefined && friendly < 0) {
      throw new ValidationError('Preferred kid friendly score cannot be negative');
    }
    this.preferredKidFriendly = friendly ?? null;
  }

  public setPreferredNoise(noise: number | null): void {
    if (noise !== null && noise !== undefined && noise < 0) {
      throw new ValidationError('Preferred noise level cannot be negative');
    }
    this.preferredNoise = noise ?? null;
  }

  public setPreferredAgeStage(age_stage: number | null): void {
    if (age_stage !== null && age_stage !== undefined && age_stage < 0) {
      throw new ValidationError('Preferred age stage cannot be negative');
    }
    this.preferredAgeStage = age_stage ?? null;
  }

  public setLivesInApartment(apartament: boolean | null): void {
    this.livesInApartment = apartament ?? null;
  }

  public setHasOtherPets(otherPets: boolean | null): void {
    this.hasOtherPets = otherPets ?? null;
  }

  public setCreatedAt(createdAt: string): void {
    if (this.createdAt) {
      return;
    }
    this.createdAt = new Date(createdAt).toISOString();
  }

  public setUpdatedAt(updatedAt: string): void {
    this.updatedAt = new Date(updatedAt).toISOString();
  }

  public toDTO(): SharedAdopterProfile {
    return {
      id: this.id ? this.id.getValue() : '',
      userId: this.userId ? this.userId.getValue() : '',
      preferredSpecies: this.preferredSpecies,
      preferredGender: this.preferredGender,
      preferredSize: this.preferredSize,
      preferredEnergy: this.preferredEnergy,
      preferredKidFriendly: this.preferredKidFriendly,
      preferredNoise: this.preferredNoise,
      preferredAgeStage: this.preferredAgeStage,
      livesInApartment: this.livesInApartment,
      hasOtherPets: this.hasOtherPets,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toJSON(): SharedAdopterProfile {
    return this.toDTO();
  }
}