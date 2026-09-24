import jwt from 'jsonwebtoken';
import { UserJwt, UserRole } from '@kapa/shared';

const JWT_SECRET =
  process.env.JWT_SECRET || 'kapa-dev-secret-key-change-in-production';

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
      const payload = jwt.verify(token, JWT_SECRET);

      return [payload, true];
    } catch {
      return [null, false];
    }
  }
}
