import { Router } from 'express';
import { CommunityEventController } from '../controllers/CommunityEventController';
import { authTokenHandler } from '../middlewares/authTokenHandler';
import { volunteerOnlyHandler } from '../middlewares/volunteerOnlyHandler';

export class CommunityEventRouter {
  public readonly router: Router = Router();

  constructor(private readonly controller: CommunityEventController) {
    this.router.get('/', authTokenHandler, volunteerOnlyHandler, controller.listUpcoming);
    this.router.post('/:id/volunteers', authTokenHandler, volunteerOnlyHandler, controller.signUp);
  }
}
