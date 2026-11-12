import { Router, type RequestHandler } from 'express';
import type { FosterApplicationController } from '../controllers/FosterApplicationController';
import type { AuthMiddleware } from '../middlewares/AuthMiddleware';
import type { UserRepository } from '../repositories/UserRepository';
import { ForbiddenError, UnauthorizedError } from '../errors';

export class FosterApplicationRouter {
  public readonly router = Router();

  constructor(
    controller: FosterApplicationController,
    auth: AuthMiddleware,
    users: Pick<UserRepository, 'findByIdValue'>,
    managementAccess: RequestHandler,
  ) {
    const applicantAccess: RequestHandler = async (req, _res, next) => {
      try {
        if (!req.user) throw new UnauthorizedError();
        const user = await users.findByIdValue(req.user.sub);
        if (!user) throw new UnauthorizedError();
        const role = user.getRole();
        if (role !== 'adopter' && role !== 'volunteer') throw new ForbiddenError();
        next();
      } catch (error) { next(error); }
    };
    this.router.use(auth.authenticate, (_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    });
    this.router.get('/mine', applicantAccess, controller.getMine);
    this.router.post('/', applicantAccess, controller.submit);
    this.router.get('/', managementAccess, controller.list);
    this.router.patch('/:id/status', managementAccess, controller.review);
  }
}
