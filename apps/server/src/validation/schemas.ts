import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.literal('adopter').default('adopter'),
}).strict();

export const animalManagementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(120).optional(),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']).optional(),
  sort: z.enum(['recent', 'name']).default('recent'),
}).strict();

export const animalIdSchema = z.string().cuid();

export const adminCreateUserSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.enum(['adopter', 'protector', 'admin', 'volunteer']),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

export const doseRecordsSchema = z.array(z.discriminatedUnion('status', [
  z.object({ status: z.literal('nao') }).strict(),
  z.object({
    status: z.literal('sim'),
    data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).refine((value) => {
      const [day, month, year] = value.split('/').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return year >= 1900 && date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }, 'Data de aplicação inválida.'),
  }).strict(),
])).max(100);

export const createAnimalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  breed: z.string().trim().max(120),
  species: z.enum(['dog', 'cat', 'other']),
  gender: z.enum(['male', 'female']),
  weightKg: z.number().min(0).max(500),
  age: z.number().int().min(0).max(100),
  ageStage: z.number().int().min(0).max(10),
  size: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  kidFriendly: z.number().int().min(0).max(5),
  noiseLevel: z.number().int().min(0).max(5),
  apartmentFriendly: z.boolean(),
  otherPetFriendly: z.boolean(),
  healthCondition: z.enum(['healthy', 'injured', 'debilitated']),
  castrated: z.enum(['yes', 'no', 'unknown']),
  vaccinated: z.boolean(),
  dewormed: z.enum(['yes', 'no', 'unknown']),
  v10Doses: doseRecordsSchema.optional(),
  vacinaRaivaDoses: doseRecordsSchema.optional(),
  vermifugoDoses: doseRecordsSchema.optional(),
  rescuedAt: z.string().datetime(),
  place: z.string().trim().max(240),
  mood: z.string().trim().min(1).max(120),
  observations: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']),
}).strict();

export const updateAnimalSchema = createAnimalSchema.partial()
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo.');
