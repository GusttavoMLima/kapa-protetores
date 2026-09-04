import { IUser } from '../interfaces/UserInterface';

export class User implements IUser {
  public readonly id: string;
  public email: string;
  public name?: string;
  public role?: string;
  public readonly createdAt: string;

  constructor(data: {
    id?: string;
    email: string;
    name?: string;
    role?: string;
    createdAt?: string;
  }) {
    this.id =
      data.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}
