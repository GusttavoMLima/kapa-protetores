import {
  SystemEventTypes,
  type Adoption,
  type AdoptionApplication,
  type UpdateAdoptionStatusInput,
} from '@kapa/shared';
import { BadRequestError, ConflictError, NotFoundError } from '../errors';
import { AdoptionRepository } from '../repositories/AdoptionRepository';
import {
  AVAILABLE_ANIMALS_CACHE_KEY,
  buildPublicAnimalCacheKey,
} from './AnimalService';
import {
  buildUserCountsCacheKey,
  buildUserProfileCacheKey,
} from './UserService';
import type { CacheProvider } from './RedisService';
import type { EventsService } from './EventsService';
import { SHELTER_BUDGET_PREDICTION_CACHE_KEY } from './PredictionService';

const ADOPTIONS_CACHE_TTL_SECONDS = 60;
const ADMIN_ADOPTIONS_CACHE_KEY = 'adoptions:admin:all';

export function buildAdopterAdoptionsCacheKey(adopterId: string): string {
  return `adoptions:user:${adopterId}`;
}

export class AdoptionService {
  constructor(
    private readonly repository: AdoptionRepository,
    private readonly cache?: CacheProvider,
    private readonly eventsService?: EventsService,
  ) {}

  public async create(adopterId: string, animalId: string, application: AdoptionApplication): Promise<Adoption> {
    try {
      const created = await this.repository.create(adopterId, animalId, application);
      if (this.eventsService) {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_REQUESTED,
          userId: adopterId,
          animalId,
          payload: { adoptionId: created.id },
        });
      }
      if (this.cache) {
        await Promise.all([
          this.cache.deleteCache(buildAdopterAdoptionsCacheKey(adopterId)),
          this.cache.deleteCache(ADMIN_ADOPTIONS_CACHE_KEY),
          this.cache.deleteCache(buildUserProfileCacheKey(adopterId)),
          this.cache.deleteCache(buildUserCountsCacheKey(adopterId)),
        ]);
      }
      return created;
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
    if (this.cache) {
      const cached = await this.cache.getCache<Adoption[]>(
        ADMIN_ADOPTIONS_CACHE_KEY,
      );
      if (cached) {
        return cached;
      }
    }

