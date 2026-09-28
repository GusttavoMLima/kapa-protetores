import { Router } from 'express';
import { CommunityEventController } from '../controllers/CommunityEventController';
import { authTokenHandler } from '../middlewares/authTokenHandler';
import { volunteerOnlyHandler } from '../middlewares/volunteerOnlyHandler';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { communityEventManagerOnlyHandler } from '../middlewares/communityEventManagerOnlyHandler';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { createCommunityEventSchema } from '../validation/communityEventSchema';

export class CommunityEventRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly controller: CommunityEventController,
    private readonly auth: AuthMiddleware,
  ) {
    this.router.get(
      '/manage',
      this.auth.authenticate,
      communityEventManagerOnlyHandler,
      controller.listUpcomingForManager,
    );
    this.router.post(
      '/',
      this.auth.authenticate,
      communityEventManagerOnlyHandler,
      validateBody(createCommunityEventSchema),
      controller.create,
    );
    this.router.get('/', authTokenHandler, volunteerOnlyHandler, controller.listUpcoming);
    this.router.post('/:id/volunteers', authTokenHandler, volunteerOnlyHandler, controller.signUp);
  }
}
