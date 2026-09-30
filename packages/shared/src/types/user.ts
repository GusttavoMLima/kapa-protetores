import type { Genders } from './animal';
import type { SystemEvent } from './event';

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

type UserRelationCounts = {
  counts: {
    adoptions: number;
    events: number;
    favorites: number;
  };
};

export interface UserWithRelationsCount extends User, UserRelationCounts {}

export interface FavoriteAnimalSummary {
  id: string;
  name: string;
  gender: Genders;
  age: number;
  photo?: string | null;
}

export interface UserFavoriteItem {
  userId: string;
  animalId: string;
  createdAt: string;
  animal?: FavoriteAnimalSummary;
}

export interface UserWithCountAndDataOfRelations
  extends Pick<User, 'id' | 'latitude' | 'longitude'>, UserRelationCounts {
  favorites: UserFavoriteItem[];
  events: SystemEvent[];
}

export type UserWithCundAndDataOfRelations = UserWithCountAndDataOfRelations;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
}

export interface UserJwt {
  sub: string;
  role: UserRole;
  rules: string[];
  username: string;
  email: string;
}

export enum UserRoleEnum {
  'adopter' = 'Adotador',
  'protector' = 'Protetor',
  'admin' = 'Administrador',
  'volunteer' = 'Voluntário',
}
