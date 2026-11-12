import { UserRole, User as SharedUser } from '@kapa/shared';

import { Email } from '../domains/Email';
import { Url } from '../domains/Url';
import { UUID } from '../domains/UUID';

export interface IUser {
  getBirthDate(): string | null;
  getPhone(): string | null;
  setBirthDate(value: string | null | undefined): void;
  setPhone(value: string | null | undefined): void;
  getId(): UUID;
  getUsername(): string;
  getEmail(): Email;
  getAvatar(): Url | null | undefined;
  getRole(): UserRole;
  getLatitude(): number | null | undefined;
  getLongitude(): number | null | undefined;
  getRules(): Set<string>;
  getPassword(): string | null | undefined;
  getCreatedAt(): string;
  getDeactivatedAt(): string | null | undefined;
  isActive(): boolean;
  setDeactivatedAt(date: Date | string | null): void;

  setId(id: string | UUID): void;
  setUsername(username: string): void;
  setEmail(email: string | Email): void;
  setAvatar(url: string | Url | null | undefined): void;
  setRole(role: UserRole): void;
  setLatitude(latitude: number | null | undefined): void;
  setLongitude(longitude: number | null | undefined): void;
  setRules(rules: string[]): void;
  setPassword(password: string | null | undefined): void;
  setCreatedAt(date: string): void;
  toDTO(): SharedUser;
}
