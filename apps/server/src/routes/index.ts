import { animalsRouter } from './animals.routes';
import { ApiRouter } from './ApiRouter';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';

const apiRouterInstance = new ApiRouter(
  healthRouter,
  animalsRouter,
  authRouter,
  userRouter,
);

export const apiRouter = apiRouterInstance;

