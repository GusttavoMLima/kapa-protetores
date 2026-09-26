import { DEFAULT_USER_ADOPTER_RULES, type AuthResponse } from '@kapa/shared';
import type { UserRole } from '@kapa/shared';
import { AppError } from '../errors';
import { Email } from '../domains/Email';
import { User } from '../models';
import { UserRepository } from '../repositories/UserRepository';
import { PasswordHasher } from '../security/PasswordHasher';
import { JwtService } from '../security/JwtService';

export class AuthService {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  public async register(input: {
    username: string;
    email: string;
    password: string;
    role: Extract<UserRole, 'adopter'>;
  }): Promise<AuthResponse> {
    const email = Email.create(input.email);
    if (await this.repository.findByEmail(email)) {
      throw AppError.conflict('Já existe uma conta com este e-mail.');
    }

    const user = new User();
    user.setUsername(input.username);
    user.setEmail(email);
    user.setRole('adopter');
    user.setRules(Array.from(DEFAULT_USER_ADOPTER_RULES));
    user.setPassword(await this.passwordHasher.hash(input.password));
    const created = await this.repository.create(user);
    return this.createResponse(created);
  }

  public async createUserByAdmin(input: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const email = Email.create(input.email);
    if (await this.repository.findByEmail(email)) {
      throw AppError.conflict('Já existe uma conta com este e-mail.');
    }

    const user = new User();
    user.setUsername(input.username);
    user.setEmail(email);
    user.setRole(input.role);
    user.setRules(input.role === 'admin' ? ['admin:*'] : Array.from(DEFAULT_USER_ADOPTER_RULES));
    user.setPassword(await this.passwordHasher.hash(input.password));
    return (await this.repository.create(user)).toDTO();
  }

  public async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const user = await this.repository.findByEmail(Email.create(input.email));
    const storedHash = user?.getPassword();
    if (!user || !storedHash || !(await this.passwordHasher.verify(input.password, storedHash))) {
      throw AppError.unauthorized('E-mail ou senha inválidos.');
    }
    return this.createResponse(user);
  }

  public async getProfile(userId: string) {
    const user = await this.repository.findByIdValue(userId);
    if (!user) throw AppError.unauthorized();
    return user.toDTO();
  }

  private createResponse(user: User): AuthResponse {
    const dto = user.toDTO();
    return {
      user: dto,
      token: this.jwtService.sign({ sub: dto.id, email: dto.email, role: dto.role, rules: Array.from(dto.rules), username: dto.username }),
    };
  }
}
