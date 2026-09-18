import { Router } from 'express';
import { AnimalsRouter } from './AnimalsRouter';
import { HealthRouter } from './HealthRouter';
import { AuthRouter } from './AuthRouter';

export class ApiRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly healthRouter: HealthRouter,
    private readonly animalsRouter: AnimalsRouter,
    private readonly authRouter: AuthRouter,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.use('/health', this.healthRouter.router);
    this.router.use('/animals', this.animalsRouter.router);
    this.router.use('/auth', this.authRouter.router);
  }
}
