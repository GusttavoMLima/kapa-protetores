import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse, VolunteerApplication } from '@kapa/shared';
import { BadRequestError, UnauthorizedError } from '../errors';
import {
  updateVolunteerApplicationStatusSchema,
  volunteerApplicationDataSchema,
  volunteerApplicationIdParamsSchema,
} from '../schemas/volunteerApplication.schema';
import type { VolunteerApplicationService } from '../services/VolunteerApplicationService';

export class VolunteerApplicationController {
  constructor(private readonly service: VolunteerApplicationService) {}

  public submit = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Usuário não autenticado.');
      }

      const parsed = volunteerApplicationDataSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(
          'Dados inválidos para solicitação de voluntariado.',
          parsed.error.format(),
        );
      }

      const data = await this.service.submitApplication(userId, parsed.data);
      const response: ApiResponse<VolunteerApplication> = {
        success: true,
        message: 'Solicitação de voluntariado enviada com sucesso.',
        data,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getMine = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Usuário não autenticado.');
      }

      const data = await this.service.getMyApplication(userId);
      const response: ApiResponse<VolunteerApplication | null> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public listForAdmin = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.service.listForAdmin();
      const response: ApiResponse<VolunteerApplication[]> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const reviewerId = req.user?.sub;
      if (!reviewerId) {
        throw new UnauthorizedError('Usuário não autenticado.');
      }

      const parsedParams = volunteerApplicationIdParamsSchema.safeParse(
        req.params,
      );
      if (!parsedParams.success) {
        throw new BadRequestError(
          'Identificador de solicitação inválido.',
          parsedParams.error.format(),
        );
      }

      const parsedBody = updateVolunteerApplicationStatusSchema.safeParse(
        req.body,
      );
      if (!parsedBody.success) {
        throw new BadRequestError(
          'Status inválido para atualização.',
          parsedBody.error.format(),
        );
      }

      const data = await this.service.updateStatus(
        parsedParams.data.id,
        parsedBody.data.status,
        reviewerId,
      );
      const response: ApiResponse<VolunteerApplication> = {
        success: true,
        message: 'Status da solicitação atualizado com sucesso.',
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
