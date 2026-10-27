import { Router } from 'express';
import { AnimalsRouter } from './AnimalsRouter';
import { HealthRouter } from './HealthRouter';
import { AuthRouter } from './AuthRouter';
import { UserRouter } from './UserRouter';
import { CommunityEventRouter } from './CommunityEventRouter';
import { CredentialsRouter } from './CredentialsRouter';
import { AdopterProfileRouter } from './AdopterProfileRouter';
import { AdoptionRouter } from './AdoptionRouter';
import { FavoriteRouter } from './FavoriteRouter';
import { VolunteerApplicationRouter } from './VolunteerApplicationRouter';

export class ApiRouter {
  public readonly router: Router = Router();

  constructor(
    private readonly healthRouter: HealthRouter,
    private readonly animalsRouter: AnimalsRouter,
    private readonly authRouter: AuthRouter,
    private readonly userRouter: UserRouter,
    private readonly communityEventRouter: CommunityEventRouter,
    private readonly credentialsRouter: CredentialsRouter,
    private readonly adopterProfileRouter?: AdopterProfileRouter,
    private readonly adoptionRouter?: AdoptionRouter,
    private readonly favoriteRouter?: FavoriteRouter,
    private readonly volunteerApplicationRouter?: VolunteerApplicationRouter,
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
    if (this.adopterProfileRouter) {
      this.router.use('/adopter-profiles', this.adopterProfileRouter.router);
    }
    if (this.adoptionRouter) {
      this.router.use('/adoptions', this.adoptionRouter.router);
    }
    if (this.favoriteRouter) {
      this.router.use('/favorites', this.favoriteRouter.router);
    }
    if (this.volunteerApplicationRouter) {
      this.router.use(
        '/volunteer-applications',
        this.volunteerApplicationRouter.router,
      );
    }
  }
}
