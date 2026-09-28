import { Router } from 'express';
import { AnimalsRouter } from './AnimalsRouter';
import { HealthRouter } from './HealthRouter';
import { AuthRouter } from './AuthRouter';
import { UserRouter } from './UserRouter';
import { CommunityEventRouter } from './CommunityEventRouter';
import { CredentialsRouter } from './CredentialsRouter';

export class ApiRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly healthRouter: HealthRouter,
    private readonly animalsRouter: AnimalsRouter,
    private readonly authRouter: AuthRouter,
    private readonly userRouter: UserRouter,
    private readonly communityEventRouter: CommunityEventRouter,
    private readonly credentialsRouter: CredentialsRouter,
  ) {
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.use('/health', this.healthRouter.router);
    this.router.use('/animals', this.animalsRouter.router);
    this.router.use('/auth', this.authRouter.router);
    this.router.use('/auth', this.credentialsRouter.router);
    this.router.use('/users', this.userRouter.router);
    this.router.use('/community-events', this.communityEventRouter.router);
  }
}
