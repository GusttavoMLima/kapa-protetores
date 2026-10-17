import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';
import { AdoptionService } from '../services/AdoptionService';
import type { AdoptionApplication } from '@kapa/shared';

export class AdoptionController {
  constructor(private readonly service: AdoptionService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { animalId, application } = req.body as { animalId: string; application: AdoptionApplication };
      const data = await this.service.create(req.user.sub, animalId, application);
      res.status(201).json({
        success: true,
        message: 'Solicitação de adoção enviada com sucesso.',
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public listForAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.listForAdmin();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public listForAdopter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = await this.service.listForAdopter(req.user.sub);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: 'interviewing' | 'approved' | 'rejected' };
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await this.service.updateStatus(id, status);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
