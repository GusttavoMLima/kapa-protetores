import { ForbiddenError, UnauthorizedError } from '../../src/errors';
import { User } from '../../src/models/User';
import type { UserRepository } from '../../src/repositories/UserRepository';
import type { JwtService } from '../../src/security/JwtService';
import type { PasswordHasher } from '../../src/security/PasswordHasher';
import { AuthService } from '../../src/services/AuthService';

function buildService(user: User, passwordMatches: boolean) {
  const repository = { findByEmail: jest.fn().mockResolvedValue(user) };
  const hasher = { verify: jest.fn().mockResolvedValue(passwordMatches) };
  const jwt = { sign: jest.fn().mockReturnValue('token') };

  return new AuthService(
    repository as unknown as UserRepository,
    hasher as unknown as PasswordHasher,
    jwt as unknown as JwtService,
  );
}

function buildUser(): User {
  const user = new User();
  user.setId('123e4567-e89b-42d3-a456-426614174000');
  user.setUsername('Teste');
  user.setEmail('teste@kapa.test');
  user.setPassword('hash');
  user.setCreatedAt(new Date().toISOString());
  return user;
}

describe('AuthService.login com conta desativada', () => {
  it('bloqueia o login de uma conta desativada com a senha correta', async () => {
    const user = buildUser();
    user.setDeactivatedAt(new Date());

    await expect(
      buildService(user, true).login({ email: 'teste@kapa.test', password: 'qualquer' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('não revela o estado da conta quando a senha está errada', async () => {
    const user = buildUser();
    user.setDeactivatedAt(new Date());

    await expect(
      buildService(user, false).login({ email: 'teste@kapa.test', password: 'errada' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('permite o login de uma conta ativa', async () => {
    const response = await buildService(buildUser(), true).login({
      email: 'teste@kapa.test',
      password: 'correta',
    });

    expect(response.token).toBe('token');
  });

  it('envia e-mail de boas-vindas ao registrar novo adotante via AuthService.register', async () => {
    const createdUser = buildUser();
    const repository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdUser),
    };
    const hasher = { hash: jest.fn().mockResolvedValue('hashed-pass') };
    const jwt = { sign: jest.fn().mockReturnValue('register-token') };
    const emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const service = new AuthService(
      repository as unknown as UserRepository,
      hasher as unknown as PasswordHasher,
      jwt as unknown as JwtService,
      emailService as unknown as import('../../src/services/EmailService').EmailService,
    );

    const result = await service.register({
      birthDate: '1995-05-20',
      phone: '19999998888',
      username: 'Teste',
      email: 'teste@kapa.test',
      password: 'password123456',
      role: 'adopter',
    });

    expect(result.token).toBe('register-token');
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith({
      userEmail: 'teste@kapa.test',
      username: 'Teste',
    });
  });
});
