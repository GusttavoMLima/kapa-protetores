import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../errors';
import { AnimalPhotoService } from '../services/AnimalPhotoService';

export class AnimalPhotosController {
  constructor(private readonly service: AnimalPhotoService) {}

  public upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramId = req.params.id;
      const animalId = Array.isArray(paramId) ? paramId[0] : paramId;
      if (!animalId) throw new BadRequestError('ID inválido.');
      if (!req.file) throw new BadRequestError('Selecione uma foto para enviar.');
      const data = await this.service.upload(animalId, req.file);
      res.status(201).json({ success: true, message: 'Foto enviada com sucesso.', data });
    } catch (error) {
      next(error);
    }
  };
}
