import test from 'node:test';
import assert from 'node:assert/strict';
import { JwtService } from './JwtService';

const service = new JwtService(
  'test-secret-with-at-least-thirty-two-characters',
  'test-issuer',
  'test-audience',
  60,
);

test('JwtService signs and verifies required claims', () => {
  const token = service.sign({
    sub: '2e76e5cc-8e1f-4f4e-a94f-e7e527203680',
    email: 'voluntario@example.com',
    role: 'volunteer',
  });
  const payload = service.verify(token);
  assert.equal(payload.email, 'voluntario@example.com');
  assert.equal(payload.role, 'volunteer');
});

test('JwtService rejects a modified token', () => {
  const token = service.sign({
    sub: '2e76e5cc-8e1f-4f4e-a94f-e7e527203680',
    email: 'voluntario@example.com',
    role: 'volunteer',
  });
  assert.throws(() => service.verify(`${token.slice(0, -1)}x`));
});
