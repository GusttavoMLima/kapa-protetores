import { UserRole, User as SharedUser } from '@kapa/shared';
import { Email } from '../domains/Email';
import { Url } from '../domains/Url';
import { UUID } from '../domains/UUID';
import { IUser } from '../interfaces/IUser';
import { ValidationError } from '../errors';

export class User implements IUser {
  private id!: UUID;
  private username!: string;
  private email!: Email;
  private avatar?: Url | null = null;
  private role: UserRole = 'adopter';
  private latitude?: number | null = null;
  private longitude?: number | null = null;
  private rules: Set<string> = new Set();
  private password?: string | null = null;
  private createdAt!: string;

  constructor() {}

  public getId(): UUID {
    return this.id;
  }

  public getUsername(): string {
    return this.username;
  }

  public getEmail(): Email {
    return this.email;
  }

  public getAvatar(): Url | null | undefined {
    return this.avatar;
  }

  public getRole(): UserRole {
    return this.role;
  }

  public getLatitude(): number | null | undefined {
    return this.latitude;
  }

  public getLongitude(): number | null | undefined {
    return this.longitude;
  }

  public getRules(): Set<string> {
    return this.rules;
  }

  public getPassword(): string | null | undefined {
    return this.password;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public setId(id: string | UUID): void {
    if (this.id) {
      return;
    }

    this.id = id instanceof UUID ? id : UUID.create(id);
  }

  public setUsername(username: string): void {
    if (username.length < 3) {
      throw new ValidationError('Username must contain at least 3 characters');
    }

    this.username = username;
  }

  public setEmail(email: string | Email): void {
    this.email = email instanceof Email ? email : Email.create(email);
  }

  public setAvatar(url: string | Url | null | undefined): void {
    if (!url) {
      this.avatar = null;
      return;
    }
    this.avatar = url instanceof Url ? url : Url.create(url);
  }

  public setRole(role: UserRole): void {
    const oldRole = this.role;
    this.role = role;

    const updatedRules = Array.from(this.rules).map((rule) =>
      rule.replace(oldRole, role),
    );

    this.rules = new Set(updatedRules);
  }

  public setLatitude(latitude: number | null | undefined): void {
    this.latitude = latitude;
  }

  public setLongitude(longitude: number | null | undefined): void {
    this.longitude = longitude;
  }

  public setRules(rules: string[]): void {
    if (rules.length <= 0) {
      return;
    }

    rules.forEach((rule) => this.rules.add(rule));
  }

  public setPassword(password: string | null | undefined): void {
    this.password = password;
  }

  public setCreatedAt(date: string): void {
    if (this.createdAt) {
      return;
    }

    this.createdAt = new Date(date).toISOString();
  }

  public toDTO(): SharedUser {
    return {
      id: this.id ? this.id.getValue() : '',
      username: this.username,
      email: this.email ? this.email.getValue() : '',
      role: this.role,
      avatar: this.avatar ? this.avatar.getValue() : null,
      latitude: this.latitude ?? null,
      longitude: this.longitude ?? null,
      rules: Array.from(this.rules),
      createdAt: this.createdAt,
    };
  }

  public toJSON(): SharedUser {
    return this.toDTO();
  }
}
