import type { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../src/repositories/UserRepository';
import { UUID } from '../../src/domains/UUID';
import { User } from '../../src/models/User';

const USER_ID = '123e4567-e89b-42d3-a456-426614174000';

function buildRecord(deactivatedAt: Date | null) {
  return {
    id: USER_ID,
    username: 'Pessoa',
    email: 'pessoa@kapa.test',
    password: null,
    avatar: null,
    role: 'adopter',
    rules: ['user:read:own'],
    latitude: null,
    longitude: null,
    created_at: new Date('2026-11-01T10:00:00.000Z'),
    deactivated_at: deactivatedAt,
  };
}

function buildDomainUser(): User {
  const user = new User();
  user.setId(USER_ID);
  user.setUsername('Pessoa');
  user.setEmail('pessoa@kapa.test');
  user.setCreatedAt('2026-11-01T10:00:00.000Z');
  return user;
}

describe('UserRepository - desativação de contas', () => {
  it('countByRole conta os usuários do papel informado', async () => {
    const count = jest.fn().mockResolvedValue(3);
    const repository = new UserRepository({ user: { count } } as unknown as PrismaClient);

    await expect(repository.countByRole('admin')).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith({ where: { role: 'admin' } });
  });

  it('carrega deactivated_at para o domínio', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce(buildRecord(new Date('2026-11-05T12:00:00.000Z')))
      .mockResolvedValueOnce(buildRecord(null));
    const repository = new UserRepository({ user: { findUnique } } as unknown as PrismaClient);

    const deactivated = await repository.findById(UUID.create(USER_ID));
    const active = await repository.findById(UUID.create(USER_ID));

    expect(deactivated?.isActive()).toBe(false);
    expect(deactivated?.getDeactivatedAt()).toBe('2026-11-05T12:00:00.000Z');
    expect(active?.isActive()).toBe(true);
  });

  it('update grava a data quando a conta é desativada', async () => {
    const update = jest.fn().mockResolvedValue(buildRecord(new Date('2026-11-05T12:00:00.000Z')));
    const repository = new UserRepository({ user: { update } } as unknown as PrismaClient);
    const user = buildDomainUser();
    user.setDeactivatedAt('2026-11-05T12:00:00.000Z');

    await repository.update(user);

    const data = update.mock.calls[0][0].data as { deactivated_at: Date };
    expect(data.deactivated_at).toEqual(new Date('2026-11-05T12:00:00.000Z'));
  });

  it('update grava null ao reativar e não mexe na coluna quando o campo não foi carregado', async () => {
    const update = jest.fn().mockResolvedValue(buildRecord(null));
    const repository = new UserRepository({ user: { update } } as unknown as PrismaClient);

    const reactivated = buildDomainUser();
    reactivated.setDeactivatedAt(null);
    await repository.update(reactivated);
    expect(update.mock.calls[0][0].data.deactivated_at).toBeNull();

    await repository.update(buildDomainUser());
    expect(update.mock.calls[1][0].data.deactivated_at).toBeUndefined();
  });
});
