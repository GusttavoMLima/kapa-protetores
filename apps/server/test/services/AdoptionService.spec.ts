import type { Adoption } from '@kapa/shared';
import { ConflictError, NotFoundError } from '../../src/errors';
import { AdoptionRepository } from '../../src/repositories/AdoptionRepository';
import { AdoptionService } from '../../src/services/AdoptionService';

const adoption: Adoption = {
  id: 'cmzrequest0000000000000001',
  adopterId: '0d19d4c4-a069-4619-ae90-61b5fc9f64ab',
  animalId: 'cmzanimal00000000000000001',
  status: 'pending',
  appliedAt: '2026-10-15T00:00:00.000Z',
  updatedAt: '2026-10-15T00:00:00.000Z',
};

const application = {
  fullName: 'Ana Souza', birthDate: '1998-01-01', phone: '11999999999', postalCode: '01001-000', street: 'Praça da Sé', number: '1', neighborhood: 'Sé', city: 'São Paulo', housingType: 'apartment' as const, housingSituation: 'rented' as const, residenceProtection: 'yes' as const, hasChildren: 'no' as const, hasOtherPets: 'no' as const, residentsAgree: 'yes' as const, freeStreetAccess: 'no' as const, awareOfResponsibilities: 'yes' as const,
};

describe('AdoptionService', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateWorkflow: jest.fn(),
  } as unknown as AdoptionRepository;
  const service = new AdoptionService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cria uma solicitação pendente para o adotante autenticado', async () => {
    jest.mocked(repository.create).mockResolvedValue(adoption);

    await expect(
      service.create(adoption.adopterId, adoption.animalId, application),
    ).resolves.toEqual(adoption);
  });

  it('informa quando o animal não está mais disponível', async () => {
    jest.mocked(repository.create).mockRejectedValue(
      new Error('ANIMAL_NOT_AVAILABLE'),
    );

    await expect(
      service.create(adoption.adopterId, adoption.animalId, application),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('informa quando o animal não existe', async () => {
    jest.mocked(repository.create).mockRejectedValue(
      new Error('ANIMAL_NOT_FOUND'),
    );

    await expect(
      service.create(adoption.adopterId, adoption.animalId, application),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('move uma ficha para contato antes de concluir a adoção', async () => {
    const inContact = { ...adoption, status: 'interviewing' as const };
    jest.mocked(repository.findById).mockResolvedValue(adoption);
    jest.mocked(repository.updateWorkflow).mockResolvedValue(inContact);

    await expect(
      service.updateWorkflow(adoption.id, { status: 'interviewing' }),
    ).resolves.toEqual(inContact);

    expect(repository.updateWorkflow).toHaveBeenCalledWith(adoption.id, {
      status: 'interviewing',
    });
  });

  it('exige o registro do contrato antes de concluir a adoção', async () => {
    jest.mocked(repository.findById).mockResolvedValue({
      ...adoption,
      status: 'interviewing',
    });

    await expect(
      service.updateWorkflow(adoption.id, { status: 'approved' }),
    ).rejects.toThrow('Registre o envio do contrato antes de concluir a adoção.');
  });

  it('exige o contrato assinado antes de concluir a adoção', async () => {
    jest.mocked(repository.findById).mockResolvedValue({
      ...adoption,
      status: 'interviewing',
      contractSentAt: '2026-11-09T20:00:00.000Z',
    });

    await expect(
      service.updateWorkflow(adoption.id, { status: 'approved' }),
    ).rejects.toThrow('Anexe o contrato assinado antes de concluir a adoção.');
  });

  it('conclui a adoção depois que o contrato foi enviado', async () => {
    const inContact = {
      ...adoption,
      status: 'interviewing' as const,
      contractSentAt: '2026-11-09T20:00:00.000Z',
      signedContractUploadedAt: '2026-11-09T20:05:00.000Z',
    };
    const completed = { ...inContact, status: 'approved' as const };
    jest.mocked(repository.findById).mockResolvedValue(inContact);
    jest.mocked(repository.updateWorkflow).mockResolvedValue(completed);

    await expect(
      service.updateWorkflow(adoption.id, { status: 'approved' }),
    ).resolves.toEqual(completed);
  });
});
