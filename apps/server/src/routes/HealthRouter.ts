import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

export class HealthRouter {
  public readonly router: Router = Router();

  constructor(private readonly controller: HealthController) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/', this.controller.check);
  }
}
