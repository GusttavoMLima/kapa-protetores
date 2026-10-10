import type { RequestHandler } from 'express';
import { canManageAnimals } from '@kapa/shared';
import type { UserRepository } from '../repositories/UserRepository';
import { UnauthorizedError, ForbiddenError } from '../errors';

export function animalManagementAccess(repository: Pick<UserRepository, 'findByIdValue'>): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const user = await repository.findByIdValue(req.auth.userId);
      if (!user) throw new UnauthorizedError();
      // Read the current role so a revoked permission cannot outlive its JWT.
      if (!canManageAnimals(user.getRole())) throw new ForbiddenError();
      next();
    } catch (error) {
      next(error);
    }
  };
}