    const adoptions = await this.repository.listForAdmin();
    if (this.cache) {
      await this.cache.setCache(
        ADMIN_ADOPTIONS_CACHE_KEY,
        adoptions,
        ADOPTIONS_CACHE_TTL_SECONDS,
      );
    }
    return adoptions;
  }

  public async listForAdopter(adopterId: string): Promise<Adoption[]> {
    const cacheKey = buildAdopterAdoptionsCacheKey(adopterId);
    if (this.cache) {
      const cached = await this.cache.getCache<Adoption[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const adoptions = await this.repository.listForAdopter(adopterId);
    if (this.cache) {
      await this.cache.setCache(
        cacheKey,
        adoptions,
        ADOPTIONS_CACHE_TTL_SECONDS,
      );
    }
    return adoptions;
  }

  public async updateWorkflow(
    id: string,
    input: UpdateAdoptionStatusInput,
  ): Promise<Adoption> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Solicitação de adoção não encontrada.');

    this.validateWorkflowUpdate(current, input);

    try {
      const updated = await this.repository.updateWorkflow(id, input);
      await this.emitStatusEvent(updated, input.status);
      await this.invalidateWorkflowCaches(updated);
      return updated;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'ANIMAL_NOT_AVAILABLE') {
        throw new ConflictError('Este animal não está mais disponível para adoção.');
      }
      if (error.message === 'ADOPTION_NOT_FOUND') {
        throw new NotFoundError('Solicitação de adoção não encontrada.');
      }
      throw error;
    }
  }

  public async uploadSignedContract(
    id: string,
    file: Express.Multer.File,
  ): Promise<Adoption> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Solicitação de adoção não encontrada.');
    if (current.status !== 'interviewing') {
      throw new ConflictError(
        'O contrato assinado só pode ser anexado durante a etapa de contato.',
      );
    }
    if (!current.contractSentAt) {
      throw new ConflictError('Registre o envio do contrato antes de anexar a versão assinada.');
    }
    if (!this.isPdf(file.buffer)) {
      throw new BadRequestError('Envie um arquivo PDF válido do contrato assinado.');
    }

    try {
      const updated = await this.repository.saveSignedContract(
        id,
        this.safePdfFileName(file.originalname),
        Uint8Array.from(file.buffer),
      );
      await this.invalidateWorkflowCaches(updated);
      return updated;
    } catch (error) {
      if (error instanceof Error && error.message === 'ADOPTION_NOT_FOUND') {
        throw new NotFoundError('Solicitação de adoção não encontrada.');
      }
      throw error;
    }
  }

  public async getSignedContract(
    id: string,
  ): Promise<{ data: Buffer; fileName: string }> {
    const contract = await this.repository.findSignedContract(id);
    if (!contract) {
      throw new NotFoundError('Contrato assinado não encontrado.');
    }
    return contract;
  }

  private validateWorkflowUpdate(
    current: Adoption,
    input: UpdateAdoptionStatusInput,
  ): void {
    const status = input.status;

    if (status === 'interviewing' && current.status !== 'pending') {
      throw new ConflictError('Somente solicitações em análise podem iniciar o contato.');
    }

    if (status === 'approved') {
      if (current.status !== 'interviewing') {
        throw new ConflictError('A adoção só pode ser concluída após a etapa de contato.');
      }
      if (!current.contractSentAt && input.contractSent !== true) {
        throw new ConflictError('Registre o envio do contrato antes de concluir a adoção.');
      }
      if (!current.signedContractUploadedAt) {
        throw new ConflictError('Anexe o contrato assinado antes de concluir a adoção.');
      }
    }

    if (
      status === 'rejected' &&
      current.status !== 'pending' &&
      current.status !== 'interviewing'
    ) {
      throw new ConflictError('Esta solicitação já foi finalizada.');
    }

    if (
      input.contractSent !== undefined &&
      current.status !== 'interviewing' &&
      status !== 'interviewing'
    ) {
      throw new ConflictError('O contrato só pode ser registrado durante a etapa de contato.');
    }

    if (
      input.adminNote !== undefined &&
      current.status !== 'pending' &&
      current.status !== 'interviewing'
    ) {
      throw new ConflictError('Não é possível alterar notas de uma solicitação finalizada.');
    }
  }

  private isPdf(data: Buffer): boolean {
    return data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  private safePdfFileName(fileName: string): string {
    const normalized = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120);
    return normalized.toLowerCase().endsWith('.pdf')
      ? normalized
      : `${normalized || 'contrato-assinado'}.pdf`;
  }

  private async emitStatusEvent(
    updated: Adoption,
    status: UpdateAdoptionStatusInput['status'],
  ): Promise<void> {
    if (this.eventsService) {
      if (status === 'approved') {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_APPROVED,
          userId: updated.adopterId,
          animalId: updated.animalId,
          payload: { adoptionId: updated.id },
        });
      } else if (status === 'rejected') {
        await this.eventsService.createEvent({
          type: SystemEventTypes.ADOPTION_REJECTED,
          userId: updated.adopterId,
          animalId: updated.animalId,
          payload: { adoptionId: updated.id },
        });
      }
    }
  }

  private async invalidateWorkflowCaches(updated: Adoption): Promise<void> {
    if (this.cache) {
      await Promise.all([
        this.cache.deleteCache(ADMIN_ADOPTIONS_CACHE_KEY),
        updated.adopterId
          ? this.cache.deleteCache(
              buildAdopterAdoptionsCacheKey(updated.adopterId),
            )
          : Promise.resolve(),
        updated.adopterId
          ? this.cache.deleteCache(buildUserProfileCacheKey(updated.adopterId))
          : Promise.resolve(),
        updated.adopterId
          ? this.cache.deleteCache(buildUserCountsCacheKey(updated.adopterId))
          : Promise.resolve(),
        this.cache.deleteCache(AVAILABLE_ANIMALS_CACHE_KEY),
        this.cache.deleteCache(SHELTER_BUDGET_PREDICTION_CACHE_KEY),
        updated.animalId
          ? this.cache.deleteCache(buildPublicAnimalCacheKey(updated.animalId))
          : Promise.resolve(),
      ]);
    }
  }
}
