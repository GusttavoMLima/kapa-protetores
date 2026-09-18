import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.authService.register(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.authService.login(req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw AppError.unauthorized();
      const data = await this.authService.getProfile(req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.authService.createUserByAdmin(req.body);
      res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso.', data });
    } catch (error) { next(error); }
  };
}
