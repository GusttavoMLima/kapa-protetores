import { animalsRouter } from './animals.routes';
import { ApiRouter } from './ApiRouter';
import { healthRouter } from './health.routes';

const apiRouterInstance = new ApiRouter(healthRouter, animalsRouter);

export const apiRouter = apiRouterInstance;
