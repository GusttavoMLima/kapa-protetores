import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { adminCreateUserSchema, loginSchema, registerSchema } from '../validation/schemas';

export class AuthRouter {
  public readonly router = Router();

  constructor(controller: AuthController, auth: AuthMiddleware) {
    this.router.post('/register', validateBody(registerSchema), controller.register);
    this.router.post('/login', validateBody(loginSchema), controller.login);
    this.router.get('/me', auth.authenticate, controller.me);
    this.router.post(
      '/users',
      auth.authenticate,
      auth.authorize('admin'),
      validateBody(adminCreateUserSchema),
      controller.createUser,
    );
  }
}
