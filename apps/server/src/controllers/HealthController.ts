import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  public check = (_req: Request, res: Response): void => {
    const status = this.healthService.getStatus();
    res.status(200).json(status);
  };
}
