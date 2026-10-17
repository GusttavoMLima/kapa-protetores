import { ApiRouter } from './ApiRouter';
import { prisma } from '../database/PrismaService';
import { getStorageConfig } from '../config/storageConfig';
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

const jwtService = new JwtService(
  process.env.JWT_SECRET ?? '',
  process.env.JWT_ISSUER ?? 'kapa-api',
  process.env.JWT_AUDIENCE ?? 'kapa-app',
  Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 900,
);
const authMiddleware = new AuthMiddleware(jwtService);

const healthService = new HealthService();
const healthController = new HealthController(healthService, redisService);
const healthRouter = new HealthRouter(healthController);

const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const userRouter = new UserRouter(userController, authMiddleware);

const authController = new AuthController(userService);
const authRouter = new AuthRouter(authController);

const animalRepository = new PostgresAnimalRepository(prisma);
const animalService = new AnimalService(animalRepository);
const storageConfig = getStorageConfig();
const animalPhotoService = new AnimalPhotoService(
  prisma,
  storageConfig.bucket,
  storageConfig.publicUrl,
  storageConfig.endpoint,
  storageConfig.region,
  storageConfig.accessKeyId,
  storageConfig.secretAccessKey,
);

const animalsRouter = new AnimalsRouter(
  new AnimalsController(animalService),
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
);

const adopterProfileController = new AdopterProfileController(
  adopterProfileService,
);

const adopterProfileRouter = new AdopterProfileRouter(
  adopterProfileController,
  authMiddleware,
);

const adoptionRouter = new AdoptionRouter(
  new AdoptionController(new AdoptionService(new AdoptionRepository(prisma))),
  authMiddleware,
);

const favoriteRouter = new FavoriteRouter(
  new FavoriteController(new FavoriteService(new FavoriteRepository(prisma))),
  authMiddleware,
);

const repository = new CommunityEventRepository(prisma);
const service = new CommunityEventService(repository);
const controller = new CommunityEventController(service);

const communityEventRouter = new CommunityEventRouter(
  controller,
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
);

export const apiRouter = apiRouterInstance;
