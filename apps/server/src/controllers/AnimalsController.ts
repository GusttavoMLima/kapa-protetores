import { Request, Response, NextFunction } from 'express';
import { AnimalService } from '../services/AnimalService';
import { AppError } from '../errors/AppError';

export class AnimalsController {
  constructor(private readonly animalService: AnimalService) {}

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.animalService.getAll();
      res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramId = req.params.id;
      const id = Array.isArray(paramId) ? paramId[0] : paramId;
      if (!id) {
        throw AppError.badRequest('ID inválido.');
      }
      const data = await this.animalService.getById(id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.animalService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Animal cadastrado com sucesso',
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
