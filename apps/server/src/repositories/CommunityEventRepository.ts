import { Prisma, PrismaClient } from '@prisma/client';
import type { CommunityEventListItem } from '@kapa/shared';

export class CommunityEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toListItem(
    record: {
      id: string;
      title: string;
      description: string;
      cep: number;
      start_at: Date;
      created_at: Date;
      volunteers: { volunteer_id: string }[];
      _count: { volunteers: number };
    },
  ): CommunityEventListItem {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      cep: record.cep,
      startAt: record.start_at.toISOString(),
      createdAt: record.created_at.toISOString(),
      isSignedUp: record.volunteers.length > 0,
      volunteerCount: record._count.volunteers,
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
        start_at: true,
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

  public async signUp(
    volunteerId: string,
    communityEventId: string,
  ): Promise<CommunityEventListItem> {
    const event = await this.prisma.communityEvents.findUnique({
      where: { id: communityEventId },
      select: { id: true, start_at: true },
    });

    if (!event) {
      throw new Error('COMMUNITY_EVENT_NOT_FOUND');
    }

    if (event.start_at.getTime() < Date.now()) {
      throw new Error('COMMUNITY_EVENT_CLOSED');
    }

    try {
      await this.prisma.communityEventVolunteers.create({
        data: {
          volunteer_id: volunteerId,
          community_event_id: communityEventId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error('COMMUNITY_EVENT_ALREADY_JOINED');
      }
      throw error;
    }

    const result = await this.prisma.communityEvents.findUnique({
      where: { id: communityEventId },
      select: {
        id: true,
        title: true,
        description: true,
        cep: true,
        start_at: true,
        created_at: true,
        volunteers: {
          where: { volunteer_id: volunteerId },
          select: { volunteer_id: true },
        },
        _count: { select: { volunteers: true } },
      },
    });

    if (!result) {
      throw new Error('COMMUNITY_EVENT_CLOSED');
    }

    return this.toListItem(result);
  }
}
