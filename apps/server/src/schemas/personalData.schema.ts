import { z } from 'zod';
import { ageFromBirthDate, isValidPhone } from '@kapa/shared';

export const birthDateSchema = z.string().refine((value) => ageFromBirthDate(value) !== null, 'Informe uma data de nascimento válida, que não seja futura.');
export const phoneSchema = z.string().trim().max(20).refine(isValidPhone, 'Informe um celular válido com DDD.').transform((value) => value.replace(/\D/g, ''));
