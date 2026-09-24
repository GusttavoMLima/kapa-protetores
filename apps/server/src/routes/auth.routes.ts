import { prisma } from '../database/PrismaService';
import { UserRepository } from '../repositories/UserRepository';
import { UserService } from '../services/UserService';
import { AuthController } from '../controllers/AuthController';
import { AuthRouter } from './AuthRouter';

const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const authController = new AuthController(userService);
const authRouterInstance = new AuthRouter(authController);

export const authRouter = authRouterInstance;
export { AuthRouter };
