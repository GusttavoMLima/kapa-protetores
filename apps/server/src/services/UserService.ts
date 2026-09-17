import { CreateUserInput, UserRole } from '@kapa/shared';
import { Email } from '../domains/Email';
import { UUID } from '../domains/UUID';
import { AppError } from '../errors';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models';
import { Url } from '../domains/Url';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

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

    const user = new User();
    user.setUsername(input.username);
    user.setEmail(input.email);
    user.setAvatar(input.avatar);
    user.setPassword(input.password);
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

  public async updatePassword(id: string, password: string) {
    const safeId = UUID.create(id);
    
  }
}
