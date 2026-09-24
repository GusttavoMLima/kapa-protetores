import { z } from 'zod';

export const signInSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const registerSchema = z.object({
  username: z
    .string({ required_error: 'Nome de usuário é obrigatório' })
    .trim()
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(50, 'Nome de usuário muito longo'),
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .max(128, 'A senha deve ter no máximo 128 caracteres'),
  avatar: z
    .union([z.string().trim().url('URL do avatar inválida'), z.literal('')])
    .nullish()
    .transform((val) => (val === '' ? null : val)),
  latitude: z
    .number()
    .min(-90, 'Latitude inválida')
    .max(90, 'Latitude inválida')
    .nullish(),
  longitude: z
    .number()
    .min(-180, 'Longitude inválida')
    .max(180, 'Longitude inválida')
    .nullish(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const userIdParams = z.object({
  id: z.string(),
});

export type UserIdParams = z.infer<typeof userIdParams>;

export const updateUserPasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Senha atual é obrigatória' })
    .min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string({ required_error: 'Nova senha é obrigatória' })
    .min(6, 'A nova senha deve ter no mínimo 6 caracteres')
    .max(128, 'A nova senha deve ter no máximo 128 caracteres'),
});

export type UpdateUserPassword = z.infer<typeof updateUserPasswordSchema>;
export const updatePasswordSchema = updateUserPasswordSchema;
export type UpdatePasswordInput = UpdateUserPassword;

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(50, 'Nome de usuário muito longo')
    .optional(),
  avatar: z
    .union([z.string().trim().url('URL do avatar inválida'), z.literal('')])
    .nullish()
    .transform((val) => (val === '' ? null : val)),
  latitude: z
    .number()
    .min(-90, 'Latitude inválida')
    .max(90, 'Latitude inválida')
    .nullish(),
  longitude: z
    .number()
    .min(-180, 'Longitude inválida')
    .max(180, 'Longitude inválida')
    .nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['adopter', 'protector', 'admin', 'volunteer'], {
    required_error: 'O papel (role) do usuário é obrigatório',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;


