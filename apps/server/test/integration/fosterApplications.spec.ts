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
    availability: 'Finais de semana', homeNotes: 'Quarto separado', homeAddress: 'Rua de Teste, 123',
    hasOtherAnimals: false, hasPerimeterBarrier: true, hasSecureGate: true,
  };
  const record = {
    id, user_id: 'applicant', availability: details.availability, home_notes: details.homeNotes,
    home_address: details.homeAddress, has_other_animals: details.hasOtherAnimals,
    has_perimeter_barrier: details.hasPerimeterBarrier, has_secure_gate: details.hasSecureGate,
    status: 'pending', submitted_at: new Date(), updated_at: new Date(),
  };
  const database = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  };
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
    const prisma = { fosterApplication: database, $transaction: Promise.all.bind(Promise) } as unknown as PrismaClient;
    const controller = new FosterApplicationController(new FosterApplicationService(prisma));
    app.use(new FosterApplicationRouter(controller, new AuthMiddleware(jwt), users, animalManagementAccess(users)).router);
    app.use(ErrorHandler.handle);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  beforeEach(() => jest.resetAllMocks());

  it('validates the submission, binds it to the authenticated user and handles duplicates', async () => {
    expect((await request('/', undefined, 'POST', details)).status).toBe(401);
    expect((await request('/', 'deleted', 'POST', details)).status).toBe(401);
    expect((await request('/', 'applicant', 'POST', { ...details, userId: 'other' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, availability: ' ' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, homeAddress: ' ' })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, hasSecureGate: undefined })).status).toBe(400);
    expect((await request('/', 'applicant', 'POST', { ...details, hasOtherAnimals: 'false' })).status).toBe(400);
    expect(database.create).not.toHaveBeenCalled();
    database.create.mockResolvedValueOnce(record).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: 'test' }),
    );
    const response = await request('/', 'applicant', 'POST', { ...details, homeAddress: `  ${details.homeAddress}  ` });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).data).toMatchObject({ ...details, status: 'pending' });
    expect(database.create).toHaveBeenCalledWith({ data: {
      user_id: 'applicant', availability: details.availability, home_notes: details.homeNotes,
      home_address: details.homeAddress, has_other_animals: details.hasOtherAnimals,
      has_perimeter_barrier: details.hasPerimeterBarrier, has_secure_gate: details.hasSecureGate,
    } });
    expect((await request('/', 'applicant', 'POST', details)).status).toBe(409);
  });

  it('reads only the current user application and restricts listing to the current staff role', async () => {
    database.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(record);
    expect((await (await request('/mine', 'other')).json()).data).toBeNull();
    expect(database.findUnique).toHaveBeenLastCalledWith({ where: { user_id: 'other' } });
    expect((await (await request('/mine', 'applicant')).json()).data).toMatchObject(details);
    database.findUnique.mockResolvedValueOnce({
      ...record, home_address: null, has_other_animals: null, has_perimeter_barrier: null, has_secure_gate: null,
    });
    expect((await (await request('/mine', 'applicant')).json()).data).toMatchObject({
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
