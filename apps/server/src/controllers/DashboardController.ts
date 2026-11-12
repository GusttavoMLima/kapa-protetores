import type { NextFunction, Request, Response } from 'express';
import type { DashboardService } from '../services/DashboardService';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public getSummary = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.dashboardService.getSummary();
      res.status(200).json({
        message: 'Resumo do painel carregado com sucesso.',
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
