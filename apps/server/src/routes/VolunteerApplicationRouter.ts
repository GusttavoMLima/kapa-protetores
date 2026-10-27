import { Router } from 'express';
import type { VolunteerApplicationController } from '../controllers/VolunteerApplicationController';
import type { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { communityEventManagerOnlyHandler } from '../middlewares/communityEventManagerOnlyHandler';

export class VolunteerApplicationRouter {
  public readonly router: Router = Router();

  constructor(
    controller: VolunteerApplicationController,
    auth: AuthMiddleware,
  ) {
    this.router.post('/', auth.authenticate, controller.submit);
    this.router.get('/mine', auth.authenticate, controller.getMine);
    this.router.get(
      '/',
      auth.authenticate,
      communityEventManagerOnlyHandler,
      controller.listForAdmin,
    );
    this.router.patch(
      '/:id/status',
      auth.authenticate,
      communityEventManagerOnlyHandler,
      controller.updateStatus,
    );
  }
}
