import type { PrismaClient } from '@prisma/client';
import {
  SystemEventTypes,
  type VolunteerApplication,
  type VolunteerApplicationData,
} from '@kapa/shared';
import { ConflictError, NotFoundError } from '../../src/errors';
import { VolunteerApplicationRepository } from '../../src/repositories/VolunteerApplicationRepository';
import { EventsService } from '../../src/services/EventsService';
import { VolunteerApplicationService } from '../../src/services/VolunteerApplicationService';

const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_REVIEWER_ID = '660e8400-e29b-41d4-a716-446655440001';
const VALID_APP_ID = 'clxyz1234567890abcdefghij';

const sampleApplicationData: VolunteerApplicationData = {
  fullName: 'Maria Voluntária',
  phone: '(19) 99999-8888',
  areasOfInterest: ['care', 'event'],
  availability: 'weekends',
  motivation: 'Quero ajudar os animais resgatados nos finais de semana.',
  acceptsTerms: true,
};

function createMocks() {
  const create = jest.fn<
    Promise<VolunteerApplication>,
    [string, VolunteerApplicationData]
  >();
  const findLatestByUserId = jest.fn<
    Promise<VolunteerApplication | null>,
    [string]
  >();
  const listForAdmin = jest.fn<Promise<VolunteerApplication[]>, []>();
  const updateStatus = jest.fn<
    Promise<VolunteerApplication>,
    [string, 'approved' | 'rejected']
  >();

  const repository = {
    create,
    findLatestByUserId,
    listForAdmin,
    updateStatus,
  } as unknown as VolunteerApplicationRepository;

  const eventsCreate = jest.fn();
  const db = {
    events: {
      create: eventsCreate,
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaClient;

  const eventsService = new EventsService(db);
  const getCache = jest.fn().mockResolvedValue(null);
  const setCache = jest.fn().mockResolvedValue(undefined);
  const deleteCache = jest.fn().mockResolvedValue(undefined);

  const service = new VolunteerApplicationService(
    repository,
    { getCache, setCache, deleteCache },
    eventsService,
  );

  return {
    service,
    create,
    findLatestByUserId,
    listForAdmin,
    updateStatus,
    eventsCreate,
    getCache,
    setCache,
    deleteCache,
  };
}

describe('VolunteerApplicationService', () => {
  it('submits a volunteer application, emits VOLUNTEER_APPLICATION_SUBMITTED, and invalidates caches', async () => {
    const { service, create, eventsCreate, deleteCache } = createMocks();

    create.mockResolvedValue({
      id: VALID_APP_ID,
      userId: VALID_USER_ID,
      status: 'pending',
      application: sampleApplicationData,
      appliedAt: '2026-10-26T12:00:00.000Z',
      updatedAt: '2026-10-26T12:00:00.000Z',
      user: {
        id: VALID_USER_ID,
        username: 'Maria',
        email: 'maria@example.com',
        avatar: null,
        role: 'adopter',
      },
    });

    eventsCreate.mockResolvedValue({
      id: 'clxyz0000000000abcdefghij',
      type: SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED,
      user_id: VALID_USER_ID,
      animal_id: null,
      payload: { applicationId: VALID_APP_ID },
      emitted_at: new Date('2026-10-26T12:00:00.000Z'),
    });

    const result = await service.submitApplication(
      VALID_USER_ID,
      sampleApplicationData,
    );

    expect(result.id).toBe(VALID_APP_ID);
    expect(result.status).toBe('pending');
    expect(result.application).toEqual(sampleApplicationData);
    expect(eventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: SystemEventTypes.VOLUNTEER_APPLICATION_SUBMITTED,
          user_id: VALID_USER_ID,
          payload: { applicationId: VALID_APP_ID },
        }),
      }),
    );
    expect(deleteCache).toHaveBeenCalledTimes(4);
  });

  it('translates USER_NOT_FOUND to NotFoundError', async () => {
    const { service, create } = createMocks();
    create.mockRejectedValue(new Error('USER_NOT_FOUND'));

    await expect(
      service.submitApplication(VALID_USER_ID, sampleApplicationData),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('translates VOLUNTEER_ROLE_ALREADY_GRANTED to ConflictError', async () => {
    const { service, create } = createMocks();
    create.mockRejectedValue(new Error('VOLUNTEER_ROLE_ALREADY_GRANTED'));

    await expect(
      service.submitApplication(VALID_USER_ID, sampleApplicationData),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('translates VOLUNTEER_APPLICATION_ALREADY_PENDING to ConflictError', async () => {
    const { service, create } = createMocks();
    create.mockRejectedValue(
      new Error('VOLUNTEER_APPLICATION_ALREADY_PENDING'),
    );

    await expect(
      service.submitApplication(VALID_USER_ID, sampleApplicationData),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns the user latest volunteer application via getMyApplication and caches it', async () => {
    const { service, findLatestByUserId, setCache } = createMocks();
    findLatestByUserId.mockResolvedValue({
      id: VALID_APP_ID,
      userId: VALID_USER_ID,
      status: 'pending',
      application: sampleApplicationData,
      appliedAt: '2026-10-26T12:00:00.000Z',
    });

    const result = await service.getMyApplication(VALID_USER_ID);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(VALID_APP_ID);
    expect(setCache).toHaveBeenCalledTimes(1);
  });

  it('approves a pending application and emits VOLUNTEER_APPLICATION_APPROVED', async () => {
    const { service, updateStatus, eventsCreate, deleteCache } = createMocks();

    updateStatus.mockResolvedValue({
      id: VALID_APP_ID,
      userId: VALID_USER_ID,
      status: 'approved',
      application: sampleApplicationData,
      appliedAt: '2026-10-26T12:00:00.000Z',
      updatedAt: '2026-10-26T12:05:00.000Z',
      user: {
        id: VALID_USER_ID,
        username: 'Maria',
        email: 'maria@example.com',
        avatar: null,
        role: 'volunteer',
      },
    });

    eventsCreate.mockResolvedValue({
      id: 'clxyz9999999999abcdefghij',
      type: SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED,
      user_id: VALID_USER_ID,
      animal_id: null,
      payload: {
        applicationId: VALID_APP_ID,
        approvedByUserId: VALID_REVIEWER_ID,
      },
      emitted_at: new Date('2026-10-26T12:05:00.000Z'),
    });

    const updated = await service.updateStatus(
      VALID_APP_ID,
      'approved',
      VALID_REVIEWER_ID,
    );

    expect(updated.status).toBe('approved');
    expect(updated.user?.role).toBe('volunteer');
    expect(eventsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: SystemEventTypes.VOLUNTEER_APPLICATION_APPROVED,
          user_id: VALID_USER_ID,
        }),
      }),
    );
    expect(deleteCache).toHaveBeenCalledTimes(4);
  });
});
