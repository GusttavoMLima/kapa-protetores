import { ApiRouter } from './ApiRouter';
import { healthRouter } from './health.routes';
import { prisma } from '../database/PrismaService';
import { PostgresAnimalRepository } from '../repositories/PostgresAnimalRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AnimalService } from '../services/AnimalService';
import { AuthService } from '../services/AuthService';
import { AnimalsController } from '../controllers/AnimalsController';
import { AuthController } from '../controllers/AuthController';
import { AnimalsRouter } from './AnimalsRouter';
import { AuthRouter } from './AuthRouter';
import { PasswordHasher } from '../security/PasswordHasher';
import { JwtService } from '../security/JwtService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AnimalPhotosController } from '../controllers/AnimalPhotosController';
import { AnimalPhotoService } from '../services/AnimalPhotoService';

const jwtService = new JwtService(
  process.env.JWT_SECRET ?? '',
  process.env.JWT_ISSUER ?? 'kapa-api',
  process.env.JWT_AUDIENCE ?? 'kapa-app',
  Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 900,
);
const authMiddleware = new AuthMiddleware(jwtService);

const animalRepository = new PostgresAnimalRepository(prisma);
const animalService = new AnimalService(animalRepository);
const animalPhotoService = new AnimalPhotoService(
  prisma,
  process.env.S3_BUCKET ?? 'kapa-public',
  process.env.S3_PUBLIC_URL ?? 'http://localhost:9000',
  process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  process.env.S3_REGION ?? 'us-east-1',
  process.env.S3_ACCESS_KEY ?? '',
  process.env.S3_SECRET_KEY ?? '',
);
const animalsRouter = new AnimalsRouter(
  new AnimalsController(animalService),
  new AnimalPhotosController(animalPhotoService),
  authMiddleware,
);

const userRepository = new UserRepository(prisma);
const authService = new AuthService(
  userRepository,
  new PasswordHasher(),
  jwtService,
);
const authRouter = new AuthRouter(
  new AuthController(authService),
  authMiddleware,
);

const apiRouterInstance = new ApiRouter(healthRouter, animalsRouter, authRouter);

export const apiRouter = apiRouterInstance;
