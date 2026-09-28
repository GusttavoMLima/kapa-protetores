import { Router } from 'express';
import { CredentialsController } from '../controllers/CredentialsController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { adminCreateUserSchema, loginSchema, registerSchema } from '../validation/schemas';

export class CredentialsRouter {
  public readonly router = Router();

  constructor(controller: CredentialsController, auth: AuthMiddleware) {
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
