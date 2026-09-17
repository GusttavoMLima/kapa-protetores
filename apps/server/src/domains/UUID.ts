import { ValidationError } from '../errors';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export class UUID {
  private readonly value: string;
  private static readonly uuidSchema = z.string().uuid();

  private constructor(value: string) {
    this.value = value.toLowerCase();
  }

  public static generate(): UUID {
    return new UUID(randomUUID());
  }

  public static create(value: string): UUID {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('UUID cannot be empty');
    }

    const trimmed = value.trim();
    const parseResult = this.uuidSchema.safeParse(trimmed);

    if (!parseResult.success) {
      throw new ValidationError(`Invalid UUID format: ${value}`);
    }

    return new UUID(trimmed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other?: UUID | null): boolean {
    if (!other || !(other instanceof UUID)) {
      return false;
    }
    return this.value === other.getValue();
  }

  public toJSON(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
