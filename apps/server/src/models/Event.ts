import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import { IEvent } from '../interfaces/IEvent';
import { ValidationError } from '../errors';
import {
  SystemEventTypes,
  type SystemEvent,
} from '@kapa/shared';

export class Event implements IEvent {
  private id!: Cuid;
  private type!: SystemEventTypes;
  private userId: UUID | null = null;
  private animalId: Cuid | null = null;
  private payload: Record<string, unknown> | null = null;
  private emittedAt!: string;

  public getId(): Cuid {
    return this.id;
  }

  public getType(): SystemEventTypes {
    return this.type;
  }

  public getUserId(): UUID | null {
    return this.userId;
  }

  public getAnimalId(): Cuid | null {
    return this.animalId;
  }

  public getPayload(): Record<string, unknown> | null {
    return this.payload;
  }

  public getEmittedAt(): string {
    return this.emittedAt;
  }

  public setId(id: string | Cuid): void {
    if (this.id) {
      return;
    }
    this.id = id instanceof Cuid ? id : Cuid.create(id);
  }

  public setType(type: SystemEventTypes): void {
    if (!type || !Object.values(SystemEventTypes).includes(type)) {
      throw new ValidationError('Invalid event type');
    }
    this.type = type;
  }

  public setUserId(userId: string | UUID | null): void {
    if (!userId) {
      this.userId = null;
      return;
    }
    this.userId = userId instanceof UUID ? userId : UUID.create(userId);
  }

  public setAnimalId(animalId: string | Cuid | null): void {
    if (!animalId) {
      this.animalId = null;
      return;
    }
    this.animalId = animalId instanceof Cuid ? animalId : Cuid.create(animalId);
  }

  public setPayload(payload: Record<string, unknown> | null): void {
    this.payload = payload;
  }

  public setEmittedAt(emittedAt: string): void {
    if (this.emittedAt) {
      return;
    }
    this.emittedAt = new Date(emittedAt).toISOString();
  }

  public toDTO(): SystemEvent {
    return {
      id: this.id ? this.id.getValue() : '',
      type: this.type,
      userId: this.userId ? this.userId.getValue() : null,
      animalId: this.animalId ? this.animalId.getValue() : null,
      payload: this.payload,
      emittedAt: this.emittedAt,
    };
  }

  public toJSON(): SystemEvent {
    return this.toDTO();
  }
}
