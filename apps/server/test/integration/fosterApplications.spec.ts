import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { UserRole } from '@kapa/shared';
import { FosterApplicationController } from '../../src/controllers/FosterApplicationController';
import { AuthMiddleware } from '../../src/middlewares/AuthMiddleware';
import { animalManagementAccess } from '../../src/middlewares/AnimalManagementMiddleware';
import { ErrorHandler } from '../../src/middlewares/ErrorHandler';
import { User } from '../../src/models/User';
import { FosterApplicationRouter } from '../../src/routes/FosterApplicationRouter';
import { JwtService } from '../../src/security/JwtService';
import { FosterApplicationService } from '../../src/services/FosterApplicationService';

describe('foster applications', () => {
  let server: Server;
  let url: string;
  const jwt = new JwtService(randomBytes(32).toString('hex'), 'test', 'test', 900);
  const id = 'c000000000000000000000001';
  const details = {
    availableFrom: '2026-11-01', availableUntil: '2026-11-02',
    homeNotes: 'Quarto separado', homeAddress: 'Rua de Teste, 123',
    hasOtherAnimals: false, hasPerimeterBarrier: true, hasSecureGate: true,
  };
  const record = {
    id, user_id: 'applicant', availability: null,
    available_from: new Date(details.availableFrom), available_until: new Date(details.availableUntil),
    home_notes: details.homeNotes,
    home_address: details.homeAddress, has_other_animals: details.hasOtherAnimals,
    has_perimeter_barrier: details.hasPerimeterBarrier, has_secure_gate: details.hasSecureGate,
    status: 'pending', submitted_at: new Date(), updated_at: new Date(),
  };
  const database = {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  };
  const transaction = jest.fn();
  let now: Date;
  const users = {
    findByIdValue: async (userId: string) => {
      const roles: Record<string, UserRole | undefined> = { applicant: 'adopter', other: 'volunteer', staff: 'protector' };
      const role = roles[userId];
      if (!role) return null;
      const user = new User();
      user.setRole(role);
      return user;
    },
  };

  function request(path: string, sub?: string, method = 'GET', body?: unknown) {
    const token = sub ? jwt.sign({ sub, role: 'admin', email: 'test@example.org' }) : undefined;
    return fetch(`${url}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    const prisma = { fosterApplication: database, $transaction: transaction } as unknown as PrismaClient;
    const controller = new FosterApplicationController(new FosterApplicationService(prisma, () => now));
    app.use(new FosterApplicationRouter(controller, new AuthMiddleware(jwt), users, animalManagementAccess(users)).router);
    app.use(ErrorHandler.handle);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  beforeEach(() => {
    jest.resetAllMocks();
    now = new Date('2026-11-03T02:59:59.000Z');
    transaction.mockImplementation((work) => typeof work === 'function'
      ? work({ fosterApplication: database })
      : Promise.all(work));
  });

  it('validates the submission, binds it to the authenticated user and handles duplicates', async () => {
    expect((await request('/', undefined, 'POST', details)).status).toBe(401);
    expect((await request('/', 'deleted', 'POST', details)).status).toBe(401);
    expect((await request('/', 'applicant', 'POST', { ...details, userId: 'other' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, availableFrom: '2026-11-31' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, availableUntil: '2026-10-30' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, availableUntil: '2026-11-01' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, homeAddress: ' ' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, hasSecureGate: undefined })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, hasOtherAnimals: 'false' })).status).toBe(400);
    expect(database.create).not.toHaveBeenCalled();
    database.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(record);
    database.create.mockResolvedValueOnce(record);
    const response = await request('/', 'applicant', 'POST', { ...details, homeAddress: `  ${details.homeAddress}  ` });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).data).toMatchObject({ ...details, status: 'pending' });
    expect(database.create).toHaveBeenCalledWith({ data: {
      user_id: 'applicant', availability: null,
      available_from: record.available_from, available_until: record.available_until, home_notes: details.homeNotes,
      home_address: details.homeAddress, has_other_animals: details.hasOtherAnimals,
      has_perimeter_barrier: details.hasPerimeterBarrier, has_secure_gate: details.hasSecureGate,
    } });
    expect((await request('/', 'applicant', 'POST', details)).status).toBe(409);
  });

  it('allows another application only on the day after the latest end date in São Paulo', async () => {
    database.findFirst.mockResolvedValue(record);
    const next = { ...details, availableFrom: '2026-11-03', availableUntil: null };
    expect((await (await request('/mine', 'applicant')).json()).data.canSubmitNew).toBe(false);
    expect((await request('/', 'applicant', 'POST', next)).status).toBe(409);
    now = new Date('2026-11-03T03:00:00.000Z');
    expect((await (await request('/mine', 'applicant')).json()).data.canSubmitNew).toBe(true);
    database.create.mockResolvedValue({ ...record, available_until: null });
    expect((await request('/', 'applicant', 'POST', next)).status).toBe(201);
    expect(transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });

    database.findFirst.mockResolvedValue({ ...record, available_until: null });
    expect((await request('/', 'applicant', 'POST', next)).status).toBe(409);
  });

  it('rejects concurrent writes and only edits the owner’s latest unapproved application', async () => {
    const path = `/${id}`;
    database.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...record, status: 'approved' });
    expect((await request(path, 'other', 'PATCH', details)).status).toBe(404);
    expect((await request(path, 'applicant', 'PATCH', details)).status).toBe(409);
    expect(database.update).not.toHaveBeenCalled();

    database.findFirst.mockResolvedValue({ ...record, status: 'rejected' });
    database.update.mockResolvedValue(record);
    const response = await request(path, 'applicant', 'PATCH', details);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ canEdit: true, status: 'pending' });
    expect(database.update).toHaveBeenCalledWith({
      where: { id, user_id: 'applicant', status: { not: 'approved' } },
      data: expect.objectContaining({ status: 'pending' }),
    });
    transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('write conflict', { code: 'P2034', clientVersion: 'test' }));
    expect((await request(path, 'applicant', 'PATCH', details)).status).toBe(409);
  });

  it('reads only the current user application and restricts listing to the current staff role', async () => {
    database.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(record);
    expect((await (await request('/mine', 'other')).json()).data).toBeNull();
    expect(database.findFirst).toHaveBeenLastCalledWith({ where: { user_id: 'other' }, orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }] });
    expect((await (await request('/mine', 'applicant')).json()).data).toMatchObject(details);
    database.findFirst.mockResolvedValueOnce({
      ...record, availability: 'Finais de semana', available_from: null, available_until: null,
      home_address: null, has_other_animals: null, has_perimeter_barrier: null, has_secure_gate: null,
    });
    expect((await (await request('/mine', 'applicant')).json()).data).toMatchObject({
      availability: 'Finais de semana', canEdit: true, canSubmitNew: false,
      homeAddress: null, hasOtherAnimals: null, hasPerimeterBarrier: null, hasSecureGate: null,
    });
    expect((await request('/', 'applicant')).status).toBe(403);
    expect((await request('/?page=0', 'staff')).status).toBe(400);
    database.findMany.mockResolvedValue([{ ...record, user: { username: 'Applicant', email: 'test@example.org' } }]);
    database.count.mockResolvedValue(1);
    expect((await (await request('/', 'staff')).json()).data.items[0]).toMatchObject({
      ...details, applicant: { username: 'Applicant', email: 'test@example.org' },
    });
  });

  it('restricts decisions to staff and updates only pending records', async () => {
    const path = `/${id}/status`;
    expect((await request(path, 'other', 'PATCH', { status: 'approved' })).status).toBe(403);
    expect((await request(path, 'staff', 'PATCH', { status: 'pending' })).status).toBe(400);
    database.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    expect((await request(path, 'staff', 'PATCH', { status: 'approved' })).status).toBe(200);
    expect(database.updateMany).toHaveBeenLastCalledWith({ where: { id, status: 'pending' }, data: { status: 'approved' } });
    database.findUnique.mockResolvedValueOnce({ status: 'approved' });
    expect((await request(path, 'staff', 'PATCH', { status: 'rejected' })).status).toBe(409);
  });
});
