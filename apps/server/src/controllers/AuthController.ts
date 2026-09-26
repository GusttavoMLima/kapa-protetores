import { Request, Response, NextFunction } from 'express';
import { googleAuthSchema } from '../schemas/auth.schema';
import { UserService } from '../services/UserService';
import { Jwt } from '../utils/Jwt';
import { AppError } from '../errors/AppError';

export class AuthController {
  constructor(private readonly userService: UserService) {}

  public googleSignIn = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parseResult = googleAuthSchema.safeParse(req.body);

      if (!parseResult.success) {
        throw AppError.badRequest(
          'idToken é obrigatório para login com Google',
          parseResult.error.format(),
        );
      }

      const { idToken } = parseResult.data;
      const user = await this.userService.authenticateWithGoogle(idToken);
      const token = Jwt.generateUserToken(user);

      res.status(200).json({
        success: true,
        message: 'Autenticado com sucesso',
        data: {
          token,
          user: user.toDTO(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public signIn = this.googleSignIn;
}
