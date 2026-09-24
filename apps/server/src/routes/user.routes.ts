import { prisma } from '../database/PrismaService';
import { UserRepository } from '../repositories/UserRepository';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/UserController';
import { UserRouter } from './UserRouter';

const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const userRouterInstance = new UserRouter(userController);

export const userRouter = userRouterInstance;
export { UserRouter, userController };
