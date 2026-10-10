import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError, BadRequestError } from '../errors';
import { CommunityEventService } from '../services/CommunityEventService';
import type { CreateCommunityEventData } from '../validation/communityEventSchema';

const eventIdSchema = z.string().cuid();

export class CommunityEventController {
  constructor(private readonly service: CommunityEventService) {}

  public listUpcomingForManager = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.service.listUpcomingForManager();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public create = async (
    req: Request<Record<string, string>, unknown, CreateCommunityEventData>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.service.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Atividade cadastrada com sucesso.',
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public listUpcoming = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
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
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      const parsedId = eventIdSchema.safeParse(id);
      if (!parsedId.success) {
        throw new BadRequestError('Identificador de atividade inválido.');
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
