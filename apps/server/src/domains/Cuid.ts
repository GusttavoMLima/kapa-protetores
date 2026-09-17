import { ValidationError } from '../errors';
import { z } from 'zod';

export class Cuid {
  private readonly value: string;
  private static readonly cuidSchema = z.string().cuid();

  private constructor(value: string) {
    this.value = value.toLowerCase();
  }

  public static create(value: string): Cuid {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Cuid cannot be empty');
    }

    const trimmed = value.trim();
    const parseResult = this.cuidSchema.safeParse(trimmed);

    if (!parseResult.success) {
      throw new ValidationError(`Invalid Cuid format: ${value}`);
    }

    return new Cuid(trimmed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other?: Cuid | null): boolean {
    if (!other || !(other instanceof Cuid)) {
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
