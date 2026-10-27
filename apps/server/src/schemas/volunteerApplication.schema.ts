import { z } from 'zod';
import { volunteerApplicationDataSchema } from './event.schema';

export { volunteerApplicationDataSchema };

export const updateVolunteerApplicationStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
  })
  .strict();

export const volunteerApplicationIdParamsSchema = z.object({
  id: z.string().cuid('Identificador de solicitação inválido.'),
});
