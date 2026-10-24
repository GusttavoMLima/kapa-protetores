import { Prisma, type PrismaClient } from '@prisma/client';
import {
  SystemEventTypes,
  type CreateSystemEventInput,
  type PaginatedSystemEvents,
  type SystemEvent,
} from '@kapa/shared';
import { Event } from '../models/Event';
import { UUID } from '../domains/UUID';
import { ValidationError } from '../errors';
import {
  systemEventTypeSchema,
  validateCreateEventInput,
} from '../schemas/event.schema';

export interface GetUserEventsParams {
  userId: string;
  type?: SystemEventTypes;
  page?: number;
  limit?: number;
}

type EventsDbClient = PrismaClient | Prisma.TransactionClient;

export class EventsService {
  constructor(private readonly prisma: PrismaClient) {}

  public async createEvent<T extends SystemEventTypes>(
    input: CreateSystemEventInput<T>,
    tx?: Prisma.TransactionClient,
  ): Promise<Event> {
    const validated = validateCreateEventInput(input);
    const client: EventsDbClient = tx ?? this.prisma;

    const record = await client.events.create({
      data: {
        type: validated.type,
        user_id: validated.userId,
        animal_id: validated.animalId,
        payload:
          validated.payload !== null
            ? (validated.payload as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });

    return this.mapRecordToModel(record);
  }

  public async getUserEvents(
    params: GetUserEventsParams,
  ): Promise<PaginatedSystemEvents> {
    const safeUserId = UUID.create(params.userId);
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));

    if (params.type !== undefined) {
      const parsedType = systemEventTypeSchema.safeParse(params.type);
      if (!parsedType.success) {
        throw new ValidationError(`Invalid event type filter: ${String(params.type)}`);
      }
    }

    const where: Prisma.EventsWhereInput = {
      user_id: safeUserId.toString(),
      ...(params.type ? { type: params.type } : {}),
    };

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.events.findMany({
        where,
        orderBy: { emitted_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.events.count({ where }),
    ]);

    const items: SystemEvent[] = records.map((record) =>
      this.mapRecordToModel(record).toDTO(),
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  private mapRecordToModel(record: {
    id: string;
    type: string;
    user_id: string | null;
    animal_id: string | null;
    payload: Prisma.JsonValue | null;
    emitted_at: Date;
  }): Event {
    const event = new Event();
    event.setId(record.id);
    event.setType(record.type as SystemEventTypes);
    event.setUserId(record.user_id);
    event.setAnimalId(record.animal_id);
    event.setPayload(
      record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
        ? (record.payload as Record<string, unknown>)
        : null,
    );
    event.setEmittedAt(record.emitted_at.toISOString());
    return event;
  }
}
