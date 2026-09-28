import { z } from 'zod';

export const createCommunityEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  cep: z.number().int().min(1_000_000).max(99_999_999),
  type: z.enum(['care', 'cleaning', 'event', 'transport']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().trim().min(1).max(200),
  vacancies: z.number().int().min(1).max(500),
}).strict().superRefine((activity, context) => {
  const startAt = Date.parse(activity.startAt);
  const endAt = Date.parse(activity.endAt);

  if (startAt <= Date.now()) {
    context.addIssue({ code: 'custom', path: ['startAt'], message: 'A atividade deve começar no futuro.' });
  }

  if (endAt <= startAt) {
    context.addIssue({ code: 'custom', path: ['endAt'], message: 'O término deve ocorrer após o início.' });
  }
});

export type CreateCommunityEventData = z.infer<typeof createCommunityEventSchema>;
