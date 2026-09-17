import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';
import { RedisService } from '../services/RedisService';

export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly redisService: RedisService,
  ) {}

  public check = (_req: Request, res: Response): void => {
    const status = this.healthService.getStatus();
    res.status(200).json(status);
  };

  public checkRedis = async (_req: Request, res: Response): Promise<void> => {
    const status = await this.redisService.healthCheck();
    res.status(200).json(status);
  };
}
