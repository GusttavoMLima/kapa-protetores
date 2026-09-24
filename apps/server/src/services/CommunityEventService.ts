import type { CommunityEventListItem } from '@kapa/shared';
import { AppError } from '../errors/AppError';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';

export class CommunityEventService {
  constructor(private readonly repository: CommunityEventRepository) {}

  public listUpcomingForVolunteer(
    volunteerId: string,
  ): Promise<CommunityEventListItem[]> {
    return this.repository.listUpcomingForVolunteer(volunteerId);
  }

  public async signUp(
    volunteerId: string,
    communityEventId: string,
  ): Promise<CommunityEventListItem> {
    try {
      return await this.repository.signUp(volunteerId, communityEventId);
    } catch (error) {
      if (!(error instanceof Error)) throw error;

      if (error.message === 'COMMUNITY_EVENT_NOT_FOUND') {
        throw AppError.notFound('Atividade não encontrada.');
      }
      if (error.message === 'COMMUNITY_EVENT_CLOSED') {
        throw AppError.conflict('As inscrições para esta atividade estão encerradas.');
      }
      if (error.message === 'COMMUNITY_EVENT_ALREADY_JOINED') {
        throw AppError.conflict('Você já está inscrito nesta atividade.');
      }
      throw error;
    }
  }
}
