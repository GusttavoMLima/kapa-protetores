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

      const filesMap =
        req.files && !Array.isArray(req.files)
          ? (req.files as Record<string, Express.Multer.File[]>)
          : undefined;
      const uploadedFiles: Express.Multer.File[] = [
        ...(req.file ? [req.file] : []),
        ...(Array.isArray(req.files) ? req.files : []),
        ...(filesMap?.photo ?? []),
        ...(filesMap?.photos ?? []),
      ];

      if (uploadedFiles.length === 0) {
        throw new BadRequestError('Selecione uma foto para enviar.');
      }

      if (uploadedFiles.length === 1) {
        const data = await this.service.upload(animalId, uploadedFiles[0]);
        res.status(201).json({ success: true, message: 'Foto enviada com sucesso.', data });
        return;
      }

      const results = [];
      for (const file of uploadedFiles) {
        results.push(await this.service.upload(animalId, file));
      }
      res.status(201).json({
        success: true,
        message: 'Fotos enviadas com sucesso.',
        data: results[results.length - 1],
        photos: results,
      });
    } catch (error) {
      next(error);
    }
  };
}
