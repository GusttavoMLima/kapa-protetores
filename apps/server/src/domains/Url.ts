import z from 'zod';
import { ValidationError } from '../errors';

export class Url {
  private readonly value: string;

  private constructor(url: string) {
    this.value = url;
  }

  public static create(url: string): Url {
    const trimmed = url.trim();

    if (
      !z.string().url().safeParse(trimmed).success ||
      !URL.canParse(trimmed)
    ) {
      throw new ValidationError(`Invalid url address: ${url}`);
    }

    return new Url(new URL(trimmed).toString());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Url): boolean {
    return this.value === other.getValue();
  }

  public toString(): string {
    return this.value;
  }
}
