import type { CommunityEventListItem } from '@kapa/shared';
import { NotFoundError, ConflictError } from '../errors';
import { CommunityEventRepository } from '../repositories/CommunityEventRepository';
import type { CreateCommunityEventData } from '../validation/communityEventSchema';

export class CommunityEventService {
  constructor(private readonly repository: CommunityEventRepository) {}

  public listUpcomingForVolunteer(
    volunteerId: string,
  ): Promise<CommunityEventListItem[]> {
    return this.repository.listUpcomingForVolunteer(volunteerId);
  }

  public listUpcomingForManager(): Promise<CommunityEventListItem[]> {
    return this.repository.listUpcomingForManager();
  }

  public create(input: CreateCommunityEventData): Promise<CommunityEventListItem> {
    return this.repository.create(input);
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
        throw new NotFoundError('Atividade não encontrada.');
      }
      if (error.message === 'COMMUNITY_EVENT_CLOSED') {
        throw new ConflictError('As inscrições para esta atividade estão encerradas.');
      }
      if (error.message === 'COMMUNITY_EVENT_ALREADY_JOINED') {
        throw new ConflictError('Você já está inscrito nesta atividade.');
      }
      if (error.message === 'COMMUNITY_EVENT_FULL') {
        throw new ConflictError('As vagas para esta atividade foram preenchidas.');
      }
      throw error;
    }
  }
}
