import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';
import { RedisService } from '../services/RedisService';
import type { ApiResponse } from '@kapa/shared';

export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly redisService: RedisService,
  ) {}

  public check = (_req: Request, res: Response): void => {
    const status = this.healthService.getStatus();
    const response: ApiResponse<typeof status> = {
      success: true,
      message: 'Health status OK',
      data: status,
    };
    res.status(200).json(response);
  };

  public checkRedis = async (_req: Request, res: Response): Promise<void> => {
    const status = await this.redisService.healthCheck();
    const response: ApiResponse<typeof status> = {
      success: status.status === 'healthy',
      message: `Redis health status: ${status.status}`,
      data: status,
    };
    res.status(200).json(response);
  };
}
