import { Prisma, PrismaClient } from '@prisma/client';
import type { CommunityEventListItem, CreateCommunityEventInput } from '@kapa/shared';

type CommunityEventRecord = {
  id: string;
  title: string;
  description: string;
  cep: number;
  type: 'care' | 'cleaning' | 'event' | 'transport';
  start_at: Date;
  end_at: Date | null;
  location: string | null;
  vacancies: number | null;
  created_at: Date;
  volunteers?: { volunteer_id: string }[];
  _count: { volunteers: number };
};

export class CommunityEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toListItem(record: CommunityEventRecord): CommunityEventListItem {
    const volunteerCount = record._count.volunteers;
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      cep: record.cep,
      type: record.type,
      startAt: record.start_at.toISOString(),
      endAt: record.end_at?.toISOString() ?? null,
      location: record.location,
      vacancies: record.vacancies,
      createdAt: record.created_at.toISOString(),
      isSignedUp: (record.volunteers?.length ?? 0) > 0,
      volunteerCount,
      remainingVacancies:
        record.vacancies === null
          ? null
          : Math.max(0, record.vacancies - volunteerCount),
    };
  }

  public async listUpcomingForVolunteer(
    volunteerId: string,
  ): Promise<CommunityEventListItem[]> {
    const records = await this.prisma.communityEvents.findMany({
      where: { start_at: { gte: new Date() } },
      orderBy: [{ start_at: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        cep: true,
        type: true,
        start_at: true,
        end_at: true,
        location: true,
        vacancies: true,
        created_at: true,
        volunteers: {
          where: { volunteer_id: volunteerId },
          select: { volunteer_id: true },
        },
        _count: { select: { volunteers: true } },
      },
    });

    return records.map((record) => this.toListItem(record));
  }

  public async listUpcomingForManager(): Promise<CommunityEventListItem[]> {
    const records = await this.prisma.communityEvents.findMany({
      where: { start_at: { gte: new Date() } },
      orderBy: [{ start_at: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        cep: true,
        type: true,
        start_at: true,
        end_at: true,
        location: true,
        vacancies: true,
        created_at: true,
        _count: { select: { volunteers: true } },
      },
    });

    return records.map((record) => this.toListItem(record));
  }

  public async create(input: CreateCommunityEventInput): Promise<CommunityEventListItem> {
    const event = await this.prisma.communityEvents.create({
      data: {
        title: input.title,
        description: input.description,
        cep: input.cep,
        type: input.type,
        start_at: new Date(input.startAt),
        end_at: new Date(input.endAt),
        location: input.location,
        vacancies: input.vacancies,
      },
      select: {
        id: true,
        title: true,
        description: true,
        cep: true,
        type: true,
        start_at: true,
        end_at: true,
        location: true,
        vacancies: true,
        created_at: true,
        _count: { select: { volunteers: true } },
      },
    });

    return this.toListItem(event);
  }

  public async signUp(
    volunteerId: string,
    communityEventId: string,
  ): Promise<CommunityEventListItem> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const event = await transaction.communityEvents.findUnique({
              where: { id: communityEventId },
              select: { id: true, start_at: true, vacancies: true },
            });

            if (!event) throw new Error('COMMUNITY_EVENT_NOT_FOUND');
            if (event.start_at.getTime() <= Date.now()) {
              throw new Error('COMMUNITY_EVENT_CLOSED');
            }

            const existingSignup = await transaction.communityEventVolunteers.findUnique({
              where: {
                volunteer_id_community_event_id: {
                  volunteer_id: volunteerId,
                  community_event_id: communityEventId,
                },
              },
              select: { volunteer_id: true },
            });
            if (existingSignup) throw new Error('COMMUNITY_EVENT_ALREADY_JOINED');

            const volunteerCount = await transaction.communityEventVolunteers.count({
              where: { community_event_id: communityEventId },
            });
            if (event.vacancies !== null && volunteerCount >= event.vacancies) {
              throw new Error('COMMUNITY_EVENT_FULL');
            }

            await transaction.communityEventVolunteers.create({
              data: {
                volunteer_id: volunteerId,
                community_event_id: communityEventId,
              },
            });

            const result = await transaction.communityEvents.findUnique({
              where: { id: communityEventId },
              select: {
                id: true,
                title: true,
                description: true,
                cep: true,
                type: true,
                start_at: true,
                end_at: true,
                location: true,
                vacancies: true,
                created_at: true,
                volunteers: {
                  where: { volunteer_id: volunteerId },
                  select: { volunteer_id: true },
                },
                _count: { select: { volunteers: true } },
              },
            });

            if (!result) throw new Error('COMMUNITY_EVENT_NOT_FOUND');
            return this.toListItem(result);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new Error('COMMUNITY_EVENT_ALREADY_JOINED');
          }
          if (error.code === 'P2034' && attempt < 2) continue;
        }
        throw error;
      }
    }

    throw new Error('COMMUNITY_EVENT_SIGNUP_RETRY_EXHAUSTED');
  }
}
