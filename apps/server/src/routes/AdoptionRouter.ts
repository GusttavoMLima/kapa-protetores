import { Router } from 'express';
import multer from 'multer';
import { AdoptionController } from '../controllers/AdoptionController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import {
  createAdoptionSchema,
  updateAdoptionStatusSchema,
} from '../validation/schemas';

export class AdoptionRouter {
  public readonly router: Router = Router();

  constructor(controller: AdoptionController, auth: AuthMiddleware) {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, callback) => {
        callback(
          null,
          file.mimetype === 'application/pdf' ||
            file.originalname.toLowerCase().endsWith('.pdf'),
        );
      },
    });
    this.router.post(
      '/',
      auth.authenticate,
      auth.authorize('adopter', 'volunteer'),
      validateBody(createAdoptionSchema),
      controller.create,
    );
    this.router.get(
      '/mine',
      auth.authenticate,
      auth.authorize('adopter', 'volunteer'),
      controller.listForAdopter,
    );
    this.router.get(
      '/',
      auth.authenticate,
      auth.authorize('admin'),
      controller.listForAdmin,
    );
    this.router.patch(
      '/:id/status',
      auth.authenticate,
      auth.authorize('admin'),
      validateBody(updateAdoptionStatusSchema),
      controller.updateStatus,
    );
    this.router.post(
      '/:id/signed-contract',
      auth.authenticate,
      auth.authorize('admin'),
      upload.single('contract'),
      controller.uploadSignedContract,
    );
    this.router.get(
      '/:id/signed-contract',
      auth.authenticate,
      auth.authorize('admin'),
      controller.downloadSignedContract,
    );
  }
}
