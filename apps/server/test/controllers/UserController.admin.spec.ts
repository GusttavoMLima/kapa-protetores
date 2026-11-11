import type { Request, Response } from 'express';
import { UserController } from '../../src/controllers/UserController';
import type { UserService } from '../../src/services/UserService';
import { User } from '../../src/models/User';

const ACTOR_ID = '123e4567-e89b-42d3-a456-426614174000';
const TARGET_ID = '223e4567-e89b-42d3-a456-426614174000';

function buildUser(): User {
  const user = new User();
  user.setId(TARGET_ID);
  user.setUsername('Alvo');
  user.setEmail('alvo@kapa.test');
  user.setCreatedAt('2026-11-01T10:00:00.000Z');
  return user;
}

function buildResponse() {
  const captured: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  } as unknown as Response;

  return { res, captured };
}

function buildRequest(body: unknown, id = TARGET_ID): Request {
  return { params: { id }, body, user: { sub: ACTOR_ID } } as unknown as Request;
}

describe('UserController - ações de administração', () => {
  describe('updateStatus', () => {
    it('desativa a conta e informa quem fez a ação ao serviço', async () => {
      const user = buildUser();
      user.setDeactivatedAt(new Date('2026-11-10T10:00:00.000Z'));
      const setActive = jest.fn().mockResolvedValue(user);
      const controller = new UserController({ setActive } as unknown as UserService);
      const { res, captured } = buildResponse();
      const next = jest.fn();

      await controller.updateStatus(buildRequest({ active: false }), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(setActive).toHaveBeenCalledWith(TARGET_ID, false, ACTOR_ID);
      expect(captured.status).toBe(200);
      const body = captured.body as { message: string; data: { deactivatedAt: string } };
      expect(body.message).toBe('Usuário desativado com sucesso');
      expect(body.data.deactivatedAt).toBe('2026-11-10T10:00:00.000Z');
    });

    it('reativa a conta', async () => {
      const setActive = jest.fn().mockResolvedValue(buildUser());
      const controller = new UserController({ setActive } as unknown as UserService);
      const { res, captured } = buildResponse();

      await controller.updateStatus(buildRequest({ active: true }), res, jest.fn());

      expect(setActive).toHaveBeenCalledWith(TARGET_ID, true, ACTOR_ID);
      expect((captured.body as { message: string }).message).toBe(
        'Usuário reativado com sucesso',
      );
    });

    it.each([{}, { active: 'sim' }, { active: null }])(
      'rejeita corpo inválido %j com 400',
      async (body) => {
        const setActive = jest.fn();
        const controller = new UserController({ setActive } as unknown as UserService);
        const next = jest.fn();

        await controller.updateStatus(buildRequest(body), {} as Response, next);

        expect((next.mock.calls[0][0] as { statusCode: number }).statusCode).toBe(400);
        expect(setActive).not.toHaveBeenCalled();
      },
    );

    it('rejeita parâmetros de rota inválidos com 400', async () => {
      const setActive = jest.fn();
      const controller = new UserController({ setActive } as unknown as UserService);
      const next = jest.fn();
      const req = { params: {}, body: { active: true }, user: { sub: ACTOR_ID } } as unknown as Request;

      await controller.updateStatus(req, {} as Response, next);

      expect((next.mock.calls[0][0] as { statusCode: number }).statusCode).toBe(400);
    });

    it('encaminha o erro do serviço', async () => {
      const failure = new Error('falha');
      const controller = new UserController({
        setActive: jest.fn().mockRejectedValue(failure),
      } as unknown as UserService);
      const next = jest.fn();

      await controller.updateStatus(buildRequest({ active: false }), {} as Response, next);

      expect(next).toHaveBeenCalledWith(failure);
    });
  });

  describe('updateRole e deleteById', () => {
    it('updateRole repassa o administrador autenticado ao serviço', async () => {
      const updateRole = jest.fn().mockResolvedValue(buildUser());
      const controller = new UserController({ updateRole } as unknown as UserService);
      const { res } = buildResponse();

      await controller.updateRole(buildRequest({ role: 'volunteer' }), res, jest.fn());

      expect(updateRole).toHaveBeenCalledWith(TARGET_ID, 'volunteer', ACTOR_ID);
    });

    it('deleteById repassa o administrador autenticado ao serviço', async () => {
      const deleteById = jest.fn().mockResolvedValue(buildUser());
      const controller = new UserController({ deleteById } as unknown as UserService);
      const { res, captured } = buildResponse();

      await controller.deleteById(buildRequest(undefined), res, jest.fn());

      expect(deleteById).toHaveBeenCalledWith(TARGET_ID, ACTOR_ID);
      expect(captured.status).toBe(200);
    });
  });
});
