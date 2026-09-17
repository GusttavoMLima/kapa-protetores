import type { User } from './user';

export interface AuthCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RegisterInput {
  username: string;
  email: string;
  password?: string;
  role?: string;
}
