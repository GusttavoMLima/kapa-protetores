import { Router, type RequestHandler } from 'express';
import type { DashboardController } from '../controllers/DashboardController';
import type { AuthMiddleware } from '../middlewares/AuthMiddleware';

export class DashboardRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly controller: DashboardController,
    private readonly authMiddleware: AuthMiddleware,
    private readonly managementAccess: RequestHandler,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(
      '/summary',
      this.authMiddleware.authenticate,
      this.managementAccess,
      this.controller.getSummary,
    );
  }
}
