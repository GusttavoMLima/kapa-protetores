import { z } from 'zod';
import {
  SystemEventTypes,
  type CreateSystemEventInput,
  type SystemEventPayloadMap,
} from '@kapa/shared';
import { ValidationError } from '../errors';

const animalStatusSchema = z.enum([
  'rescued',
  'treating',
  'available',
  'adopted',
]);

const speciesSchema = z.enum(['dog', 'cat', 'other']);

const userRoleSchema = z.enum(['adopter', 'protector', 'admin', 'volunteer']);

export const adoptionRequestedPayloadSchema = z
  .object({
    adoptionId: z.string().trim().min(1, 'adoptionId is required'),
    animalName: z.string().trim().min(1).optional(),
  })
  .strict();

export const adoptionApprovedPayloadSchema = z
  .object({
    adoptionId: z.string().trim().min(1, 'adoptionId is required'),
    approvedByUserId: z.string().uuid().optional(),
    animalName: z.string().trim().min(1).optional(),
  })
  .strict();

export const adoptionRejectedPayloadSchema = z
  .object({
    adoptionId: z.string().trim().min(1, 'adoptionId is required'),
    rejectedByUserId: z.string().uuid().optional(),
    reason: z.string().trim().min(1).optional(),
  })
  .strict();

export const adoptionCanceledPayloadSchema = z
  .object({
    adoptionId: z.string().trim().min(1, 'adoptionId is required'),
    canceledByUserId: z.string().uuid().optional(),
  })
  .strict();

export const animalCreatedPayloadSchema = z
  .object({
    animalName: z.string().trim().min(1, 'animalName is required'),
    species: speciesSchema,
    status: animalStatusSchema,
  })
  .strict();

export const animalStatusUpdatedPayloadSchema = z
  .object({
    previousStatus: animalStatusSchema,
    newStatus: animalStatusSchema,
    updatedByUserId: z.string().uuid().optional(),
  })
  .strict();

export const volunteerRegisteredPayloadSchema = z
  .object({
    communityEventId: z.string().trim().min(1, 'communityEventId is required'),
    eventTitle: z.string().trim().min(1).optional(),
  })
  .strict();

export const volunteerApplicationDataSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
    phone: z.string().trim().min(10, 'Informe um telefone com DDD.').max(20),
    areasOfInterest: z
      .array(z.enum(['care', 'cleaning', 'event', 'transport']))
      .min(1, 'Selecione pelo menos uma área de interesse.')
      .max(4),
    availability: z.enum(['weekdays', 'weekends', 'flexible']),
    motivation: z
      .string()
      .trim()
      .min(10, 'Conte um pouco sobre sua motivação.')
      .max(500),
    acceptsTerms: z.boolean().refine((value) => value === true, {
      message: 'Confirme o termo de compromisso para continuar.',
    }),
  })
  .strict();

export const volunteerApplicationSubmittedPayloadSchema = z
  .object({
    applicationId: z.string().trim().min(1, 'applicationId is required'),
  })
  .strict();

export const volunteerApplicationApprovedPayloadSchema = z
  .object({
    applicationId: z.string().trim().min(1, 'applicationId is required'),
    approvedByUserId: z.string().uuid().optional(),
  })
  .strict();

export const volunteerApplicationRejectedPayloadSchema = z
  .object({
    applicationId: z.string().trim().min(1, 'applicationId is required'),
    rejectedByUserId: z.string().uuid().optional(),
    reason: z.string().trim().min(1).optional(),
  })
  .strict();

export const petFavoritedPayloadSchema = z
  .object({
    animalName: z.string().trim().min(1).optional(),
  })
  .strict();

export const petUnfavoritedPayloadSchema = z
  .object({
    animalName: z.string().trim().min(1).optional(),
  })
  .strict();

export const userRegisteredPayloadSchema = z
  .object({
    role: userRoleSchema,
    provider: z.enum(['local', 'google']).optional(),
  })
  .strict();

export const eventPayloadSchemas: {
  [K in SystemEventTypes]: z.ZodType<SystemEventPayloadMap[K]>;
} = {
  [SystemEventTypes.ADOPTION_REQUESTED]: adoptionRequestedPayloadSchema,
  [SystemEventTypes.ADOPTION_APPROVED]: adoptionApprovedPayloadSchema,
  [SystemEventTypes.ADOPTION_REJECTED]: adoptionRejectedPayloadSchema,
  [SystemEventTypes.ADOPTION_CANCELED]: adoptionCanceledPayloadSchema,
  [SystemEventTypes.ANIMAL_CREATED]: animalCreatedPayloadSchema,
  [SystemEventTypes.ANIMAL_STATUS_UPDATED]: animalStatusUpdatedPayloadSchema,
  [SystemEventTypes.VOLUNTEER_REGISTERED]: volunteerRegisteredPayloadSchema,
  [SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED]:
    volunteerApplicationSubmittedPayloadSchema,
  [SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED]:
    volunteerApplicationApprovedPayloadSchema,
  [SystemEventTypes.VOLUNTEER_APPLICATION_REJECTED]:
    volunteerApplicationRejectedPayloadSchema,
  [SystemEventTypes.PET_FAVORITED]: petFavoritedPayloadSchema,
  [SystemEventTypes.PET_UNFAVORITED]: petUnfavoritedPayloadSchema,
  [SystemEventTypes.USER_REGISTERED]: userRegisteredPayloadSchema,
};

export const systemEventTypeSchema = z.nativeEnum(SystemEventTypes);

export const userEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: systemEventTypeSchema.optional(),
});

export function validateEventPayload<T extends SystemEventTypes>(
  type: T,
  payload: unknown,
): SystemEventPayloadMap[T] | null {
  const typeResult = systemEventTypeSchema.safeParse(type);
  if (!typeResult.success) {
    throw new ValidationError(`Invalid event type: ${String(type)}`);
  }

  if (payload === undefined || payload === null) {
    return null;
  }

  const schema = eventPayloadSchemas[typeResult.data];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ValidationError(
      `Invalid payload for event type ${typeResult.data}`,
    );
  }

  return parsed.data as SystemEventPayloadMap[T];
}

export function validateCreateEventInput<T extends SystemEventTypes>(
  input: CreateSystemEventInput<T>,
): {
  type: T;
  userId: string | null;
  animalId: string | null;
  payload: SystemEventPayloadMap[T] | null;
} {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Event input must be an object');
  }

  const typeResult = systemEventTypeSchema.safeParse(input.type);
  if (!typeResult.success) {
    throw new ValidationError(`Invalid event type: ${String(input.type)}`);
  }

  let userId: string | null = null;
  if (input.userId !== undefined && input.userId !== null) {
    const parsedUserId = z.string().uuid().safeParse(input.userId);
    if (!parsedUserId.success) {
      throw new ValidationError('Invalid userId: must be a valid UUID');
    }
    userId = parsedUserId.data;
  }

  let animalId: string | null = null;
  if (input.animalId !== undefined && input.animalId !== null) {
    const parsedAnimalId = z.string().cuid().safeParse(input.animalId);
    if (!parsedAnimalId.success) {
      throw new ValidationError('Invalid animalId: must be a valid CUID');
    }
    animalId = parsedAnimalId.data;
  }

  const validatedPayload = validateEventPayload(
    typeResult.data as T,
    input.payload,
  );

  return {
    type: typeResult.data as T,
    userId,
    animalId,
    payload: validatedPayload,
  };
}
