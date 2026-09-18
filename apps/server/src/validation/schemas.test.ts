import assert from 'node:assert/strict';
import test from 'node:test';
import { adminCreateUserSchema } from './schemas';

const baseUser = {
  username: 'Pessoa Teste',
  email: 'pessoa@example.com',
  password: 'senha-segura-123',
};

test('admin user creation accepts every role defined by the database', () => {
  for (const role of ['adopter', 'protector', 'admin', 'volunteer']) {
    assert.equal(adminCreateUserSchema.safeParse({ ...baseUser, role }).success, true);
  }
});

test('admin user creation rejects an unknown role', () => {
  assert.equal(adminCreateUserSchema.safeParse({ ...baseUser, role: 'owner' }).success, false);
});
