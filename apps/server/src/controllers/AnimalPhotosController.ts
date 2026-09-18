import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { AnimalPhotoService } from '../services/AnimalPhotoService';

export class AnimalPhotosController {
  constructor(private readonly service: AnimalPhotoService) {}

  public upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramId = req.params.id;
      const animalId = Array.isArray(paramId) ? paramId[0] : paramId;
      if (!animalId) throw AppError.badRequest('ID inválido.');
      if (!req.file) throw AppError.badRequest('Selecione uma foto para enviar.');
      const data = await this.service.upload(animalId, req.file);
      res.status(201).json({ success: true, message: 'Foto enviada com sucesso.', data });
    } catch (error) {
      next(error);
    }
  };
}
