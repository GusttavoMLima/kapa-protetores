import { Cuid } from '../domains/Cuid';
import { ICommunityEvent } from '../interfaces/ICommunityEvent';
import { ValidationError } from '../errors';
import type { CommunityEvent as SharedCommunityEvent } from '@kapa/shared';

export class CommunityEvent implements ICommunityEvent {
  private id!: Cuid;
  private title!: string;
  private description!: string;
  private cep!: number;
  private startAt!: string;
  private createdAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCep(): number {
    return this.cep;
  }

  public getStartAt(): string {
    return this.startAt;
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

  public setTitle(title: string): void {
    if (!title || !title.trim()) {
      throw new ValidationError('Event title cannot be empty');
    }
    this.title = title.trim();
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public setCep(cep: number): void {
    if (cep < 0) {
      throw new ValidationError('Invalid CEP');
    }
    this.cep = cep;
  }

  public setStartAt(date: string): void {
    this.startAt = new Date(date).toISOString();
  }

  public setCreatedAt(date: string): void {
    if (this.createdAt) {
      return;
    }
    this.createdAt = new Date(date).toISOString();
  }

  public toDTO(): SharedCommunityEvent {
    return {
      id: this.id ? this.id.getValue() : '',
      title: this.title,
      description: this.description,
      cep: this.cep,
      startAt: this.startAt,
      createdAt: this.createdAt,
    };
  }

  public toJSON(): SharedCommunityEvent {
    return this.toDTO();
  }
}

