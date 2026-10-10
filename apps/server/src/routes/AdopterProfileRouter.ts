import { Router } from 'express';
import { AdopterProfileController } from '../controllers/AdopterProfileController';
import { authTokenHandler } from '../middlewares/authTokenHandler';
import { rulesHandler } from '../middlewares/rulesHandler';

export class AdopterProfileRouter {
  public readonly router: Router = Router();

  constructor(private readonly controller: AdopterProfileController) {
    this.initRoutes();
  }

  private initRoutes(): void {
    // 1. Estatísticas / contagem geral
    this.router.get('/count', this.controller.countAll);

    // 2. Listagem global (administração)
    this.router.get(
      '/all',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.getAll,
    );

    // 3. Rotas do adotante autenticado (/me)
    this.router.get(
      '/me',
      authTokenHandler,
      rulesHandler('user:read:own'),
      this.controller.getMe,
    );
    this.router.put(
      '/me',
      authTokenHandler,
      rulesHandler('user:update:own'),
      this.controller.upsertMe,
    );
    this.router.patch(
      '/me',
      authTokenHandler,
      rulesHandler('user:update:own'),
      this.controller.updateMe,
    );
    this.router.delete(
      '/me',
      authTokenHandler,
      rulesHandler('user:delete:own'),
      this.controller.deleteMe,
    );

    // 4. Busca por preferências
    this.router.post(
      '/preferences/search',
      authTokenHandler,
      this.controller.getByPreferences,
    );
    this.router.get(
      '/preference',
      authTokenHandler,
      this.controller.getByPreference,
    );

    // 5. Criação de perfil
    this.router.post(
      '/',
      authTokenHandler,
      this.controller.create,
    );

    // 6. Rotas por User ID (/user/:id) - administração
    this.router.get(
      '/user/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.getByUserId,
    );
    this.router.patch(
      '/user/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.updateByUserId,
    );
    this.router.put(
      '/user/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.upsert,
    );
    this.router.delete(
      '/user/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.deleteByUserId,
    );

    // 7. Rotas por Profile ID (/:id)
    this.router.get(
      '/:id',
      authTokenHandler,
      this.controller.getById,
    );
    this.router.patch(
      '/:id',
      authTokenHandler,
      this.controller.update,
    );
    this.router.delete(
      '/:id',
      authTokenHandler,
      rulesHandler('admin:*'),
      this.controller.delete,
    );
  }
}
