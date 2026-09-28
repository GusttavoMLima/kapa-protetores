import { prisma } from '../database/PrismaService';
import { CommunityEventController } from '../controllers/CommunityEventController';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';
import { CommunityEventService } from '../services/CommunityEventService';
import { CommunityEventRouter } from './CommunityEventRouter';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { JwtService } from '../security/JwtService';

const repository = new CommunityEventRepository(prisma);
const service = new CommunityEventService(repository);
const controller = new CommunityEventController(service);

const jwtService = new JwtService(
  process.env.JWT_SECRET ?? '',
  process.env.JWT_ISSUER ?? 'kapa-api',
  process.env.JWT_AUDIENCE ?? 'kapa-app',
  Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 900,
);

export const communityEventRouter = new CommunityEventRouter(
  controller,
  new AuthMiddleware(jwtService),
);
