import { Cuid } from '../domains/Cuid';
import { Url } from '../domains/Url';
import { IAnimalPhoto } from '../interfaces/IAnimalPhotos';
import type { AnimalPhoto as SharedAnimalPhoto } from '@kapa/shared';

export class AnimalPhoto implements IAnimalPhoto {
  private id!: Cuid;
  private photoUrl!: Url;
  private animalId: Cuid | null = null;
  private uploadedAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getPhotoUrl(): Url {
    return this.photoUrl;
  }

  public getAnimalId(): Cuid | null {
    return this.animalId;
  }

  public getUploadedAt(): string {
    return this.uploadedAt;
  }

  public setId(id: string | Cuid): void {
    if (this.id) {
      return;
    }
    this.id = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setPhotoUrl(url: string | Url): void {
    this.photoUrl = url instanceof Url ? url : Url.create(url);
  }

  public setAnimalId(id: string | Cuid | null): void {
    if (!id) {
      this.animalId = null;
      return;
    }
    this.animalId = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setUploadedAt(date: string): void {
    if (this.uploadedAt) {
      return;
    }
    this.uploadedAt = new Date(date).toISOString();
  }

  public toDTO(): SharedAnimalPhoto {
    return {
      id: this.id ? this.id.getValue() : '',
      photoUrl: this.photoUrl ? this.photoUrl.getValue() : '',
      uploadedAt: this.uploadedAt,
      animalId: this.animalId ? this.animalId.getValue() : null,
    };
  }

  public toJSON(): SharedAnimalPhoto {
    return this.toDTO();
  }
}

