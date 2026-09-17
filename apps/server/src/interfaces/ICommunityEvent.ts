import { Cuid } from '../domains/Cuid';
import type { CommunityEvent as SharedCommunityEvent } from '@kapa/shared';

export interface ICommunityEvent {
  getId(): Cuid;
  getTitle(): string;
  getDescription(): string;
  getCep(): number;
  getStartAt(): string;
  getCreatedAt(): string;

  setId(id: string | Cuid): void;
  setTitle(title: string): void;
  setDescription(description: string): void;
  setCep(cep: number): void;
  setStartAt(date: string): void;
  setCreatedAt(date: string): void;
  toDTO(): SharedCommunityEvent;
}

