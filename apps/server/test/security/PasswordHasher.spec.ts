import { PasswordHasher } from '../../src/security/PasswordHasher';

describe('PasswordHasher', () => {
  it('PasswordHasher verifies the correct password and rejects another one', async () => {
    const hasher = new PasswordHasher();
    const hash = await hasher.hash('a-strong-test-password');

    expect(await hasher.verify('a-strong-test-password', hash)).toBe(true);
    expect(await hasher.verify('wrong-password', hash)).toBe(false);
    expect(hash.includes('a-strong-test-password')).toBe(false);
  });
});
