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
});
