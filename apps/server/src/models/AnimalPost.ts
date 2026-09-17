import { Cuid } from '../domains/Cuid';
import { IAnimalPost } from '../interfaces/IAnimalPost';
import { ValidationError } from '../errors';
import type { AnimalPost as SharedAnimalPost } from '@kapa/shared';

export class AnimalPost implements IAnimalPost {
  private id!: Cuid;
  private animalId!: Cuid;
  private description!: string;
  private createdAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getAnimalId(): Cuid {
    return this.animalId;
  }

  public getDescription(): string {
    return this.description;
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

  public setAnimalId(animalId: string | Cuid): void {
    if (this.animalId) {
      return;
    }
    this.animalId = animalId instanceof Cuid ? animalId : Cuid.create(animalId);
  }

  public setDescription(description: string): void {
    if (!description || !description.trim()) {
      throw new ValidationError('Description cannot be empty');
    }
    this.description = description.trim();
  }

  public setCreatedAt(date: string): void {
    if (this.createdAt) {
      return;
    }
    this.createdAt = new Date(date).toISOString();
  }

  public toDTO(): SharedAnimalPost {
    return {
      id: this.id ? this.id.getValue() : '',
      animalId: this.animalId ? this.animalId.getValue() : '',
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  public toJSON(): SharedAnimalPost {
    return this.toDTO();
  }
}

