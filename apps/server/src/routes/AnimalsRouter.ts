import { Router } from 'express';
import { AnimalsController } from '../controllers/AnimalsController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { createAnimalSchema } from '../validation/schemas';
import multer from 'multer';
import { AnimalPhotosController } from '../controllers/AnimalPhotosController';

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export class AnimalsRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly controller: AnimalsController,
    private readonly photosController: AnimalPhotosController,
    private readonly auth: AuthMiddleware,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.controller.getAll);
    this.router.get('/:id', this.controller.getById);
    this.router.post(
      '/',
      this.auth.authenticate,
      this.auth.authorize('protector', 'admin', 'volunteer'),
      validateBody(createAnimalSchema),
      this.controller.create,
    );
    this.router.post(
      '/:id/photos',
      this.auth.authenticate,
      this.auth.authorize('protector', 'admin', 'volunteer'),
      photoUpload.single('photo'),
      this.photosController.upload,
    );
  }
}
