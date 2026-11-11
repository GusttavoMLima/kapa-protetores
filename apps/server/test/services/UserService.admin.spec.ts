import type { UserRole } from '@kapa/shared';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/errors';
import { User } from '../../src/models/User';
import type { UserRepository } from '../../src/repositories/UserRepository';
import { UserService } from '../../src/services/UserService';

const ADMIN_ID = '123e4567-e89b-42d3-a456-426614174000';
const OTHER_ADMIN_ID = '223e4567-e89b-42d3-a456-426614174000';
const ADOPTER_ID = '323e4567-e89b-42d3-a456-426614174000';

function buildUser(id: string, role: UserRole, rules: string[]): User {
  const user = new User();
  user.setId(id);
  user.setUsername('Teste');
  user.setEmail(`${id}@kapa.test`);
  user.setRole(role);
  user.setRules(rules);
  return user;
}

function buildService(users: User[], adminCount: number) {
  const repository = {
    findById: jest.fn(async (id: { toString(): string }) =>
      users.find((user) => user.getId().toString() === id.toString()) ?? null,
    ),
    countByRole: jest.fn().mockResolvedValue(adminCount),
    update: jest.fn(async (user: User) => user),
    deleteById: jest.fn(async (id: { toString(): string }) =>
      users.find((user) => user.getId().toString() === id.toString()),
    ),
  };

  return {
    repository,
    service: new UserService(repository as unknown as UserRepository),
  };
}

describe('UserService - ações de administração', () => {
  describe('updateRole', () => {
    it('concede admin:* ao promover um usuário a administrador', async () => {
      const adopter = buildUser(ADOPTER_ID, 'adopter', ['user:read:own']);
      const { service } = buildService([adopter], 1);

      const updated = await service.updateRole(ADOPTER_ID, 'admin', ADMIN_ID);

      expect(updated.getRole()).toBe('admin');
      expect(updated.getRules().has('admin:*')).toBe(true);
    });

    it('devolve as regras padrão ao rebaixar um administrador', async () => {
      const admin = buildUser(OTHER_ADMIN_ID, 'admin', ['admin:*']);
      const { service } = buildService([admin], 2);

      const updated = await service.updateRole(OTHER_ADMIN_ID, 'adopter', ADMIN_ID);

      expect(updated.getRole()).toBe('adopter');
      expect(updated.getRules().has('admin:*')).toBe(false);
      expect(updated.getRules().has('user:read:own')).toBe(true);
    });

    it('impede o administrador de alterar o próprio papel', async () => {
      const admin = buildUser(ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 2);

      await expect(service.updateRole(ADMIN_ID, 'adopter', ADMIN_ID)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('impede rebaixar o último administrador', async () => {
      const admin = buildUser(OTHER_ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 1);

      await expect(
        service.updateRole(OTHER_ADMIN_ID, 'volunteer', ADMIN_ID),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejeita usuário inexistente e ID inválido', async () => {
      const { service } = buildService([], 1);

      await expect(service.updateRole(ADOPTER_ID, 'volunteer', ADMIN_ID)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.updateRole('invalido', 'volunteer', ADMIN_ID)).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });

  describe('setActive', () => {
    it('desativa e reativa um usuário comum', async () => {
      const adopter = buildUser(ADOPTER_ID, 'adopter', ['user:read:own']);
      const { service, repository } = buildService([adopter], 1);

      const deactivated = await service.setActive(ADOPTER_ID, false, ADMIN_ID);
      expect(deactivated.isActive()).toBe(false);
      expect(deactivated.getDeactivatedAt()).toEqual(expect.any(String));

      const reactivated = await service.setActive(ADOPTER_ID, true, ADMIN_ID);
      expect(reactivated.isActive()).toBe(true);
      expect(repository.update).toHaveBeenCalledTimes(2);
    });

    it('não grava nada quando o status já é o pedido', async () => {
      const adopter = buildUser(ADOPTER_ID, 'adopter', ['user:read:own']);
      const { service, repository } = buildService([adopter], 1);

      await service.setActive(ADOPTER_ID, true, ADMIN_ID);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('impede o administrador de desativar a si mesmo', async () => {
      const admin = buildUser(ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 2);

      await expect(service.setActive(ADMIN_ID, false, ADMIN_ID)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('impede desativar o último administrador', async () => {
      const admin = buildUser(OTHER_ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 1);

      await expect(service.setActive(OTHER_ADMIN_ID, false, ADMIN_ID)).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('permite desativar um administrador quando há outro', async () => {
      const admin = buildUser(OTHER_ADMIN_ID, 'admin', ['admin:*']);
      const { service } = buildService([admin], 2);

      const result = await service.setActive(OTHER_ADMIN_ID, false, ADMIN_ID);

      expect(result.isActive()).toBe(false);
    });
  });

  describe('deleteById', () => {
    it('exclui um usuário comum', async () => {
      const adopter = buildUser(ADOPTER_ID, 'adopter', ['user:read:own']);
      const { service, repository } = buildService([adopter], 1);

      await service.deleteById(ADOPTER_ID, ADMIN_ID);

      expect(repository.deleteById).toHaveBeenCalledTimes(1);
    });

    it('impede o administrador de excluir a si mesmo', async () => {
      const admin = buildUser(ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 2);

      await expect(service.deleteById(ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });

    it('impede excluir o último administrador, inclusive pela própria conta', async () => {
      const admin = buildUser(OTHER_ADMIN_ID, 'admin', ['admin:*']);
      const { service, repository } = buildService([admin], 1);

      await expect(service.deleteById(OTHER_ADMIN_ID)).rejects.toBeInstanceOf(ConflictError);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
