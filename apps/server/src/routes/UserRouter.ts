import { Router } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/UserController';
import { rulesHandler } from '../middlewares/rulesHandler';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

export class UserRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly controller: UserController,
    private readonly authController: AuthMiddleware,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    });

    this.router.get('/count', this.controller.countAll);
    this.router.get(
      '/all',
      this.authController.authenticate,
      rulesHandler('admin:*'),
      this.controller.getAll,
    );
    this.router.post('/create', this.controller.register);
    this.router.post('/signin', this.controller.signIn);
    this.router.get(
      '/me',
      this.authController.authenticate,
      rulesHandler('user:read:own'),
      this.controller.userInfo,
    );
    this.router.patch(
      '/me',
      this.authController.authenticate,
      rulesHandler('user:update:own'),
      this.controller.updateProfile,
    );
    if (this.controller.uploadAvatar) {
      this.router.post(
        '/me/avatar',
        this.authController.authenticate,
        rulesHandler('user:update:own'),
        upload.single('avatar'),
        this.controller.uploadAvatar,
      );
    }
    this.router.delete(
      '/me',
      this.authController.authenticate,
      rulesHandler('user:delete:own'),
      this.controller.deleteMe,
    );
    this.router.get(
      '/me/profile',
      this.authController.authenticate,
      rulesHandler('user:read:own'),
      this.controller.getProfile,
    );
    if (this.controller.getMyEvents) {
      this.router.get(
        '/me/events',
        this.authController.authenticate,
        rulesHandler('user:read:own'),
        this.controller.getMyEvents,
      );
    }
    this.router.patch(
      '/me/password',
      this.authController.authenticate,
      rulesHandler('user:update:own'),
      this.controller.updatePassword,
    );
    this.router.get(
      '/:id',
      this.authController.authenticate,
      rulesHandler('user:read:other'),
      this.controller.getById,
    );
    this.router.patch(
      '/:id/role',
      this.authController.authenticate,
      rulesHandler('admin:*'),
      this.controller.updateRole,
    );
    this.router.delete(
      '/:id',
      this.authController.authenticate,
      rulesHandler('admin:*'),
      this.controller.deleteById,
    );
  }
}
