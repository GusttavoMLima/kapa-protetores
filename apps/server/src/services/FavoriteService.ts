import { NotFoundError } from '../errors';
import { FavoriteRepository } from '../repositories/FavoriteRepository';

export class FavoriteService {
  constructor(private readonly repository: FavoriteRepository) {}

  public async toggle(userId: string, animalId: string): Promise<boolean> {
    try {
      return await this.repository.toggle(userId, animalId);
    } catch (error) {
      if (error instanceof Error && error.message === 'ANIMAL_NOT_FOUND') {
        throw new NotFoundError('Animal não encontrado.');
      }
      throw error;
    }
  }
}
