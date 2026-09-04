import { HealthService } from '../services/HealthService';
import { HealthController } from '../controllers/HealthController';
import { HealthRouter } from './HealthRouter';

const healthService = new HealthService();
const healthController = new HealthController(healthService);
const healthRouterInstance = new HealthRouter(healthController);

export const healthRouter = healthRouterInstance;
export { HealthRouter };
