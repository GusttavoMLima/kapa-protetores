import '../config/env';
import jwt from 'jsonwebtoken';
import { UserJwt, UserRole } from '@kapa/shared';
import { z } from 'zod';

function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return secret;
}

const userJwtSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['adopter', 'protector', 'admin', 'volunteer']),
  rules: z.array(z.string()),
  username: z.string().min(1),
});

export interface UserTokenPayload {
  getId: () => { toString: () => string };
  getEmail: () => { toString: () => string };
  getRole: () => UserRole;
  getRules: () => Iterable<string>;
  getUsername: () => string;
}

export class Jwt {
  public static generateToken(data: object) {
    const token = jwt.sign(data, getSecret(), {
      expiresIn: Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 604800,
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER ?? 'kapa-api',
      audience: process.env.JWT_AUDIENCE ?? 'kapa-app',
    });

    return token;
  }

  public static generateUserToken(user: UserTokenPayload): string {
    const jwtData: UserJwt = {
      sub: user.getId().toString(),
      email: user.getEmail().toString(),
      role: user.getRole(),
      rules: Array.from(user.getRules()),
      username: user.getUsername(),
    };

    return this.generateToken(jwtData);
  }

  public static verify(token: string) {
    if (!token) {
      return [null, false];
    }

    try {
      const payload = jwt.verify(token, getSecret(), {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER ?? 'kapa-api',
        audience: process.env.JWT_AUDIENCE ?? 'kapa-app',
      });

      if (typeof payload === 'string') return [null, false];
      const parsedPayload = userJwtSchema.safeParse(payload);
      if (!parsedPayload.success) return [null, false];

      return [parsedPayload.data, true];
    } catch {
      return [null, false];
    }
  }
}
