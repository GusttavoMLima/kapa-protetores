import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string({ required_error: 'idToken is required' }).min(1),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
