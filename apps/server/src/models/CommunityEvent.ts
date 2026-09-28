import { Cuid } from '../domains/Cuid';
import { ICommunityEvent } from '../interfaces/ICommunityEvent';
import { ValidationError } from '../errors';
import type { CommunityEvent as SharedCommunityEvent } from '@kapa/shared';
import type { CommunityEventType } from '@kapa/shared';

export class CommunityEvent implements ICommunityEvent {
  private id!: Cuid;
  private title!: string;
  private description!: string;
  private cep!: number;
  private type: CommunityEventType = 'event';
  private startAt!: string;
  private endAt: string | null = null;
  private location: string | null = null;
  private vacancies: number | null = null;
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

  public getType(): CommunityEventType { return this.type; }

  public getStartAt(): string {
    return this.startAt;
  }

  public getEndAt(): string | null { return this.endAt; }
  public getLocation(): string | null { return this.location; }
  public getVacancies(): number | null { return this.vacancies; }

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
    if (!Number.isInteger(cep) || cep < 1_000_000 || cep > 99_999_999) {
      throw new ValidationError('Invalid CEP');
    }
    this.cep = cep;
  }

  public setType(type: CommunityEventType): void { this.type = type; }

  public setStartAt(date: string): void {
    this.startAt = new Date(date).toISOString();
  }

  public setEndAt(date: string | null): void {
    this.endAt = date ? new Date(date).toISOString() : null;
  }

  public setLocation(location: string | null): void {
    this.location = location?.trim() || null;
  }

  public setVacancies(vacancies: number | null): void {
    if (vacancies !== null && (!Number.isInteger(vacancies) || vacancies < 1)) {
      throw new ValidationError('Invalid community event vacancies');
    }
    this.vacancies = vacancies;
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
      type: this.type,
      startAt: this.startAt,
      endAt: this.endAt,
      location: this.location,
      vacancies: this.vacancies,
      createdAt: this.createdAt,
    };
  }

  public toJSON(): SharedCommunityEvent {
    return this.toDTO();
  }
}

