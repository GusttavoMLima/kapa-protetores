import { Cuid } from '../domains/Cuid';
import { UUID } from '../domains/UUID';
import { IFavorite } from '../interfaces/IFavorite';
import type { Favorite as SharedFavorite } from '@kapa/shared';

export class Favorite implements IFavorite {
  private userId!: UUID;
  private animalId!: Cuid;
  private createdAt!: string;

  public getUserId(): UUID {
    return this.userId;
  }

  public getAnimalId(): Cuid {
    return this.animalId;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public setUserId(id: string | UUID): void {
    if (this.userId) {
      return;
    }
    this.userId = id instanceof UUID ? id : UUID.create(id);
  }

  public setAnimalId(id: string | Cuid): void {
    if (this.animalId) {
      return;
    }
    this.animalId = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setCreatedAt(date: string): void {
    if (this.createdAt) {
      return;
    }
    this.createdAt = new Date(date).toISOString();
  }

  public toDTO(): SharedFavorite {
    return {
      userId: this.userId ? this.userId.getValue() : '',
      animalId: this.animalId ? this.animalId.getValue() : '',
      createdAt: this.createdAt,
    };
  }

  public toJSON(): SharedFavorite {
    return this.toDTO();
  }
}

