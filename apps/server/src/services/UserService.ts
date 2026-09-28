import {
  CreateUserInput,
  UserRole,
  UserWithRelationsCount,
} from '@kapa/shared';
import { OAuth2Client } from 'google-auth-library';
import { AppError, ServiceError } from '../errors';
import { User } from '../models';
import { UserRepository } from '../repositories/UserRepository';
import { Email } from '../domains/Email';
import { UUID } from '../domains/UUID';
import { Url } from '../domains/Url';
import { DEFAULT_USER_ADOPTER_RULES } from '@kapa/shared';
import { PasswordHasher } from '../security/PasswordHasher';

const googleClient = new OAuth2Client();

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  public async authenticateWithGoogle(idToken: string) {
    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter((id): id is string => Boolean(id));

    if (audiences.length === 0) throw AppError.unauthorized('Login Google indisponível.');

    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    const isJwt = idToken.split('.').length === 3;

    if (isJwt) {
      let ticket;

      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: audiences.length > 0 ? audiences : undefined,
        });
      } catch {
        throw AppError.unauthorized('Token do Google inválido ou expirado');
      }

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.email_verified) {
        throw AppError.unauthorized('Email do Google não verificado');
      }

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      try {
        const tokenInfo = await googleClient.getTokenInfo(idToken);
        if (audiences.length > 0 && !audiences.includes(tokenInfo.aud)) {
          throw AppError.unauthorized('Audience do token Google inválida');
        }

        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${idToken}` },
          },
        );

        if (!userInfoResponse.ok) {
          throw AppError.unauthorized('Token do Google inválido ou expirado');
        }

        const userInfo = (await userInfoResponse.json()) as {
          email?: string;
          email_verified?: boolean;
          name?: string;
          picture?: string;
        };

        if (!userInfo.email || !userInfo.email_verified) {
          throw AppError.unauthorized('Email do Google não verificado');
        }

        email = userInfo.email;
        name = userInfo.name;
        picture = userInfo.picture;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw AppError.unauthorized('Token do Google inválido ou expirado');
      }
    }

    if (!email) {
      throw new ServiceError('Email não encontrado no payload do Google.');
    }

    const safeEmail = Email.create(email);
    let user = await this.repository.findByEmail(safeEmail);

    if (user) {
      if (picture && user.getAvatar()?.toString() !== picture) {
        user = await this.updateAvatar(user.getId().toString(), picture);
      }
      return user;
    }

    const username = name || email.split('@')[0];

    user = await this.create({
      username,
      email,
      avatar: picture ?? undefined,
      role: 'adopter',
      rules: Array.from(DEFAULT_USER_ADOPTER_RULES),
    });

    return user;
  }

  public async getByIdWithRelationsCount(
    id: string,
  ): Promise<UserWithRelationsCount> {
    const safeId = UUID.create(id);

    const user = await this.repository.findByIdCountingRelations(safeId);

    if (!user) {
      throw AppError.notFound(`User with ID: ${id} not found`);
    }

    return user;
  }

  public async countAll(): Promise<number> {
    return this.repository.countAll();
  }

  public async getAll() {
    return this.repository.findAll();
  }

  public async getById(id: string) {
    const safeId = UUID.create(id);

    const user = await this.repository.findById(safeId);

    if (!user) {
      throw AppError.notFound(`User with ID: ${id} not found`);
    }

    return user;
  }

  public async getByEmail(email: string) {
    const safeEmail = Email.create(email);

    const user = await this.repository.findByEmail(safeEmail);

    if (!user) {
      throw AppError.notFound(`User not found by email: ${email}`);
    }

    return user;
  }

  public async getAllByRole(role: UserRole) {
    return this.repository.findAllByRole(role);
  }

  public async getAllByRules(rules: string[]) {
    return this.repository.findAllByHasRules(rules);
  }

  public async getAllByUsername(username: string) {
    return this.repository.findAllByHasUsername(username);
  }

  public async getAllByCreatedAt(createdAt: Date) {
    return this.repository.findAllByCreatedAt(createdAt);
  }

  public async create(input: CreateUserInput) {
    if (!input || typeof input !== 'object') {
      throw AppError.badRequest('User data invalid.');
    }

    if (!input.email) {
      throw AppError.badRequest('Email is required.');
    }

    if (!input.username) {
      throw AppError.badRequest('Username is required.');
    }

    const hasedPassword = input.password
      ? await new PasswordHasher().hash(input.password)
      : undefined;

    const user = new User();
    user.setUsername(input.username);
    user.setEmail(input.email);
    user.setAvatar(input.avatar);
    user.setPassword(hasedPassword);
    if (input.role) user.setRole(input.role satisfies UserRole);
    if (input.rules) user.setRules(input.rules);
    user.setLatitude(input.latitude);
    user.setLongitude(input.longitude);

    return this.repository.create(user);
  }

  public async updateAvatar(id: string, url: string) {
    const safeId = UUID.create(id);
    const safeUrl = Url.create(url);
    const user = await this.repository.updateAvatar(safeId, safeUrl);

    if (!user) {
      throw AppError.notFound(`User Could not updated.`);
    }

    return user;
  }

  public async updatePassword(
    id: string,
    currentPasswordPlainText: string,
    newPasswordPlainText: string,
  ): Promise<void> {
    const safeId = UUID.create(id);

    const user = await this.repository.findById(safeId);

    if (!user) {
      throw AppError.notFound(`Usuário não encontrado`);
    }

    const storedHash = user.getPassword();

    if (!storedHash) {
      throw AppError.badRequest(
        'Esta conta foi criada com o Google e não possui senha definida.',
      );
    }

    const isCurrentPasswordValid = await new PasswordHasher().verify(
      currentPasswordPlainText,
      storedHash,
    );

    if (!isCurrentPasswordValid) {
      throw AppError.unauthorized('Senha atual incorreta');
    }

    if (await new PasswordHasher().verify(newPasswordPlainText, storedHash)) {
      throw AppError.badRequest('A nova senha deve ser diferente da senha atual');
    }

    const newHashedPassword = await new PasswordHasher().hash(newPasswordPlainText);
    const updatedUser = await this.repository.updatePassword(safeId, newHashedPassword);

    if (!updatedUser) {
      throw AppError.internal('Erro ao atualizar a senha do usuário');
    }
  }

  public async updateProfile(
    id: string,
    input: {
      username?: string;
      avatar?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    },
  ): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw AppError.notFound(`Usuário não encontrado`);
    }

    if (input.username !== undefined) {
      user.setUsername(input.username);
    }

    if (input.avatar !== undefined) {
      user.setAvatar(input.avatar);
    }

    if (input.latitude !== undefined) {
      user.setLatitude(input.latitude);
    }

    if (input.longitude !== undefined) {
      user.setLongitude(input.longitude);
    }

    const updatedUser = await this.repository.update(user);

    if (!updatedUser) {
      throw AppError.internal('Erro ao atualizar dados do usuário');
    }

    return updatedUser;
  }

  public async updateRole(id: string, role: UserRole): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw AppError.notFound(`Usuário não encontrado`);
    }

    user.setRole(role);
    const updatedUser = await this.repository.update(user);

    if (!updatedUser) {
      throw AppError.internal('Erro ao atualizar papel do usuário');
    }

    return updatedUser;
  }

  public async deleteById(id: string): Promise<User> {
    const safeId = UUID.create(id);
    const user = await this.repository.findById(safeId);

    if (!user) {
      throw AppError.notFound(`Usuário não encontrado`);
    }

    return this.repository.deleteById(safeId);
  }
}
