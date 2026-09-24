import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authTokenHandler } from '../middlewares/authTokenHandler';
import { rulesHandler } from '../middlewares/rulesHandler';

export class UserRouter {
  public readonly router: Router = Router();

  constructor(private readonly controller: UserController) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/count', this.controller.countAll);
    this.router.get(
      '/all',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.getAll,
    );
    this.router.post('/create', this.controller.register);
    this.router.post('/signin', this.controller.signIn);
    this.router.get(
      '/me',
      authTokenHandler,
      rulesHandler('user:read:own'),
      this.controller.userInfo,
    );
    this.router.patch(
      '/me',
      authTokenHandler,
      rulesHandler('user:update:own'),
      this.controller.updateProfile,
    );
    this.router.delete(
      '/me',
      authTokenHandler,
      rulesHandler('user:delete:own'),
      this.controller.deleteMe,
    );
    this.router.patch(
      '/me/password',
      authTokenHandler,
      rulesHandler('user:update:own'),
      this.controller.updatePassword,
    );
    this.router.get(
      '/:id',
      authTokenHandler,
      rulesHandler('user:read:other'),
      this.controller.getById,
    );
    this.router.patch(
      '/:id/role',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.updateRole,
    );
    this.router.delete(
      '/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.deleteById,
    );
  }
}
