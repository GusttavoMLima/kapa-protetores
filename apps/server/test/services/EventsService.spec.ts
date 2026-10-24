import type { Prisma, PrismaClient } from '@prisma/client';
import { SystemEventTypes } from '@kapa/shared';
import { EventsService } from '../../src/services/EventsService';
import { ValidationError } from '../../src/errors';
import { Event } from '../../src/models/Event';

const VALID_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_ANIMAL_ID = 'cjld2cjxh0000qzrmn831i7rn';
const VALID_EVENT_ID = 'cjld2cyuq0000t3rmniod1foy';

describe('EventsService', () => {
  describe('createEvent', () => {
    it('creates an event using the default PrismaClient when no transaction is provided', async () => {
      const emittedAt = new Date('2026-10-24T12:00:00.000Z');
      const createMock = jest.fn().mockResolvedValue({
        id: VALID_EVENT_ID,
        type: SystemEventTypes.ADOPTION_REQUESTED,
        user_id: VALID_USER_ID,
        animal_id: VALID_ANIMAL_ID,
        payload: { adoptionId: 'adopt-123', animalName: 'Thor' },
        emitted_at: emittedAt,
      });

      const prisma = {
        events: {
          create: createMock,
        },
      } as unknown as PrismaClient;

      const service = new EventsService(prisma);
      const event = await service.createEvent({
        type: SystemEventTypes.ADOPTION_REQUESTED,
        userId: VALID_USER_ID,
        animalId: VALID_ANIMAL_ID,
        payload: { adoptionId: 'adopt-123', animalName: 'Thor' },
      });

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith({
        data: {
          type: SystemEventTypes.ADOPTION_REQUESTED,
          user_id: VALID_USER_ID,
          animal_id: VALID_ANIMAL_ID,
          payload: { adoptionId: 'adopt-123', animalName: 'Thor' },
        },
      });
      expect(event.toDTO()).toEqual({
        id: VALID_EVENT_ID,
        type: SystemEventTypes.ADOPTION_REQUESTED,
        userId: VALID_USER_ID,
        animalId: VALID_ANIMAL_ID,
        payload: { adoptionId: 'adopt-123', animalName: 'Thor' },
        emittedAt: emittedAt.toISOString(),
      });
    });

    it('uses the provided Prisma.TransactionClient (tx) when passed', async () => {
      const prismaCreateMock = jest.fn();
      const txCreateMock = jest.fn().mockResolvedValue({
        id: VALID_EVENT_ID,
        type: SystemEventTypes.ANIMAL_STATUS_UPDATED,
        user_id: VALID_USER_ID,
        animal_id: VALID_ANIMAL_ID,
        payload: {
          previousStatus: 'rescued',
          newStatus: 'available',
          updatedByUserId: VALID_USER_ID,
        },
        emitted_at: new Date('2026-10-24T12:30:00.000Z'),
      });

      const prisma = {
        events: { create: prismaCreateMock },
      } as unknown as PrismaClient;

      const tx = {
        events: { create: txCreateMock },
      } as unknown as Prisma.TransactionClient;

      const service = new EventsService(prisma);
      const result = await service.createEvent(
        {
          type: SystemEventTypes.ANIMAL_STATUS_UPDATED,
          userId: VALID_USER_ID,
          animalId: VALID_ANIMAL_ID,
          payload: {
            previousStatus: 'rescued',
            newStatus: 'available',
            updatedByUserId: VALID_USER_ID,
          },
        },
        tx,
      );

      expect(prismaCreateMock).not.toHaveBeenCalled();
      expect(txCreateMock).toHaveBeenCalledTimes(1);
      expect(result.getType()).toBe(SystemEventTypes.ANIMAL_STATUS_UPDATED);
    });

    it('throws ValidationError and does not fail silently when payload is invalid', async () => {
      const createMock = jest.fn();
      const prisma = {
        events: { create: createMock },
      } as unknown as PrismaClient;

      const service = new EventsService(prisma);

      await expect(
        service.createEvent({
          type: SystemEventTypes.ADOPTION_REQUESTED,
          userId: VALID_USER_ID,
          payload: { adoptionId: '' },
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createEvent({
          type: SystemEventTypes.ANIMAL_STATUS_UPDATED,
          animalId: VALID_ANIMAL_ID,
          payload: {
            // @ts-expect-error testing invalid enum value
            previousStatus: 'invalid_status',
            newStatus: 'available',
          },
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createEvent({
          type: SystemEventTypes.PET_FAVORITED,
          userId: VALID_USER_ID,
          payload: {
            animalName: 'Luna',
            // @ts-expect-error testing strict schema rejecting unknown properties
            unexpectedField: true,
          },
        }),
      ).rejects.toThrow(ValidationError);

      expect(createMock).not.toHaveBeenCalled();
    });

    it('throws ValidationError on invalid event type, userId, or animalId', async () => {
      const createMock = jest.fn();
      const prisma = {
        events: { create: createMock },
      } as unknown as PrismaClient;

      const service = new EventsService(prisma);

      await expect(
        service.createEvent({
          type: 'UNKNOWN_EVENT' as SystemEventTypes,
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createEvent({
          type: SystemEventTypes.PET_FAVORITED,
          userId: 'not-a-uuid',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createEvent({
          type: SystemEventTypes.PET_FAVORITED,
          animalId: 'not-a-cuid',
        }),
      ).rejects.toThrow(ValidationError);

      expect(createMock).not.toHaveBeenCalled();
    });
  });

  describe('getUserEvents', () => {
    it('returns paginated events for a user and filters by [user_id, type] composite index', async () => {
      const emittedAt = new Date('2026-10-24T14:00:00.000Z');
      const findManyMock = jest.fn().mockResolvedValue([
        {
          id: VALID_EVENT_ID,
          type: SystemEventTypes.VOLUNTEER_REGISTERED,
          user_id: VALID_USER_ID,
          animal_id: null,
          payload: { communityEventId: 'evt-1', eventTitle: 'Feira de Adoção' },
          emitted_at: emittedAt,
        },
      ]);
      const countMock = jest.fn().mockResolvedValue(5);

      const prisma = {
        events: {
          findMany: findManyMock,
          count: countMock,
        },
      } as unknown as PrismaClient;

      const service = new EventsService(prisma);
      const result = await service.getUserEvents({
        userId: VALID_USER_ID,
        type: SystemEventTypes.VOLUNTEER_REGISTERED,
        page: 2,
        limit: 2,
      });

      const expectedWhere = {
        user_id: VALID_USER_ID,
        type: SystemEventTypes.VOLUNTEER_REGISTERED,
      };

      expect(findManyMock).toHaveBeenCalledWith({
        where: expectedWhere,
        orderBy: { emitted_at: 'desc' },
        skip: 2,
        take: 2,
      });
      expect(countMock).toHaveBeenCalledWith({ where: expectedWhere });
      expect(result).toEqual({
        items: [
          {
            id: VALID_EVENT_ID,
            type: SystemEventTypes.VOLUNTEER_REGISTERED,
            userId: VALID_USER_ID,
            animalId: null,
            payload: {
              communityEventId: 'evt-1',
              eventTitle: 'Feira de Adoção',
            },
            emittedAt: emittedAt.toISOString(),
          },
        ],
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      });
    });

    it('rejects invalid userId or invalid event type filter', async () => {
      const prisma = {
        events: {
          findMany: jest.fn(),
          count: jest.fn(),
        },
      } as unknown as PrismaClient;

      const service = new EventsService(prisma);

      await expect(
        service.getUserEvents({ userId: 'invalid-uuid' }),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.getUserEvents({
          userId: VALID_USER_ID,
          type: 'INVALID_TYPE' as SystemEventTypes,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Event domain model', () => {
    it('validates event type in Event.setType', () => {
      const event = new Event();
      expect(() =>
        event.setType('INVALID_EVENT' as SystemEventTypes),
      ).toThrow(ValidationError);

      event.setType(SystemEventTypes.PET_FAVORITED);
      expect(event.getType()).toBe(SystemEventTypes.PET_FAVORITED);
    });
  });
});
