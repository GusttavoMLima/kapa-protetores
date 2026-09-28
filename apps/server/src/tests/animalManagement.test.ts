import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { AnimalStatus, CreateAnimalInput, UserRole } from '@kapa/shared';
import { AnimalsRouter } from '../routes/AnimalsRouter';
import { AnimalsController } from '../controllers/AnimalsController';
import { AnimalService } from '../services/AnimalService';
import { InMemoryAnimalRepository } from '../repositories/InMemoryAnimalRepository';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { animalManagementAccess } from '../middlewares/AnimalManagementMiddleware';
import { ErrorHandler } from '../middlewares/ErrorHandler';
import { JwtService } from '../security/JwtService';
import { User } from '../models/User';
import type { Animal } from '../models/Animal';
import { registerSchema } from '../validation/schemas';

test('animal management authorization, filters, edits and public boundary', async (t) => {
  const repository = new InMemoryAnimalRepository();
  const service = new AnimalService(repository);
  const input: CreateAnimalInput = {
    name: 'Amora', breed: 'SRD', species: 'cat', gender: 'female', weightKg: 4.5, age: 2, ageStage: 3,
    size: 2, energyLevel: 3, kidFriendly: 4, noiseLevel: 1, apartmentFriendly: true, otherPetFriendly: true,
    healthCondition: 'healthy', castrated: 'yes', vaccinated: true, dewormed: 'yes',
    rescuedAt: '2026-01-01T00:00:00.000Z', place: 'Endereço privado', mood: 'Tranquila', observations: 'Anotação interna', status: 'rescued',
  };
  const animals: Animal[] = [];
  for (const status of ['rescued', 'treating', 'available', 'adopted'] as const) animals.push(await service.create({ ...input, name: `Amora ${status}`, status }));
  const id = animals[0].getId().getValue();
  animals[0].setPhotos([{ id: 'photo', photoUrl: 'https://example.org/amora.jpg', uploadedAt: input.rescuedAt }]);
  const secret = randomBytes(32).toString('hex');
  const jwt = new JwtService(secret, 'test', 'test', 900);
  const roles = new Map<string, UserRole>([['admin', 'admin'], ['protector', 'protector'], ['volunteer', 'volunteer'], ['adopter', 'adopter'], ['revoked', 'adopter']]);
  const app = express();
  app.use(express.json());
  app.use('/animals', new AnimalsRouter(new AnimalsController(service), { upload: async (_req, res) => { res.json({ success: true }); } }, new AuthMiddleware(jwt), animalManagementAccess({
    findByIdValue: async (userId: string) => { const role = roles.get(userId); if (!role) return null; const user = new User(); user.setRole(role); return user; },
  })).router);
  app.use(ErrorHandler.handle);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}/animals`;
  t.after(() => new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())));
  const token = (sub: string, role: UserRole = 'admin') => jwt.sign({ sub, role, email: 'test@example.com' });
  const request = (path: string, accessToken?: string, method = 'GET', body?: unknown) => fetch(`${base}${path}`, {
    method, headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await t.test('anonymous and invalid/expired tokens cannot read management', async () => {
    assert.equal((await request('/management')).status, 401);
    assert.equal((await request('/management', 'invalid')).status, 401);
    const expired = new JwtService(secret, 'test', 'test', -1).sign({ sub: 'admin', role: 'admin', email: 'test@example.com' });
    assert.equal((await request('/management', expired)).status, 401);
  });
  await t.test('all three staff roles can list all statuses and edit', async () => {
    for (const role of ['admin', 'protector', 'volunteer'] as const) {
      const response = await request('/management', token(role, role));
      assert.equal(response.status, 200);
      const { data } = await response.json();
      assert.equal(data.total, 4);
      assert.deepEqual(data.counts, { rescued: 1, treating: 1, available: 1, adopted: 1 });
      assert.equal((await request(`/management/${id}`, token(role, role), 'PATCH', { name: 'Amora' })).status, 200);
    }
  });
  await t.test('adopters, revoked roles and deleted accounts cannot manage or upload', async () => {
    for (const sub of ['adopter', 'revoked', 'deleted']) {
      const expected = sub === 'deleted' ? 401 : 403;
      for (const [path, method, body] of [['/management', 'GET', undefined], [`/management/${id}`, 'GET', undefined], [`/management/${id}`, 'PATCH', { name: 'Changed' }], ['', 'POST', input], [`/${id}/photos`, 'POST', {}]] as const) {
        assert.equal((await request(path, token(sub), method, body)).status, expected);
      }
    }
  });
  await t.test('pagination, search and filters are combined, malformed queries rejected', async () => {
    const response = await request('/management?search=AMORA&species=cat&status=treating&pageSize=1&sort=name', token('admin'));
    const { data } = await response.json();
    assert.equal(data.total, 1); assert.equal(data.items.length, 1); assert.equal(data.items[0].status, 'treating');
    assert.equal((await request('/management?pageSize=1000', token('admin'))).status, 400);
    assert.equal((await request('/management?page=-1', token('admin'))).status, 400);
    assert.equal((await request('/management?status=unknown', token('admin'))).status, 400);
    assert.equal((await request('/management?search[x]=bad', token('admin'))).status, 400);
  });
  await t.test('public API returns only available animals without internal fields', async () => {
    const { data } = await (await request('')).json();
    assert.equal(data.length, 1); assert.equal(data[0].status, 'available');
    for (const field of ['observations', 'place', 'healthCondition', 'rescuedAt']) assert.equal(field in data[0], false);
    for (const animal of animals.filter((animal) => animal.getStatus() !== 'available')) assert.equal((await request(`/${animal.getId().getValue()}`)).status, 404);
  });
  await t.test('PATCH preserves hidden fields and photos, validates body and missing IDs', async () => {
    const { data } = await (await request(`/management/${id}`, token('admin'), 'PATCH', { name: 'Amora atualizada', status: 'available' satisfies AnimalStatus })).json();
    assert.equal(data.name, 'Amora atualizada'); assert.equal(data.ageStage, 3); assert.equal(data.kidFriendly, 4);
    assert.equal(data.observations, input.observations); assert.equal(data.photos.length, 1);
    for (const body of [{}, { name: '' }, { role: 'admin' }, { weightKg: -1 }, { id: 'changed' }, { status: 'invalid' }]) assert.equal((await request(`/management/${id}`, token('admin'), 'PATCH', body)).status, 400);
    assert.equal((await request('/management/not-an-id', token('admin'))).status, 400);
    assert.equal((await request('/management/c000000000000000000000000', token('admin'), 'PATCH', { name: 'Absent' })).status, 404);
  });
  await t.test('staff creation remains allowed', async () => {
    for (const role of ['admin', 'protector', 'volunteer'] as const) assert.equal((await request('', token(role, role), 'POST', input)).status, 201);
  });
  await t.test('public registration never grants a management role', () => {
    const account = { username: 'Teste', email: 'test@example.com', password: 'test-only-password' };
    assert.equal(registerSchema.parse(account).role, 'adopter');
    for (const role of ['admin', 'protector', 'volunteer']) assert.equal(registerSchema.safeParse({ ...account, role }).success, false);
  });
});
