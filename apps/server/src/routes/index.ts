import { ApiRouter } from './ApiRouter';
import { prisma } from '../database/PrismaService';
import { PostgresAnimalRepository } from '../repositories/PostgresAnimalRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AnimalService } from '../services/AnimalService';
import { AuthService } from '../services/AuthService';
import { AnimalsController } from '../controllers/AnimalsController';
import { CredentialsController } from '../controllers/CredentialsController';
import { AnimalsRouter } from './AnimalsRouter';
import { CredentialsRouter } from './CredentialsRouter';
import { PasswordHasher } from '../security/PasswordHasher';
import { JwtService } from '../security/JwtService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AnimalPhotosController } from '../controllers/AnimalPhotosController';
import { AnimalPhotoService } from '../services/AnimalPhotoService';
import { animalManagementAccess } from '../middlewares/AnimalManagementMiddleware';
import { AdopterProfileRepository } from '../repositories/AdopterProfileRepository';
import { AdopterProfileService } from '../services/AdopterProfileService';
import { AdopterProfileController } from '../controllers/AdopterProfileController';
import { AdopterProfileRouter } from './AdopterProfileRouter';
import { UserRouter } from './UserRouter';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { UserPhotoService } from '../services/UserPhotoService';
import { EventsService } from '../services/EventsService';
import { AuthController } from '../controllers/AuthController';
import { AuthRouter } from './AuthRouter';
import { HealthService } from '../services/HealthService';
import { HealthController } from '../controllers/HealthController';
import { HealthRouter } from './HealthRouter';
import { redisService } from '../services/RedisService';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';
import { CommunityEventService } from '../services/CommunityEventService';
import { CommunityEventController } from '../controllers/CommunityEventController';
import { CommunityEventRouter } from './CommunityEventRouter';
import { AdoptionRepository } from '../repositories/AdoptionRepository';
import { AdoptionService } from '../services/AdoptionService';
import { AdoptionController } from '../controllers/AdoptionController';
import { AdoptionRouter } from './AdoptionRouter';
import { FavoriteRepository } from '../repositories/FavoriteRepository';
import { FavoriteService } from '../services/FavoriteService';
import { FavoriteController } from '../controllers/FavoriteController';
import { FavoriteRouter } from './FavoriteRouter';
import { PredictionService } from '../services/PredictionService';
import { VolunteerApplicationRepository } from '../repositories/VolunteerApplicationRepository';
import { VolunteerApplicationService } from '../services/VolunteerApplicationService';
import { VolunteerApplicationController } from '../controllers/VolunteerApplicationController';
import { VolunteerApplicationRouter } from './VolunteerApplicationRouter';

const jwtService = new JwtService(
  process.env.JWT_SECRET ?? '',
  process.env.JWT_ISSUER ?? 'kapa-api',
  process.env.JWT_AUDIENCE ?? 'kapa-app',
  Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 604800,
);
const authMiddleware = new AuthMiddleware(jwtService);

const healthService = new HealthService();
const healthController = new HealthController(healthService, redisService);
const healthRouter = new HealthRouter(healthController);

const userRepository = new UserRepository(prisma);
const s3Bucket =
  process.env.SUPABASE_S3_BUCKET || process.env.S3_BUCKET || 'kapa-public';
const s3PublicUrl =
  process.env.SUPABASE_S3_PUBLIC_URL ||
  process.env.S3_PUBLIC_URL ||
  'https://mjpwurytnjbqrvdrsivy.supabase.co/storage/v1/object/public';
const s3Endpoint =
  process.env.SUPABASE_S3_ENDPOINT ||
  process.env.S3_ENDPOINT ||
  'https://mjpwurytnjbqrvdrsivy.storage.supabase.co/storage/v1/s3';
const s3Region =
  process.env.SUPABASE_S3_REGION || process.env.S3_REGION || 'us-east-1';
const s3AccessKey =
  process.env.SUPABASE_S3_ACCESS_KEY || process.env.S3_ACCESS_KEY || '';
const s3SecretKey =
  process.env.SUPABASE_S3_SECRET_KEY || process.env.S3_SECRET_KEY || ''; // gitleaks:allow

const userPhotoService = new UserPhotoService(
  prisma,
  s3Bucket,
  s3PublicUrl,
  s3Endpoint,
  s3Region,
  s3AccessKey,
  s3SecretKey,
  redisService,
);

const eventsService = new EventsService(prisma);
const userService = new UserService(
  userRepository,
  redisService,
  eventsService,
);
const userController = new UserController(
  userService,
  userPhotoService,
  eventsService,
);
const userRouter = new UserRouter(userController, authMiddleware);

const authController = new AuthController(userService);
const authRouter = new AuthRouter(authController);

const animalRepository = new PostgresAnimalRepository(prisma);
const animalService = new AnimalService(
  animalRepository,
  redisService,
  eventsService,
);
const animalPhotoService = new AnimalPhotoService(
  prisma,
  s3Bucket,
  s3PublicUrl,
  s3Endpoint,
  s3Region,
  s3AccessKey,
  s3SecretKey,
  redisService,
);

const predictionService = new PredictionService(prisma, redisService);

const animalsRouter = new AnimalsRouter(
  new AnimalsController(animalService, predictionService),
  new AnimalPhotosController(animalPhotoService),
  authMiddleware,
  animalManagementAccess(userRepository),
);

const authService = new AuthService(
  userRepository,
  new PasswordHasher(),
  jwtService,
);

const credentialsRouter = new CredentialsRouter(
  new CredentialsController(authService),
  authMiddleware,
);

const adopterProfileRepository = new AdopterProfileRepository(prisma);
const adopterProfileService = new AdopterProfileService(
  adopterProfileRepository,
  redisService,
);

const adopterProfileController = new AdopterProfileController(
  adopterProfileService,
);

const adopterProfileRouter = new AdopterProfileRouter(
  adopterProfileController,
  authMiddleware,
);

const adoptionRouter = new AdoptionRouter(
  new AdoptionController(
    new AdoptionService(
      new AdoptionRepository(prisma),
      redisService,
      eventsService,
    ),
  ),
  authMiddleware,
);

const favoriteRouter = new FavoriteRouter(
  new FavoriteController(
    new FavoriteService(
      new FavoriteRepository(prisma),
      redisService,
      eventsService,
    ),
  ),
  authMiddleware,
);

const repository = new CommunityEventRepository(prisma);
const service = new CommunityEventService(
  repository,
  redisService,
  eventsService,
);
const controller = new CommunityEventController(service);

const communityEventRouter = new CommunityEventRouter(
  controller,
  authMiddleware,
);

const volunteerApplicationRouter = new VolunteerApplicationRouter(
  new VolunteerApplicationController(
    new VolunteerApplicationService(
      new VolunteerApplicationRepository(prisma),
      redisService,
      eventsService,
    ),
  ),
  authMiddleware,
);

const apiRouterInstance = new ApiRouter(
  healthRouter,
  animalsRouter,
  authRouter,
  userRouter,
  communityEventRouter,
  credentialsRouter,
  adopterProfileRouter,
  adoptionRouter,
  favoriteRouter,
  volunteerApplicationRouter,
);

export const apiRouter = apiRouterInstance;
