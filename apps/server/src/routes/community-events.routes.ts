import { prisma } from '../database/PrismaService';
import { CommunityEventController } from '../controllers/CommunityEventController';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';
import { CommunityEventService } from '../services/CommunityEventService';
import { CommunityEventRouter } from './CommunityEventRouter';

const repository = new CommunityEventRepository(prisma);
const service = new CommunityEventService(repository);
const controller = new CommunityEventController(service);

export const communityEventRouter = new CommunityEventRouter(controller);
