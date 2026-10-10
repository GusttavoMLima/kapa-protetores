import { z } from 'zod';

export const adoptionProfileIdParams = z.object({
  id: z.string().uuid(),
});

export const adoptionProfilePreferenceFields = z.object({
  preferredSpecies: z.enum(['dog', 'cat', 'other']).nullable().optional(),
  preferredGender: z.enum(['male', 'female']).nullable().optional(),
  preferredSize: z.number().int().min(1).max(5).nullable().optional(),
  preferredEnergy: z.number().int().min(1).max(5).nullable().optional(),
  preferredKidFriendly: z.number().int().min(1).max(5).nullable().optional(),
  preferredNoise: z.number().int().min(1).max(5).nullable().optional(),
  preferredAgeStage: z.number().int().min(1).max(5).nullable().optional(),
  livesInApartment: z.boolean().nullable().optional(),
  hasOtherPets: z.boolean().nullable().optional(),
});

export const adoptionProfilePreferences = z.object({
  filters: adoptionProfilePreferenceFields,
});

export const adoptionProfileSinglePreference = z.object({
  key: z.enum([
    'preferredSpecies',
    'preferredGender',
    'preferredSize',
    'preferredEnergy',
    'preferredKidFriendly',
    'preferredNoise',
    'preferredAgeStage',
    'livesInApartment',
    'hasOtherPets',
  ]),
  value: z
    .union([
      z.enum(['dog', 'cat', 'other', 'male', 'female']),
      z.number(),
      z.boolean(),
      z.string().transform((val) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        const num = Number(val);
        if (!isNaN(num)) return num;
        return val;
      }),
    ])
    .nullable(),
});

export const adoptionProfileCreate = adoptionProfilePreferenceFields.extend({
  userId: z.string().uuid(),
});

export const adoptionProfileUpdate = adoptionProfilePreferenceFields;
