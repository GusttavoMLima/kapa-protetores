import { AdoptionStatus, Adoption as SharedAdoption } from '@kapa/shared';
import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import { IAdoption } from '../interfaces/IAdoption';

export class Adoption implements IAdoption {
  private id!: Cuid;
  private adopterId!: UUID;
  private animalId!: Cuid;
  private status: AdoptionStatus = 'pending';
  private appliedAt!: string;
  private updatedAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getAdopterId(): UUID {
    return this.adopterId;
  }

  public getAnimalId(): Cuid {
    return this.animalId;
  }

  public getStatus(): AdoptionStatus {
    return this.status;
  }

  public getAppliedAt(): string {
    return this.appliedAt;
  }

  public getUpdatedAt(): string {
    return this.updatedAt;
  }

  public setId(id: string | Cuid): void {
    if (this.id) {
      return;
    }
    this.id = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setAdopterId(id: string | UUID): void {
    if (this.adopterId) {
      return;
    }
    this.adopterId = id instanceof UUID ? id : UUID.create(id);
  }

  public setAnimalId(id: string | Cuid): void {
    if (this.animalId) {
      return;
    }
    this.animalId = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setStatus(status: AdoptionStatus): void {
    this.status = status;
  }

  public setAppliedAt(date: string): void {
    if (this.appliedAt) {
      return;
    }
    this.appliedAt = new Date(date).toISOString();
  }

  public setUpdatedAt(date: string): void {
    this.updatedAt = new Date(date).toISOString();
  }

  public toDTO(): SharedAdoption {
    return {
      id: this.id ? this.id.getValue() : '',
      adopterId: this.adopterId ? this.adopterId.getValue() : '',
      animalId: this.animalId ? this.animalId.getValue() : '',
      status: this.status,
      appliedAt: this.appliedAt,
      updatedAt: this.updatedAt,
    };
  }

  public toJSON(): SharedAdoption {
    return this.toDTO();
  }
}

