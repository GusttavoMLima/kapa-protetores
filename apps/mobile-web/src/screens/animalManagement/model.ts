import { z } from 'zod';
import type { Animal, AnimalStatus, Species, UpdateAnimalInput } from '@kapa/shared';
import { parseAnimalDate } from '@/utils/animalDate';

const doseRecordsSchema = z.array(z.object({
  status: z.enum(['sim', 'nao']),
  data: z.string().trim().optional(),
}).transform(({ status, data }, context) => {
  if (status === 'nao') return { status };
  if (data && parseAnimalDate(data)) return { status, data };
  context.addIssue({ code: z.ZodIssueCode.custom, path: ['data'], message: 'Data de aplicação inválida.' });
  return z.NEVER;
})).max(100);

export const statusLabels: Record<AnimalStatus, string> = {
  rescued: 'Resgatados', treating: 'Em tratamento', available: 'Disponíveis', adopted: 'Adotados',
};
export const statusLabel: Record<AnimalStatus, string> = {
  rescued: 'Resgatado', treating: 'Em tratamento', available: 'Disponível', adopted: 'Adotado',
};
export const speciesLabels: Record<Species, string> = { dog: 'Cão', cat: 'Gato', other: 'Outro' };
export const speciesOptions = [
  { value: 'dog', label: 'Cão' }, { value: 'cat', label: 'Gato' }, { value: 'other', label: 'Outro' },
] as const;
export const statusOptions = [
  { value: 'rescued', label: 'Resgatado' }, { value: 'treating', label: 'Em tratamento' },
  { value: 'available', label: 'Disponível' }, { value: 'adopted', label: 'Adotado' },
] as const;
export const triageOptions = [
  { value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }, { value: 'unknown', label: 'Não informado' },
] as const;

