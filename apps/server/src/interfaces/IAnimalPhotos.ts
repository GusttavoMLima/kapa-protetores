import { Cuid } from '../domains/Cuid';
import { Url } from '../domains/Url';
import type { AnimalPhoto as SharedAnimalPhoto } from '@kapa/shared';

export interface IAnimalPhoto {
  getId(): Cuid;
  getPhotoUrl(): Url;
  getAnimalId(): Cuid | null;
  getUploadedAt(): string;

  setId(id: string | Cuid): void;
  setPhotoUrl(url: string | Url): void;
  setAnimalId(id: string | Cuid | null): void;
  setUploadedAt(date: string): void;
  toDTO(): SharedAnimalPhoto;
}

