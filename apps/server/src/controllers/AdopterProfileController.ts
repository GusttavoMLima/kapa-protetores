import type { NextFunction, Request, Response } from 'express';
import { AdopterProfileService } from '../services/AdopterProfileService';
import type { ApiResponse, AdopterProfile as SharedAdopterProfile } from '@kapa/shared';
import {
  adoptionProfileCreate,
  adoptionProfileIdParams,
  adoptionProfilePreferences,
  adoptionProfileSinglePreference,
  adoptionProfileUpdate,
} from '../schemas/adoptionProfile.schema';
import { BadRequestError } from '../errors';
import type { AdopterPreferences } from '../interfaces';

export class AdopterProfileController {
  constructor(private readonly profileService: AdopterProfileService) {}

  public mapToApiResponse<T>({
    data,
    message = 'Success',
    error,
  }: {
    data: T;
    message?: string;
    error?: string;
  }): ApiResponse<T> {
    return {
      message,
      data,
      success: !error,
      error,
    };
  }

  public countAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.profileService.countAll();
      const response = this.mapToApiResponse<number>({ data });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const profiles = await this.profileService.getAll();
      const response = this.mapToApiResponse<SharedAdopterProfile[]>({
        data: profiles.map((p) => p.toDTO()),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('Profile id invalid.', params.error.format());
      }

      const adopterProfile = await this.profileService.getById(params.data.id);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: adopterProfile.toDTO(),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('User id invalid.', params.error.format());
      }

      const adopterProfile = await this.profileService.getByUserId(
        params.data.id,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: adopterProfile.toDTO(),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.sub) {
        throw new BadRequestError('User authentication required.');
      }

      const adopterProfile = await this.profileService.getByUserId(
        req.user.sub,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: adopterProfile.toDTO(),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.sub) {
        throw new BadRequestError('User authentication required.');
      }

      const body = adoptionProfileUpdate.safeParse(req.body);

      if (!body.success) {
        throw new BadRequestError('Invalid update data.', body.error.format());
      }

      const updated = await this.profileService.updateByUserId(
        req.user.sub,
        body.data,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: updated.toDTO(),
        message: 'Profile updated with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public upsertMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.sub) {
        throw new BadRequestError('User authentication required.');
      }

      const body = adoptionProfileUpdate.safeParse(req.body);

      if (!body.success) {
        throw new BadRequestError('Invalid update data.', body.error.format());
      }

      const saved = await this.profileService.upsert(req.user.sub, body.data);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: saved.toDTO(),
        message: 'Profile saved with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public deleteMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.sub) {
        throw new BadRequestError('User authentication required.');
      }

      const deleted = await this.profileService.deleteByUserId(req.user.sub);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: deleted.toDTO(),
        message: 'Profile deleted with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getByPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const source = Object.keys(req.body).length > 0 ? req.body : req.query;
      const parsed = adoptionProfilePreferences.safeParse(source);

      if (!parsed.success) {
        throw new BadRequestError(
          'Filters are invalid.',
          parsed.error.format(),
        );
      }

      const profiles = await this.profileService.getByPreferences(
        parsed.data.filters,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile[]>({
        data: profiles.map((p) => p.toDTO()),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getByPreference = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const source = Object.keys(req.query).length > 0 ? req.query : req.body;
      const parsed = adoptionProfileSinglePreference.safeParse(source);

      if (!parsed.success) {
        throw new BadRequestError(
          'Preference key or value is invalid.',
          parsed.error.format(),
        );
      }

      const { key, value } = parsed.data;
      const prefKey = key as keyof AdopterPreferences;
      const profiles = await this.profileService.getByPreference(
        prefKey,
        value as AdopterPreferences[typeof prefKey],
      );

      const response = this.mapToApiResponse<SharedAdopterProfile[]>({
        data: profiles.map((p) => p.toDTO()),
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = adoptionProfileCreate.safeParse(req.body);

      if (!parsed.success) {
        throw new BadRequestError(
          'Error on body data.',
          parsed.error.format(),
        );
      }

      const profile = await this.profileService.create(parsed.data);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: profile.toDTO(),
        message: 'Profile created with success.',
      });

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  public update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('Profile id invalid.', params.error.format());
      }

      const body = adoptionProfileUpdate.safeParse(req.body);

      if (!body.success) {
        throw new BadRequestError('Invalid update data.', body.error.format());
      }

      const updated = await this.profileService.update(
        params.data.id,
        body.data,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: updated.toDTO(),
        message: 'Profile updated with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public updateByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('User id invalid.', params.error.format());
      }

      const body = adoptionProfileUpdate.safeParse(req.body);

      if (!body.success) {
        throw new BadRequestError('Invalid update data.', body.error.format());
      }

      const updated = await this.profileService.updateByUserId(
        params.data.id,
        body.data,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: updated.toDTO(),
        message: 'Profile updated with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public upsert = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('User id invalid.', params.error.format());
      }

      const body = adoptionProfileUpdate.safeParse(req.body);

      if (!body.success) {
        throw new BadRequestError('Invalid update data.', body.error.format());
      }

      const saved = await this.profileService.upsert(
        params.data.id,
        body.data,
      );
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: saved.toDTO(),
        message: 'Profile saved with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('Profile id invalid.', params.error.format());
      }

      const deleted = await this.profileService.delete(params.data.id);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: deleted.toDTO(),
        message: 'Profile deleted with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public deleteByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = adoptionProfileIdParams.safeParse(req.params);

      if (!params.success) {
        throw new BadRequestError('User id invalid.', params.error.format());
      }

      const deleted = await this.profileService.deleteByUserId(params.data.id);
      const response = this.mapToApiResponse<SharedAdopterProfile>({
        data: deleted.toDTO(),
        message: 'Profile deleted with success.',
      });

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}
