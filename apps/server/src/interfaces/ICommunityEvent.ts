import { Cuid } from '../domains/Cuid';
import type { CommunityEvent as SharedCommunityEvent } from '@kapa/shared';
import type { CommunityEventType } from '@kapa/shared';

export interface ICommunityEvent {
  getId(): Cuid;
  getTitle(): string;
  getDescription(): string;
  getCep(): number;
  getType(): CommunityEventType;
  getStartAt(): string;
  getEndAt(): string | null;
  getLocation(): string | null;
  getVacancies(): number | null;
  getCreatedAt(): string;

  setId(id: string | Cuid): void;
  setTitle(title: string): void;
  setDescription(description: string): void;
  setCep(cep: number): void;
  setType(type: CommunityEventType): void;
  setStartAt(date: string): void;
  setEndAt(date: string | null): void;
  setLocation(location: string | null): void;
  setVacancies(vacancies: number | null): void;
  setCreatedAt(date: string): void;
  toDTO(): SharedCommunityEvent;
}

