import type { PrismaClient } from '@prisma/client';
import { ageFromBirthDate, isAdult } from '@kapa/shared';
import { requireAdultProfile } from '../../src/domains/adultEligibility';
import { AdoptionRepository } from '../../src/repositories/AdoptionRepository';
import { VolunteerApplicationRepository } from '../../src/repositories/VolunteerApplicationRepository';
import { birthDateSchema, phoneSchema } from '../../src/schemas/personalData.schema';
import type { AdoptionApplication, VolunteerApplicationData } from '@kapa/shared';

describe('maioridade e dados pessoais', () => {
  const now = new Date('2026-11-10T15:00:00Z');
  it('libera exatamente no aniversário de 18 anos, no calendário do abrigo', () => {
    expect(isAdult('2008-11-10', now)).toBe(true);
    expect(isAdult('2008-11-11', now)).toBe(false);
    expect(isAdult('2008-11-10', new Date('2026-11-10T01:00:00Z'))).toBe(false);
  });
  it('rejeita datas impossíveis, futuras ou ausentes e respeita anos bissextos', () => {
    for (const value of ['2008-02-30', '2009-02-29', '2099-01-01', '', '10/11/2000', '200a-11-10', '2008-11-1x', '2008-11-10\n']) expect(ageFromBirthDate(value, now)).toBeNull();
    expect(ageFromBirthDate('2008-02-29', now)).toBe(18);
    expect(isAdult('2008-02-29', new Date('2026-02-28T15:00:00Z'))).toBe(false);
    expect(isAdult('2008-02-29', new Date('2026-03-01T15:00:00Z'))).toBe(true);
  });
  it('valida data e normaliza celular sem aceitar texto como telefone', () => {
    expect(birthDateSchema.safeParse('2099-01-01').success).toBe(false);
    expect(phoneSchema.parse('(19) 99999-8888')).toBe('19999998888');
    expect(phoneSchema.safeParse('abc19999998888').success).toBe(false);
    expect(phoneSchema.safeParse('1234').success).toBe(false);
  });
  it('exige completar perfil e bloqueia menor com status 403', () => {
    expect(() => requireAdultProfile(null, '19999998888')).toThrow('Complete');
    expect(() => requireAdultProfile(new Date('2000-01-01'), null)).toThrow('celular');
    try { requireAdultProfile(new Date(), '19999998888'); throw new Error('should reject'); }
    catch (error) { expect(error).toMatchObject({ statusCode: 403 }); }
  });

  function fixture(birthDate: Date | null) {
    const create = jest.fn();
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'adopter', birth_date: birthDate, phone: '19999998888' }), update: jest.fn() },
      animal: { findUnique: jest.fn().mockResolvedValue({ id: 'pet', status: 'available' }), updateMany: jest.fn() },
      adoptions: { findFirst: jest.fn().mockResolvedValue(null), create, findUnique: jest.fn().mockResolvedValue({ id: 'application', adopter_id: 'user', animal_id: 'pet' }) },
      volunteerApplications: { findFirst: jest.fn().mockResolvedValue(null), create, findUnique: jest.fn().mockResolvedValue({ user_id: 'user', user: { role: 'adopter' } }), update: jest.fn() },
    };
    const prisma = { $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) } as unknown as PrismaClient;
    return { tx, prisma, create };
  }

  it('não permite burlar adoção enviando nascimento adulto no corpo quando o perfil é menor', async () => {
    const { prisma, create } = fixture(new Date());
    const repository = new AdoptionRepository(prisma);
    await expect(repository.create('user', 'pet', { birthDate: '1990-01-01' } as AdoptionApplication)).rejects.toMatchObject({ statusCode: 403 });
    expect(create).not.toHaveBeenCalled();
  });
  it('bloqueia a aprovação de uma adoção antiga de menor sem alterar o animal', async () => {
    const { prisma, tx } = fixture(new Date());
    await expect(new AdoptionRepository(prisma).updateWorkflow('application', { status: 'approved' })).rejects.toMatchObject({ statusCode: 403 });
    expect(tx.animal.updateMany).not.toHaveBeenCalled();
  });
  it.each([null, new Date()])('bloqueia candidatura e aprovação de voluntariado sem maioridade comprovada no perfil (%s)', async (birthDate) => {
    const { prisma, create, tx } = fixture(birthDate);
    const repository = new VolunteerApplicationRepository(prisma);
    await expect(repository.create('user', {} as VolunteerApplicationData)).rejects.toThrow();
    await expect(repository.updateStatus('application', 'approved')).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.volunteerApplications.update).not.toHaveBeenCalled();
  });
  it('salva nascimento e celular do perfil, sem confiar em valores adulterados da ficha', async () => {
    const { prisma, create } = fixture(new Date('1990-01-01'));
    const record = { id: 'app', adopter_id: 'user', animal_id: 'pet', status: 'pending', applied_at: now, updated_at: now, contract_sent_at: null, signed_contract_uploaded_at: null };
    create.mockImplementation(async ({ data }: { data: { application_data: AdoptionApplication } }) => ({ ...record, application_data: data.application_data }));
    const result = await new AdoptionRepository(prisma).create('user', 'pet', { birthDate: '1980-01-01', phone: '11911112222' } as AdoptionApplication);
    expect(result.application).toMatchObject({ birthDate: '1990-01-01', phone: '19999998888' });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
