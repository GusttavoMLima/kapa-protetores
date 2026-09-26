import { Router, type RequestHandler } from 'express';
import { AnimalsController } from '../controllers/AnimalsController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { createAnimalSchema, updateAnimalSchema } from '../validation/schemas';
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
    private readonly photosController: Pick<AnimalPhotosController, 'upload'>,
    private readonly auth: AuthMiddleware,
    private readonly managementAccess: RequestHandler,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/management', this.auth.authenticate, this.managementAccess, this.controller.getManagementPage);
    this.router.get('/management/:id', this.auth.authenticate, this.managementAccess, this.controller.getManagedById);
    this.router.patch('/management/:id', this.auth.authenticate, this.managementAccess, validateBody(updateAnimalSchema), this.controller.update);
    this.router.get('/', this.controller.getAll);
    this.router.get('/:id', this.controller.getById);
    this.router.post(
      '/',
      this.auth.authenticate,
      this.managementAccess,
      validateBody(createAnimalSchema),
      this.controller.create,
    );
    this.router.post(
      '/:id/photos',
      this.auth.authenticate,
      this.managementAccess,
      photoUpload.single('photo'),
      this.photosController.upload,
    );
  }
}
