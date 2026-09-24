import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { CommunityEventService } from '../services/CommunityEventService';

const eventIdSchema = z.string().cuid();

export class CommunityEventController {
  constructor(private readonly service: CommunityEventService) {}

  public listUpcoming = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const data = await this.service.listUpcomingForVolunteer(req.user.sub);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public signUp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const parsedId = eventIdSchema.safeParse(id);
      if (!parsedId.success) {
        throw AppError.badRequest('Identificador de atividade inválido.');
      }

      const data = await this.service.signUp(req.user.sub, parsedId.data);
      res.status(201).json({
        success: true,
        message: 'Inscrição realizada com sucesso.',
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
