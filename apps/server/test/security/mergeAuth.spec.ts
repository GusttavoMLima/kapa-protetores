import jwt from 'jsonwebtoken';
import { Jwt } from '../../src/utils/Jwt';
import { JwtService } from '../../src/security/JwtService';
import { PasswordHasher } from '../../src/security/PasswordHasher';
import { Encrypt } from '../../src/utils/Encypt';

describe('mergeAuth', () => {
  it('both authentication flows accept the same tokens and reject incorrect claims', () => {
    const original = { ...process.env };
    const secret = 'merge-test-secret-with-more-than-thirty-two-characters';
    process.env.JWT_SECRET = secret;
    process.env.JWT_ISSUER = 'merge-test-api';
    process.env.JWT_AUDIENCE = 'merge-test-app';
    try {
      const service = new JwtService(secret, 'merge-test-api', 'merge-test-app', 900);
      const user = {
        sub: '2e76e5cc-8e1f-4f4e-a94f-e7e527203680',
        email: 'merge@example.com',
        role: 'volunteer' as const,
        username: 'Merge test',
        rules: ['user:read:own'],
      };
      expect(service.verify(Jwt.generateToken(user)).sub).toBe(user.sub);
      expect(Jwt.verify(service.sign(user))[1]).toBe(true);
      for (const options of [
        { issuer: 'wrong', audience: 'merge-test-app', expiresIn: 900 },
        { issuer: 'merge-test-api', audience: 'wrong', expiresIn: 900 },
        { issuer: 'merge-test-api', audience: 'merge-test-app', expiresIn: -1 },
      ]) {
        const token = jwt.sign(user, secret, { ...options, algorithm: 'HS256' });
        expect(Jwt.verify(token)[1]).toBe(false);
        expect(() => service.verify(token)).toThrow();
      }
    } finally {
      for (const key of ['JWT_SECRET', 'JWT_ISSUER', 'JWT_AUDIENCE']) {
        if (original[key] === undefined) delete process.env[key];
        else process.env[key] = original[key];
      }
    }
  });

  it('passwords created in either branch remain usable after the merge', async () => {
    const hasher = new PasswordHasher();
    const password = 'merge-test-password';
    const legacyHash = Encrypt.saltHash(password).toString('hex');
    for (const hash of [legacyHash, await hasher.hash(password)]) {
      expect(await hasher.verify(password, hash)).toBe(true);
      expect(await hasher.verify('incorrect-password', hash)).toBe(false);
    }
    expect(await hasher.verify(password, 'malformed-hash')).toBe(false);
  });
});
