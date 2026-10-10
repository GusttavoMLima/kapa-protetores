import { Request, Response, NextFunction } from 'express';
import { googleAuthSchema } from '../schemas/auth.schema';
import { UserService } from '../services/UserService';
import { Jwt } from '../utils/Jwt';
import { BadRequestError } from '../errors';
import type { ApiResponse, User as SharedUser } from '@kapa/shared';

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
        throw new BadRequestError(
          'idToken é obrigatório para login com Google',
          parseResult.error.format(),
        );
      }

      const { idToken } = parseResult.data;
      const user = await this.userService.authenticateWithGoogle(idToken);
      const token = Jwt.generateUserToken(user);

      const response: ApiResponse<{ token: string; user: SharedUser }> = {
        success: true,
        message: 'Autenticado com sucesso',
        data: {
          token,
          user: user.toDTO(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public signIn = this.googleSignIn;
}
