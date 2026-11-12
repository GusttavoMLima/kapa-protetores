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

  it('registra novo adotante via AuthService.register emitindo evento USER_REGISTERED', async () => {
    const createdUser = buildUser();
    const repository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdUser),
    };
    const hasher = { hash: jest.fn().mockResolvedValue('hashed-pass') };
    const jwt = { sign: jest.fn().mockReturnValue('register-token') };
    const eventsService = { createEvent: jest.fn().mockResolvedValue(undefined) };
    const emailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const service = new AuthService(
      repository as unknown as UserRepository,
      hasher as unknown as PasswordHasher,
      jwt as unknown as JwtService,
      eventsService as unknown as import('../../src/services/EventsService').EventsService,
      undefined,
      emailService as unknown as import('../../src/services/EmailService').EmailService,
    );

    const result = await service.register({
      username: 'Teste',
      email: 'teste@kapa.test',
      password: 'password123',
      latitude: -22.8,
      longitude: -47.2,
    });

    expect(result.token).toBe('register-token');
    expect(eventsService.createEvent).toHaveBeenCalledTimes(1);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith({
      userEmail: 'teste@kapa.test',
      username: 'Teste',
    });
  });

  it('autentica via Google em AuthService.loginWithGoogle assinando JWT pelo JwtService', async () => {
    const googleUser = buildUser();
    const repository = {};
    const hasher = {};
    const jwt = { sign: jest.fn().mockReturnValue('google-jwt-token') };
    const userService = {
      authenticateWithGoogle: jest.fn().mockResolvedValue(googleUser),
    };

    const service = new AuthService(
      repository as unknown as UserRepository,
      hasher as unknown as PasswordHasher,
      jwt as unknown as JwtService,
      undefined,
      userService as unknown as import('../../src/services/UserService').UserService,
    );

    const result = await service.loginWithGoogle('google-id-token');
    expect(result.token).toBe('google-jwt-token');
    expect(userService.authenticateWithGoogle).toHaveBeenCalledWith(
      'google-id-token',
    );
  });
});
