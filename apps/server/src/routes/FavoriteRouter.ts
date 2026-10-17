import { Router } from 'express';
import { FavoriteController } from '../controllers/FavoriteController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

export class FavoriteRouter {
  public readonly router = Router();

  constructor(controller: FavoriteController, auth: AuthMiddleware) {
    this.router.post('/', auth.authenticate, auth.authorize('adopter'), controller.toggle);
  }
}
