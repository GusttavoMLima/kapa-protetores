import { Jwt } from '../../src/utils/Jwt';
import type { UserJwt } from '@kapa/shared';

describe('Jwt Utility', () => {
  it('should generate and verify valid token', () => {
    const payload: UserJwt = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      username: 'Test User',
      role: 'adopter',
      rules: ['adopter:read'],
    };

    const token = Jwt.generateToken(payload);
    expect(typeof token === 'string' && token.length > 0).toBe(true);

    const [decoded, isValid] = Jwt.verify(token);
    expect(isValid).toBe(true);
    expect(decoded && typeof decoded === 'object').toBe(true);
    expect((decoded as UserJwt).sub).toBe(payload.sub);
    expect((decoded as UserJwt).email).toBe(payload.email);
    expect((decoded as UserJwt).role).toBe(payload.role);
  });

  it('should reject invalid or tampered token', () => {
    const [, isValid] = Jwt.verify('invalid.token.here');
    expect(isValid).toBe(false);
  });

  it('should reject empty token', () => {
    const [, isValid] = Jwt.verify('');
    expect(isValid).toBe(false);
  });
});
