import {
  AnimalStatus,
  Conditions,
  Genders,
  Species,
  TriageStatus,
} from '@kapa/shared';
import { Cuid } from '../domains/Cuid';

export interface IAnimal {
  getId(): Cuid;
  getName(): string;
  getBreed(): string;
  getSpecie(): Species;
  getGender(): Genders;
  getWeightKg(): number;
  getAge(): number;
  getAgeStage(): number;
  getSize(): number;
  getEnergyLevel(): number;
  getKidFriendly(): number;
  getNoiseLevel(): number;
  getApartamentFriendly(): boolean;
  getOtherPetFriendly(): boolean;
  getHealthCondition(): Conditions;
  getCastrated(): TriageStatus;
  getVaccinated(): boolean;
  getDewormed(): TriageStatus;
  getRescuedAt(): string;
  getPlace(): string;
  getMood(): string;
  getObservations(): string | null;
  getStatus(): AnimalStatus;
  getCreatedAt(): string;

  setId(id: string | Cuid): void;
  setName(name: string): void;
  setBreed(breed: string): void;
  setSpecie(specie: Species): void;
  setGender(gender: Genders): void;
  setWeightKg(weightKg: number): void;
  setAge(age: number): void;
  setAgeStage(ageStage: number): void;
  setSize(size: number): void;
  setEnergyLevel(energyLevel: number): void;
  setKidFriendly(kidFriendly: number): void;
  setNoiseLevel(noiseLevel: number): void;
  setApartamentFriendly(apartamentFriendly: boolean): void;
  setOtherPetFriendly(otherPetFriendly: boolean): void;
  setHealthCondition(healthCondition: Conditions): void;
  setCastrated(castrated: TriageStatus): void;
  setVaccinated(vaccinated: boolean): void;
  setDewormed(dewormed: TriageStatus): void;
  setRescuedAt(rescuedAt: string): void;
  setPlace(place: string): void;
  setMood(mood: string): void;
  setObservations(observations: string | null): void;
  setStatus(status: AnimalStatus): void;
  setCreatedAt(date: string): void;
  toDTO(): import('@kapa/shared').Animal;
}
