import type { NextFunction, Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../errors';
import { AdoptionService } from '../services/AdoptionService';
import type { AdoptionApplication, UpdateAdoptionStatusInput } from '@kapa/shared';

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
      const input = req.body as UpdateAdoptionStatusInput;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await this.service.updateWorkflow(id, input);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public uploadSignedContract = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('Selecione o PDF do contrato assinado.');
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await this.service.uploadSignedContract(id, req.file);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public downloadSignedContract = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const contract = await this.service.getSignedContract(id);
      const encodedFileName = encodeURIComponent(contract.fileName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodedFileName}`,
      );
      res.send(contract.data);
    } catch (error) {
      next(error);
    }
  };
}