export const managedAnimalSchema = z.object({
  id: z.string().cuid(), name: z.string(), breed: z.string(), species: z.enum(['dog', 'cat', 'other']),
  gender: z.enum(['male', 'female']), age: z.number(), ageStage: z.number(), weightKg: z.number(),
  size: z.number(), energyLevel: z.number(), kidFriendly: z.number(), noiseLevel: z.number(),
  apartmentFriendly: z.boolean(), otherPetFriendly: z.boolean(),
  healthCondition: z.enum(['healthy', 'injured', 'debilitated']),
  castrated: z.enum(['yes', 'no', 'unknown']), vaccinated: z.boolean(), dewormed: z.enum(['yes', 'no', 'unknown']),
  v10Doses: doseRecordsSchema.optional(), vacinaRaivaDoses: doseRecordsSchema.optional(),
  vermifugoDoses: doseRecordsSchema.optional(),
  medicationNotes: z.string().nullable().optional(),
  rescuedAt: z.string().datetime(), place: z.string(), mood: z.string(), observations: z.string().nullable().optional(),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']), createdAt: z.string().datetime(),
  photos: z.array(z.object({ id: z.string(), photoUrl: z.string().url().refine((url) => /^https?:\/\//.test(url)), uploadedAt: z.string().datetime() })).optional(),
});
export const managementPageSchema = z.object({
  items: z.array(managedAnimalSchema), total: z.number().int().nonnegative(), page: z.number().int().positive(),
  pageSize: z.number().int().positive(), counts: z.object({ rescued: z.number(), treating: z.number(), available: z.number(), adopted: z.number() }),
});

const numberText = (max: number, integer = false) => z.string().trim().min(1, 'Informe um valor.')
  .refine((value) => /^\d+(?:[.,]\d+)?$/.test(value), 'Informe um número válido.')
  .transform((value) => Number(value.replace(',', '.')))
  .pipe(integer ? z.number().int('Use um número inteiro.').min(0).max(max) : z.number().min(0).max(max));

export const animalEditorSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(120), breed: z.string().trim().max(120),
  species: z.enum(['dog', 'cat', 'other']), gender: z.enum(['male', 'female']),
  age: numberText(100, true), weightKg: numberText(500), size: z.number().int().min(1).max(5),
  status: z.enum(['rescued', 'treating', 'available', 'adopted']),
  healthCondition: z.enum(['healthy', 'injured', 'debilitated']),
  castrated: z.enum(['yes', 'no', 'unknown']), dewormed: z.enum(['yes', 'no', 'unknown']), vaccinated: z.boolean(),
  v10Doses: doseRecordsSchema, vacinaRaivaDoses: doseRecordsSchema, vermifugoDoses: doseRecordsSchema,
  rescuedAt: z.string().trim().transform((value, context) => {
    const date = parseAnimalDate(value);
    if (date) return date.toISOString();
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe uma data de resgate válida (DD/MM/AAAA).' });
    return z.NEVER;
  }),
  energyLevel: z.number().int().min(1).max(5), kidFriendly: z.number().int().min(0).max(5),
  noiseLevel: z.number().int().min(0).max(5).optional(),
  apartmentFriendly: z.boolean(), otherPetFriendly: z.boolean(),
  mood: z.string().trim().min(1, 'Informe o temperamento.').max(120),
  place: z.string().trim().max(240), observations: z.string().trim().max(4000),
  medicationNotes: z.string().trim().max(2000),
});
export type AnimalEditorValues = z.input<typeof animalEditorSchema>;
export function editorValues(animal: Animal): AnimalEditorValues {
  return { name: animal.name, breed: animal.breed, species: animal.species, gender: animal.gender,
    age: String(animal.age), weightKg: String(animal.weightKg), size: animal.size, status: animal.status,
    healthCondition: animal.healthCondition, castrated: animal.castrated, dewormed: animal.dewormed,
    medicationNotes: animal.medicationNotes ?? '',
    v10Doses: animal.v10Doses ?? [],
    vacinaRaivaDoses: animal.vacinaRaivaDoses ?? [],
    vermifugoDoses: animal.vermifugoDoses ?? [],
    rescuedAt: animal.rescuedAt.slice(0, 10).split('-').reverse().join('/'),
    energyLevel: animal.energyLevel, kidFriendly: animal.kidFriendly,
    noiseLevel: animal.noiseLevel,
    apartmentFriendly: animal.apartmentFriendly, otherPetFriendly: animal.otherPetFriendly,
    vaccinated: animal.vaccinated, mood: animal.mood, place: animal.place, observations: animal.observations ?? '' };
}

export function animalEditorUpdate(animal: Animal, values: z.output<typeof animalEditorSchema>): UpdateAnimalInput {
  const initial = editorValues(animal);
  const { v10Doses, vacinaRaivaDoses, vermifugoDoses, rescuedAt, medicationNotes, noiseLevel, ...fields } = values;
  const v10Changed = JSON.stringify(v10Doses) !== JSON.stringify(initial.v10Doses);
  const rabiesChanged = JSON.stringify(vacinaRaivaDoses) !== JSON.stringify(initial.vacinaRaivaDoses);
  const dewormingChanged = JSON.stringify(vermifugoDoses) !== JSON.stringify(initial.vermifugoDoses);
  return {
    ...fields,
    ...(noiseLevel !== undefined && noiseLevel !== initial.noiseLevel ? { noiseLevel } : {}),
    v10Doses: v10Changed ? v10Doses : undefined,
    vacinaRaivaDoses: rabiesChanged ? vacinaRaivaDoses : undefined,
    vermifugoDoses: dewormingChanged ? vermifugoDoses : undefined,
    vaccinated: v10Changed || rabiesChanged
      ? [...v10Doses, ...vacinaRaivaDoses].some(({ status }) => status === 'sim')
      : fields.vaccinated,
    dewormed: dewormingChanged
      ? vermifugoDoses.some(({ status }) => status === 'sim') ? 'yes' : 'no'
      : fields.dewormed,
    rescuedAt: rescuedAt.slice(0, 10) === animal.rescuedAt.slice(0, 10) ? undefined : rescuedAt,
    medicationNotes: medicationNotes === initial.medicationNotes ? undefined : medicationNotes,
  };
}

export function sizeLabel(size: number): string {
  return ({ 1: 'Muito pequeno', 2: 'Pequeno', 3: 'Médio', 4: 'Grande', 5: 'Muito grande' })[size] ?? 'Não informado';
}
