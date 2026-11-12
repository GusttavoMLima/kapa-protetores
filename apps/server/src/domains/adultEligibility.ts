import { isAdult, isValidPhone } from '@kapa/shared';
import { BadRequestError, ForbiddenError } from '../errors';

export function requireAdultProfile(birthDate: Date | null | undefined, phone: string | null | undefined): { birthDate: string; phone: string } {
  if (!birthDate) throw new BadRequestError('Complete sua data de nascimento e celular em Editar Perfil antes de continuar.');
  if (!isAdult(birthDate.toISOString().slice(0, 10))) throw new ForbiddenError('É necessário ter 18 anos completos para solicitar adoção ou se candidatar ao voluntariado.');
  if (!phone || !isValidPhone(phone)) throw new BadRequestError('Complete seu celular em Editar Perfil antes de continuar.');
  return { birthDate: birthDate.toISOString().slice(0, 10), phone };
}
