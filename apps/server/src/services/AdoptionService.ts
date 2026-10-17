import type { Adoption, AdoptionApplication } from '@kapa/shared';
import { ConflictError, NotFoundError } from '../errors';
import { AdoptionRepository } from '../repositories/AdoptionRepository';

export class AdoptionService {
  constructor(private readonly repository: AdoptionRepository) {}

  public async create(adopterId: string, animalId: string, application: AdoptionApplication): Promise<Adoption> {
    try {
      return await this.repository.create(adopterId, animalId, application);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'ANIMAL_NOT_FOUND') {
        throw new NotFoundError('Animal não encontrado.');
      }
      if (error.message === 'ANIMAL_NOT_AVAILABLE') {
        throw new ConflictError('Este animal não está mais disponível para adoção.');
      }
      if (error.message === 'ADOPTION_ALREADY_REQUESTED') {
        throw new ConflictError('Você já possui uma solicitação ativa para este animal.');
      }
      throw error;
    }
  }

  public async listForAdmin(): Promise<Adoption[]> {
    return this.repository.listForAdmin();
  }

  public async listForAdopter(adopterId: string): Promise<Adoption[]> {
    return this.repository.listForAdopter(adopterId);
  }

  public async updateStatus(id: string, status: Adoption['status']): Promise<Adoption> {
    return this.repository.updateStatus(id, status);
  }
}
