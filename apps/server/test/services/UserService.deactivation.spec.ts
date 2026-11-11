const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
    getTokenInfo: jest.fn(),
  })),
}));

import { ForbiddenError } from '../../src/errors';
import { User } from '../../src/models/User';
import type { UserRepository } from '../../src/repositories/UserRepository';
import type { CacheProvider } from '../../src/services/RedisService';
import { UserService } from '../../src/services/UserService';

const USER_ID = '323e4567-e89b-42d3-a456-426614174000';
const ACTOR_ID = '123e4567-e89b-42d3-a456-426614174000';

function buildUser(): User {
  const user = new User();
  user.setId(USER_ID);
  user.setUsername('Pessoa');
  user.setEmail('pessoa@kapa.test');
  user.setRole('adopter');
  user.setCreatedAt('2026-11-01T10:00:00.000Z');
  return user;
}

describe('UserService - desativação', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'client-id-de-teste';
    mockVerifyIdToken.mockReset();
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'pessoa@kapa.test',
        email_verified: true,
        name: 'Pessoa',
      }),
    });
  });

  afterAll(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
  });

  it('login com Google é bloqueado para conta desativada', async () => {
    const user = buildUser();
    user.setDeactivatedAt(new Date());
    const repository = { findByEmail: jest.fn().mockResolvedValue(user) };
    const service = new UserService(repository as unknown as UserRepository);

    await expect(service.authenticateWithGoogle('a.b.c')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('login com Google continua funcionando para conta ativa', async () => {
    const user = buildUser();
    const repository = { findByEmail: jest.fn().mockResolvedValue(user) };
    const service = new UserService(repository as unknown as UserRepository);

    await expect(service.authenticateWithGoogle('a.b.c')).resolves.toBe(user);
  });

  it('setActive limpa o cache do perfil quando há cache configurado', async () => {
    const user = buildUser();
    const repository = {
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn(async (updated: User) => updated),
    };
    const cache = {
      deleteCache: jest.fn().mockResolvedValue(undefined),
    } as unknown as CacheProvider;
    const service = new UserService(repository as unknown as UserRepository, cache);

    await service.setActive(USER_ID, false, ACTOR_ID);

    expect(cache.deleteCache).toHaveBeenCalledTimes(2);
  });

  it('updateRole não grava nada quando o papel já é o pedido', async () => {
    const user = buildUser();
    const repository = {
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
    };
    const service = new UserService(repository as unknown as UserRepository);

    await expect(service.updateRole(USER_ID, 'adopter', ACTOR_ID)).resolves.toBe(user);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
