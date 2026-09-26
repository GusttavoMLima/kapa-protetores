import { UserRole, UserWithRelationsCount } from '@kapa/shared';
import { Email } from '../domains/Email';
import { Url } from '../domains/Url';
import { UUID } from '../domains/UUID';
import { User } from '../models';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  countAll(): Promise<number>;
  findById(id: UUID): Promise<User | null>;
  findByIdCountingRelations(id: UUID): Promise<UserWithRelationsCount | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAllByRole(role: UserRole): Promise<User[]>;

  // has = contains
  findAllByHasRules(rules: string[]): Promise<User[]>;
  findAllByHasUsername(username: string): Promise<User[]>;
  findAllByCreatedAt(deadLine: Date): Promise<User[]>;

  create(user: User): Promise<User>;

  updateAvatar(id: UUID, url: Url): Promise<User>;
  updatePassword(id: UUID, password: string): Promise<User>;
  updatedLatAndLong(id: UUID, lat: number, long: number): Promise<User>;
  update(user: User): Promise<User>;

  deleteById(id: UUID): Promise<User>;
}
