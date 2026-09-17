export type UserRole = 'adopter' | 'protector' | 'admin' | 'volunteer';

export interface User {
  id: string;
  role: UserRole;
  rules: string[] | Set<string>;
  username: string;
  email: string;
  latitude?: number | null;
  longitude?: number | null;
  avatar?: string | null;
  createdAt: string;
}

export type CreateUserInput = {
  username: string;
  email: string;
  password?: string;
  role?: UserRole;
  rules?: string[];
  avatar?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email'>>;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
}
