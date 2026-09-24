import jwt from 'jsonwebtoken';
import { UserJwt, UserRole } from '@kapa/shared';
import { z } from 'zod';

const JWT_SECRET =
  process.env.JWT_SECRET || 'kapa-dev-secret-key-change-in-production';

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
  public static generateToken(data: string | object) {
    const token = jwt.sign(data, JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: '@kapa/api',
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
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: '@kapa/api',
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
