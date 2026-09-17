import { HealthService } from '../services/HealthService';
import { HealthController } from '../controllers/HealthController';
import { HealthRouter } from './HealthRouter';
import { redisService } from '../services/RedisService';

const healthService = new HealthService();
const healthController = new HealthController(healthService, redisService);
const healthRouterInstance = new HealthRouter(healthController);

export const healthRouter = healthRouterInstance;
export { HealthRouter };
