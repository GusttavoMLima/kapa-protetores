import type {
  Species,
  Genders,
  Conditions,
  TriageStatus,
  AnimalStatus,
  Animal as IAnimalDTO,
} from '@kapa/shared';
import { IAnimal } from '../interfaces/IAnimal';
import { Cuid } from '../domains/Cuid';
import { ValidationError } from '../errors';

export class Animal implements IAnimal {
  private id!: Cuid;
  private name!: string;
  private breed!: string;
  private specie!: Species;
  private gender!: Genders;
  private weightKg: number = 0;
  private age: number = 0;
  private ageStage: number = 0;
  private size: number = 0;
  private energyLevel: number = 0;
  private kidFriendly: number = 0;
  private noiseLevel: number = 0;
  private apartamentFriendly: boolean = false;
  private otherPetFriendly: boolean = false;
  private healthCondition: Conditions = 'healthy';
  private castrated: TriageStatus = 'unknown';
  private vaccinated: boolean = false;
  private dewormed: TriageStatus = 'unknown';
  private rescuedAt!: string;
  private place!: string;
  private mood!: string;
  private observations: string | null = null;
  private status: AnimalStatus = 'rescued';
  private createdAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getBreed(): string {
    return this.breed;
  }

  public getSpecie(): Species {
    return this.specie;
  }

  public getSpecies(): Species {
    return this.specie;
  }

  public getGender(): Genders {
    return this.gender;
  }

  public getWeightKg(): number {
    return this.weightKg;
  }

  public getAge(): number {
    return this.age;
  }

  public getAgeStage(): number {
    return this.ageStage;
  }

  public getSize(): number {
    return this.size;
  }

  public getEnergyLevel(): number {
    return this.energyLevel;
  }

  public getKidFriendly(): number {
    return this.kidFriendly;
  }

  public getNoiseLevel(): number {
    return this.noiseLevel;
  }

  public getApartamentFriendly(): boolean {
    return this.apartamentFriendly;
  }

  public getApartmentFriendly(): boolean {
    return this.apartamentFriendly;
  }

  public getOtherPetFriendly(): boolean {
    return this.otherPetFriendly;
  }

  public getHealthCondition(): Conditions {
    return this.healthCondition;
  }

  public getCastrated(): TriageStatus {
    return this.castrated;
  }

  public getVaccinated(): boolean {
    return this.vaccinated;
  }

  public getDewormed(): TriageStatus {
    return this.dewormed;
  }

  public getRescuedAt(): string {
    return this.rescuedAt;
  }

  public getPlace(): string {
    return this.place;
  }

  public getMood(): string {
    return this.mood;
  }

  public getObservations(): string | null {
    return this.observations;
  }

  public getStatus(): AnimalStatus {
    return this.status;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public setId(id: string | Cuid): void {
    if (this.id) {
      return;
    }
    this.id = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setName(name: string): void {
    if (!name || !name.trim()) {
      throw new ValidationError('Animal name cannot be empty');
    }
    this.name = name.trim();
  }

  public setBreed(breed: string): void {
    this.breed = breed;
  }

  public setSpecie(specie: Species): void {
    this.specie = specie;
  }

  public setSpecies(species: Species): void {
    this.specie = species;
  }

  public setGender(gender: Genders): void {
    this.gender = gender;
  }

  public setWeightKg(weightKg: number): void {
    if (weightKg < 0) {
      throw new ValidationError('Weight cannot be negative');
    }
    this.weightKg = weightKg;
  }

  public setAge(age: number): void {
    if (age < 0) {
      throw new ValidationError('Age cannot be negative');
    }
    this.age = age;
  }

  public setAgeStage(ageStage: number): void {
    this.ageStage = ageStage;
  }

  public setSize(size: number): void {
    this.size = size;
  }

  public setEnergyLevel(energyLevel: number): void {
    this.energyLevel = energyLevel;
  }

  public setKidFriendly(kidFriendly: number): void {
    this.kidFriendly = kidFriendly;
  }

  public setNoiseLevel(noiseLevel: number): void {
    this.noiseLevel = noiseLevel;
  }

  public setApartamentFriendly(apartamentFriendly: boolean): void {
    this.apartamentFriendly = apartamentFriendly;
  }

  public setApartmentFriendly(apartmentFriendly: boolean): void {
    this.apartamentFriendly = apartmentFriendly;
  }

  public setOtherPetFriendly(otherPetFriendly: boolean): void {
    this.otherPetFriendly = otherPetFriendly;
  }

  public setHealthCondition(condition: Conditions): void {
    this.healthCondition = condition;
  }

  public setCastrated(castrated: TriageStatus): void {
    this.castrated = castrated;
  }

  public setVaccinated(vaccinated: boolean): void {
    this.vaccinated = vaccinated;
  }

  public setDewormed(dewormed: TriageStatus): void {
    this.dewormed = dewormed;
  }

  public setRescuedAt(rescuedAt: string): void {
    this.rescuedAt = new Date(rescuedAt).toISOString();
  }

  public setPlace(place: string): void {
    this.place = place;
  }

  public setMood(mood: string): void {
    this.mood = mood;
  }

  public setObservations(observation: string | null): void {
    this.observations = observation;
  }

  public setStatus(status: AnimalStatus): void {
    this.status = status;
  }

  public setCreatedAt(createdAt: string): void {
    if (this.createdAt) {
      return;
    }
    this.createdAt = new Date(createdAt).toISOString();
  }

  public toDTO(): IAnimalDTO {
    return {
      id: this.id ? this.id.getValue() : '',
      name: this.name,
      breed: this.breed,
      species: this.specie,
      gender: this.gender,
      weightKg: this.weightKg,
      age: this.age,
      ageStage: this.ageStage,
      size: this.size,
      energyLevel: this.energyLevel,
      kidFriendly: this.kidFriendly,
      noiseLevel: this.noiseLevel,
      apartmentFriendly: this.apartamentFriendly,
      otherPetFriendly: this.otherPetFriendly,
      healthCondition: this.healthCondition,
      castrated: this.castrated,
      vaccinated: this.vaccinated,
      dewormed: this.dewormed,
      rescuedAt: this.rescuedAt,
      place: this.place,
      mood: this.mood,
      observations: this.observations,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public toJSON(): IAnimalDTO {
    return this.toDTO();
  }
}


