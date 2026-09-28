import test from 'node:test';
import assert from 'node:assert/strict';
import { PasswordHasher } from './PasswordHasher';

test('PasswordHasher verifies the correct password and rejects another one', async () => {
  const hasher = new PasswordHasher();
  const hash = await hasher.hash('a-strong-test-password');

  assert.equal(await hasher.verify('a-strong-test-password', hash), true);
  assert.equal(await hasher.verify('wrong-password', hash), false);
  assert.equal(hash.includes('a-strong-test-password'), false);
});
