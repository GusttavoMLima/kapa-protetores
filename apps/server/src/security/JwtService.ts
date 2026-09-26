import { createHmac, timingSafeEqual } from 'node:crypto';
import type { JwtPayload, UserRole } from '@kapa/shared';
import { AppError } from '../errors';

type TokenPayload = JwtPayload & { role: UserRole; iss: string; aud: string };

const encode = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly issuer: string,
    private readonly audience: string,
    private readonly ttlSeconds: number,
  ) {
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters');
    }
  }

  public sign(input: { sub: string; email: string; role: UserRole; rules?: string[]; username?: string }): string {
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const payload = encode({
      ...input,
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      exp: now + this.ttlSeconds,
    });
    const signature = this.signature(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  public verify(token: string): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) throw AppError.unauthorized();
    const [header, payload, signature] = parts;
    const expected = Buffer.from(this.signature(`${header}.${payload}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw AppError.unauthorized();
    }

    try {
      const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString()) as {
        alg?: string;
        typ?: string;
      };
      if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') {
        throw AppError.unauthorized();
      }
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as TokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (
        parsed.iss !== this.issuer ||
        parsed.aud !== this.audience ||
        !parsed.sub ||
        !parsed.email ||
        !parsed.role ||
        !parsed.exp ||
        parsed.exp <= now
      ) {
        throw AppError.unauthorized();
      }
      return parsed;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized();
    }
  }

  private signature(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }
}
