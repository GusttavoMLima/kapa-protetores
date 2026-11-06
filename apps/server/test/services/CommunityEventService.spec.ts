import type { CommunityEventListItem } from '@kapa/shared';
import { ConflictError, NotFoundError } from '../../src/errors';
import type { CommunityEventRepository } from '../../src/repositories/CommunityEventRepository';
import { CommunityEventService } from '../../src/services/CommunityEventService';
import type { CacheProvider } from '../../src/services/RedisService';

const sampleEvent: CommunityEventListItem = {
  id: 'c000000000000000000000001',
  title: 'Feira de Adoção',
  description: 'Apoio aos visitantes e animais.',
  cep: 13600000,
  type: 'event',
  startAt: '2027-05-10T12:00:00.000Z',
  endAt: '2027-05-10T16:00:00.000Z',
  location: 'Praça Barão',
  vacancies: 10,
  createdAt: '2026-11-01T10:00:00.000Z',
  isSignedUp: false,
  volunteerCount: 2,
  remainingVacancies: 8,
};

describe('CommunityEventService', () => {
  it('cancels volunteer signup and invalidates caches', async () => {
    const mockRepository: Partial<CommunityEventRepository> = {
      cancelSignUp: jest.fn().mockResolvedValue(sampleEvent),
    };
    const mockCache: CacheProvider = {
      getCache: jest.fn(),
      setCache: jest.fn(),
      deleteCache: jest.fn().mockResolvedValue(undefined),
    };

    const service = new CommunityEventService(
      mockRepository as CommunityEventRepository,
      mockCache,
    );

    const result = await service.cancelSignUp(
      'vol-1',
      'c000000000000000000000001',
    );

    expect(result).toEqual(sampleEvent);
    expect(mockRepository.cancelSignUp).toHaveBeenCalledWith(
      'vol-1',
      'c000000000000000000000001',
    );
    expect(mockCache.deleteCache).toHaveBeenCalledTimes(3);
  });

  it('maps repository errors on cancelSignUp to domain HTTP errors', async () => {
    const cancelSignUpMock = jest.fn();
    const service = new CommunityEventService({
      cancelSignUp: cancelSignUpMock,
    } as unknown as CommunityEventRepository);

    cancelSignUpMock.mockRejectedValueOnce(
      new Error('COMMUNITY_EVENT_NOT_FOUND'),
    );
    await expect(service.cancelSignUp('vol-1', 'evt-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );

    cancelSignUpMock.mockRejectedValueOnce(new Error('COMMUNITY_EVENT_CLOSED'));
    await expect(service.cancelSignUp('vol-1', 'evt-1')).rejects.toBeInstanceOf(
      ConflictError,
    );

    cancelSignUpMock.mockRejectedValueOnce(
      new Error('COMMUNITY_EVENT_NOT_SIGNED_UP'),
    );
    await expect(service.cancelSignUp('vol-1', 'evt-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
