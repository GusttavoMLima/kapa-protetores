import type { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import {
  registerSchema,
  signInSchema,
  userIdParams,
  updateUserPasswordSchema,
  updateProfileSchema,
  updateRoleSchema,
} from '../schemas/user.schema';
import {
  DEFAULT_USER_ADOPTER_RULES,
  UserRole,
  type ApiResponse,
  type User as SharedUser,
  type UserWithRelationsCount,
  type UserWithCountAndDataOfRelations,
} from '@kapa/shared';
import { Jwt } from '../utils/Jwt';
import { PasswordHasher } from '../security/PasswordHasher';
import { AppError } from '../errors/AppError';

export class UserController {
  constructor(private readonly userService: UserService) {}

  public countAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.userService.countAll();
      const response: ApiResponse<number> = {
        success: true,
        message: 'Success',
        data,
      };
      return res.status(200).json(response);
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
      const role = req.query?.role as UserRole | undefined;
      const users = role
        ? await this.userService.getAllByRole(role)
        : await this.userService.getAll();

      const response: ApiResponse<SharedUser[]> = {
        success: true,
        message: 'Success',
        data: users.map((user) => user.toDTO()),
      };

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
      const params = userIdParams.safeParse(req.params);

      if (!params.success) {
        throw AppError.badRequest(
          'ID de usuário inválido',
          params.error.format(),
        );
      }

      const userId = params.data.id;
      const user = await this.userService.getById(userId);

      const response: ApiResponse<SharedUser> = {
        success: true,
        message: 'User found with success',
        data: user.toDTO(),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        const errorResponse: ApiResponse<null> = {
          success: false,
          data: null,
          message: 'Unauthorized',
        };
        return res.status(401).json(errorResponse);
      }

      const user = req.user;
      let data;

      try {
        data = await this.userService.getByIdWithRelationsData(user.sub);
      } catch {
        throw AppError.notFound('Usuário não foi encontrado');
      }

      const response: ApiResponse<UserWithCountAndDataOfRelations> = {
        success: true,
        data,
        message: 'Success',
      };

      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public signIn = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsedBody = signInSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw AppError.badRequest(
          'Dados de login inválidos',
          parsedBody.error.format(),
        );
      }

      const { email, password } = parsedBody.data;

      let user;
      try {
        user = await this.userService.getByEmail(email);
      } catch {
        throw AppError.unauthorized('E-mail ou senha incorretos');
      }

      const userPassword = user.getPassword();

      if (!userPassword) {
        throw AppError.badRequest(
          'Esta conta foi criada com o Google. Por favor, entre usando o Google.',
        );
      }

      if (!(await new PasswordHasher().verify(password, userPassword))) {
        throw AppError.unauthorized('E-mail ou senha incorretos');
      }

      const token = Jwt.generateUserToken(user);

      const response: ApiResponse<{ token: string; user: SharedUser }> = {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: user.toDTO(),
        },
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsedBody = registerSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw AppError.badRequest(
          'Dados de cadastro inválidos',
          parsedBody.error.format(),
        );
      }

      const { email, password, username, avatar, latitude, longitude } =
        parsedBody.data;

      let existingUser;
      try {
        existingUser = await this.userService.getByEmail(email);
      } catch {
        existingUser = null;
      }

      if (existingUser) {
        throw AppError.conflict(
          'Já existe um usuário cadastrado com este e-mail',
        );
      }

      const user = await this.userService.create({
        email,
        username,
        avatar: avatar ?? undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        password,
        role: 'adopter',
        rules: Array.from(DEFAULT_USER_ADOPTER_RULES),
      });

      const token = Jwt.generateUserToken(user);

      const response: ApiResponse<{ token: string; user: SharedUser }> = {
        success: true,
        message: 'Usuário cadastrado com sucesso',
        data: {
          token,
          user: user.toDTO(),
        },
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  public userInfo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        throw AppError.unauthorized('Você não está autenticado');
      }

      const userInfo = await this.userService.getByIdWithRelationsCount(
        user.sub,
      );

      const response: ApiResponse<UserWithRelationsCount> = {
        success: true,
        message: 'Informações do usuário obtidas com sucesso',
        data: userInfo,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public updatePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        throw AppError.unauthorized('Você não está autenticado');
      }

      const parsedBody = updateUserPasswordSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw AppError.badRequest(
          'Dados inválidos para alteração de senha',
          parsedBody.error.format(),
        );
      }

      const { currentPassword, newPassword } = parsedBody.data;

      await this.userService.updatePassword(
        user.sub,
        currentPassword,
        newPassword,
      );

      const response: ApiResponse<null> = {
        success: true,
        message: 'Senha atualizada com sucesso',
        data: null,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        throw AppError.unauthorized('Você não está autenticado');
      }

      const parsedBody = updateProfileSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw AppError.badRequest(
          'Dados inválidos para atualização de perfil',
          parsedBody.error.format(),
        );
      }

      const updatedUser = await this.userService.updateProfile(
        user.sub,
        parsedBody.data,
      );

      const response: ApiResponse<SharedUser> = {
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: updatedUser.toDTO(),
      };

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
      const user = req.user;

      if (!user) {
        throw AppError.unauthorized('Você não está autenticado');
      }

      await this.userService.deleteById(user.sub);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Conta excluída com sucesso',
        data: null,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public updateRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = userIdParams.safeParse(req.params);

      if (!params.success) {
        throw AppError.badRequest(
          'ID de usuário inválido',
          params.error.format(),
        );
      }

      const parsedBody = updateRoleSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw AppError.badRequest(
          'Papel (role) de usuário inválido',
          parsedBody.error.format(),
        );
      }

      const updatedUser = await this.userService.updateRole(
        params.data.id,
        parsedBody.data.role,
      );

      const response: ApiResponse<SharedUser> = {
        success: true,
        message: 'Papel do usuário atualizado com sucesso',
        data: updatedUser.toDTO(),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  public deleteById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const params = userIdParams.safeParse(req.params);

      if (!params.success) {
        throw AppError.badRequest(
          'ID de usuário inválido',
          params.error.format(),
        );
      }

      await this.userService.deleteById(params.data.id);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Usuário excluído com sucesso',
        data: null,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}
