import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  CommunityEventType,
  UserRole,
  VolunteerApplication,
  VolunteerApplicationData,
  VolunteerApplicationStatus,
  VolunteerAvailability,
} from '@kapa/shared';

type VolunteerApplicationRecord = {
  id: string;
  user_id: string;
  status: VolunteerApplicationStatus;
  full_name: string;
  phone: string;
  areas_of_interest: CommunityEventType[];
  availability: VolunteerAvailability;
  motivation: string;
  accepts_terms: boolean;
  applied_at: Date;
  updated_at: Date;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    role: UserRole;
  } | null;
};

export class VolunteerApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(record: VolunteerApplicationRecord): VolunteerApplication {
    return {
      id: record.id,
      userId: record.user_id,
      status: record.status,
      application: {
        fullName: record.full_name,
        phone: record.phone,
        areasOfInterest: record.areas_of_interest,
        availability: record.availability,
        motivation: record.motivation,
        acceptsTerms: record.accepts_terms,
      },
      appliedAt: record.applied_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      user: record.user
        ? {
            id: record.user.id,
            username: record.user.username,
            email: record.user.email,
            avatar: record.user.avatar,
            role: record.user.role,
          }
        : undefined,
    };
  }

  public async create(
    userId: string,
    application: VolunteerApplicationData,
  ): Promise<VolunteerApplication> {
    try {
      const record = await this.prisma.$transaction(
        async (transaction) => {
          const user = await transaction.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
            },
          });

          if (!user) throw new Error('USER_NOT_FOUND');
          if (user.role !== 'adopter') {
            throw new Error('VOLUNTEER_ROLE_ALREADY_GRANTED');
          }

          const existing = await transaction.volunteerApplications.findFirst({
            where: {
              user_id: userId,
              status: 'pending',
            },
            select: { id: true },
          });

          if (existing) throw new Error('VOLUNTEER_APPLICATION_ALREADY_PENDING');

          return transaction.volunteerApplications.create({
            data: {
              user_id: userId,
              full_name: application.fullName,
              phone: application.phone,
              areas_of_interest: application.areasOfInterest,
              availability: application.availability,
              motivation: application.motivation,
              accepts_terms: application.acceptsTerms,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  avatar: true,
                  role: true,
                },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return this.toDTO(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new Error('VOLUNTEER_APPLICATION_RETRY');
      }
      throw error;
    }
  }

  public async findLatestByUserId(
    userId: string,
  ): Promise<VolunteerApplication | null> {
    const record = await this.prisma.volunteerApplications.findFirst({
      where: { user_id: userId },
      orderBy: { applied_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!record) return null;
    return this.toDTO(record);
  }

  public async listForAdmin(): Promise<VolunteerApplication[]> {
    const records = await this.prisma.volunteerApplications.findMany({
      orderBy: { applied_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return records.map((record) => this.toDTO(record));
  }

  public async updateStatus(
    id: string,
    status: Exclude<VolunteerApplicationStatus, 'pending'>,
  ): Promise<VolunteerApplication> {
    const record = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.volunteerApplications.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      if (!existing) {
        throw new Error('VOLUNTEER_APPLICATION_NOT_FOUND');
      }

      if (status === 'approved' && existing.user.role === 'adopter') {
        await transaction.user.update({
          where: { id: existing.user_id },
          data: { role: 'volunteer' },
        });
      }

      return transaction.volunteerApplications.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });
    });

    return this.toDTO(record);
  }
}
