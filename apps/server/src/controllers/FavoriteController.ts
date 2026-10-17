import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../errors';
import { FavoriteService } from '../services/FavoriteService';

const toggleFavoriteSchema = z.object({ animalId: z.string().cuid() });

export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}

  public toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { animalId } = toggleFavoriteSchema.parse(req.body);
      const favorited = await this.service.toggle(req.user.sub, animalId);
      res.json({ success: true, data: { favorited } });
    } catch (error) {
      next(error);
    }
  };
}
