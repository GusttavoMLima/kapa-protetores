import { Router } from 'express';
import { AdoptionController } from '../controllers/AdoptionController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { createAdoptionSchema, updateAdoptionStatusSchema } from '../validation/schemas';

export class AdoptionRouter {
  public readonly router: Router = Router();

  constructor(
    controller: AdoptionController,
    auth: AuthMiddleware,
  ) {
    this.router.post(
      '/',
      auth.authenticate,
      auth.authorize('adopter'),
      validateBody(createAdoptionSchema),
      controller.create,
    );
    this.router.get('/mine', auth.authenticate, auth.authorize('adopter'), controller.listForAdopter);
    this.router.get('/', auth.authenticate, auth.authorize('admin'), controller.listForAdmin);
    this.router.patch('/:id/status', auth.authenticate, auth.authorize('admin'), validateBody(updateAdoptionStatusSchema), controller.updateStatus);
  }
}
