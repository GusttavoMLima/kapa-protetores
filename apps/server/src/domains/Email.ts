import { ValidationError } from '../errors';
import { z } from 'zod';

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  public static create(email: string): Email {
    const trimmed = email.trim().toLowerCase();

    if (!z.string().email().safeParse(trimmed).success) {
      throw new ValidationError(`Invalid email address: ${email}`);
    }

    return new Email(trimmed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.getValue();
  }

  public toString(): string {
    return this.value;
  }
}