import { randomBytes } from 'node:crypto';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { AnimalStatus, CreateAnimalInput, UserRole } from '@kapa/shared';
import { AnimalsRouter } from '../../src/routes/AnimalsRouter';
import { AnimalsController } from '../../src/controllers/AnimalsController';
import { AnimalService } from '../../src/services/AnimalService';
import { InMemoryAnimalRepository } from '../../src/repositories/InMemoryAnimalRepository';
import { AuthMiddleware } from '../../src/middlewares/AuthMiddleware';
import { animalManagementAccess } from '../../src/middlewares/AnimalManagementMiddleware';
import { ErrorHandler } from '../../src/middlewares/ErrorHandler';
import { JwtService } from '../../src/security/JwtService';
import { User } from '../../src/models/User';
import type { Animal } from '../../src/models/Animal';

describe('animal management authorization, filters, edits and public boundary', () => {
  let server: Server;
  let base: string;
  let secret: string;
  let jwt: JwtService;
  let id: string;
  let input: CreateAnimalInput;
  let animals: Animal[];

  const token = (sub: string, role: UserRole = 'admin') => jwt.sign({ sub, role, email: 'test@example.com' });
  const request = (path: string, accessToken?: string, method = 'GET', body?: unknown) => fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  beforeAll(async () => {
    const repository = new InMemoryAnimalRepository();
    const service = new AnimalService(repository);
    input = {
      name: 'Amora', breed: 'SRD', species: 'cat', gender: 'female', weightKg: 4.5, age: 2, ageStage: 3,
      size: 2, energyLevel: 3, kidFriendly: 4, noiseLevel: 1, apartmentFriendly: true, otherPetFriendly: true,
      healthCondition: 'healthy', castrated: 'yes', vaccinated: true, dewormed: 'yes',
      rescuedAt: '2026-01-01T00:00:00.000Z', place: 'Endereço privado', mood: 'Tranquila', observations: 'Anotação interna', status: 'rescued',
    };
    animals = [];
    for (const status of ['rescued', 'treating', 'available', 'adopted'] as const) {
      animals.push(await service.create({ ...input, name: `Amora ${status}`, status }));
    }
    id = animals[0].getId().getValue();
    animals[0].setPhotos([{ id: 'photo', photoUrl: 'https://example.org/amora.jpg', uploadedAt: input.rescuedAt }]);
    secret = randomBytes(32).toString('hex');
    jwt = new JwtService(secret, 'test', 'test', 900);
    const roles = new Map<string, UserRole>([['admin', 'admin'], ['protector', 'protector'], ['volunteer', 'volunteer'], ['adopter', 'adopter'], ['revoked', 'adopter']]);
    const app = express();
    app.use(express.json());
    app.use('/animals', new AnimalsRouter(new AnimalsController(service), { upload: async (_req, res) => { res.json({ success: true }); } }, new AuthMiddleware(jwt), animalManagementAccess({
      findByIdValue: async (userId: string) => { const role = roles.get(userId); if (!role) return null; const user = new User(); user.setRole(role); return user; },
    })).router);
    app.use(ErrorHandler.handle);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as AddressInfo;
    base = `http://127.0.0.1:${address.port}/animals`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  });

  it('anonymous and invalid/expired tokens cannot read management', async () => {
    expect((await request('/management')).status).toBe(401);
    expect((await request('/management', 'invalid')).status).toBe(401);
    const expired = new JwtService(secret, 'test', 'test', -1).sign({ sub: 'admin', role: 'admin', email: 'test@example.com' });
    expect((await request('/management', expired)).status).toBe(401);
  });

  it('all three staff roles can list all statuses and edit', async () => {
    for (const role of ['admin', 'protector', 'volunteer'] as const) {
      const response = await request('/management', token(role, role));
      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.total).toBe(4);
      expect(data.counts).toEqual({ rescued: 1, treating: 1, available: 1, adopted: 1 });
      expect((await request(`/management/${id}`, token(role, role), 'PATCH', { name: 'Amora' })).status).toBe(200);
    }
  });

  it('adopters, revoked roles and deleted accounts cannot manage or upload', async () => {
    for (const sub of ['adopter', 'revoked', 'deleted']) {
      const expected = sub === 'deleted' ? 401 : 403;
      for (const [path, method, body] of [['/management', 'GET', undefined], [`/management/${id}`, 'GET', undefined], [`/management/${id}`, 'PATCH', { name: 'Changed' }], ['', 'POST', input], [`/${id}/photos`, 'POST', {}]] as const) {
        expect((await request(path, token(sub), method, body)).status).toBe(expected);
      }
    }
  });

  it('pagination, search and filters are combined, malformed queries rejected', async () => {
    const response = await request('/management?search=AMORA&species=cat&status=treating&pageSize=1&sort=name', token('admin'));
    const { data } = await response.json();
    expect(data.total).toBe(1);
    expect(data.items.length).toBe(1);
    expect(data.items[0].status).toBe('treating');
    expect((await request('/management?pageSize=1000', token('admin'))).status).toBe(400);
    expect((await request('/management?page=-1', token('admin'))).status).toBe(400);
    expect((await request('/management?status=unknown', token('admin'))).status).toBe(400);
    expect((await request('/management?search[x]=bad', token('admin'))).status).toBe(400);
  });

  it('public API returns only available animals without internal fields', async () => {
    const { data } = await (await request('')).json();
    expect(data.length).toBe(1);
    expect(data[0].status).toBe('available');
    for (const field of ['observations', 'place', 'healthCondition', 'rescuedAt']) {
      expect(field in data[0]).toBe(false);
    }
    for (const animal of animals.filter((animal) => animal.getStatus() !== 'available')) {
      expect((await request(`/${animal.getId().getValue()}`)).status).toBe(404);
    }
  });

  it('PATCH preserves hidden fields and photos, validates body and missing IDs', async () => {
    const { data } = await (await request(`/management/${id}`, token('admin'), 'PATCH', { name: 'Amora atualizada', status: 'available' satisfies AnimalStatus })).json();
    expect(data.name).toBe('Amora atualizada');
    expect(data.ageStage).toBe(3);
    expect(data.kidFriendly).toBe(4);
    expect(data.observations).toBe(input.observations);
    expect(data.photos.length).toBe(1);
    for (const body of [{}, { name: '' }, { role: 'admin' }, { weightKg: -1 }, { id: 'changed' }, { status: 'invalid' }]) {
      expect((await request(`/management/${id}`, token('admin'), 'PATCH', body)).status).toBe(400);
    }
    expect((await request('/management/not-an-id', token('admin'))).status).toBe(400);
    expect((await request('/management/c000000000000000000000000', token('admin'), 'PATCH', { name: 'Absent' })).status).toBe(404);
  });

  it('staff creation remains allowed', async () => {
    for (const role of ['admin', 'protector', 'volunteer'] as const) {
      expect((await request('', token(role, role), 'POST', input)).status).toBe(201);
    }
  });
});
