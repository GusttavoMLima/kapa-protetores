import { Prisma, PrismaClient } from '@prisma/client';
import type { Adoption, AdoptionApplication } from '@kapa/shared';

type AdoptionRecord = {
  id: string;
  adopter_id: string;
  animal_id: string;
  status: Adoption['status'];
  applied_at: Date;
  updated_at: Date;
  application_data: unknown;
};

export class AdoptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(record: AdoptionRecord): Adoption {
    return {
      id: record.id,
      adopterId: record.adopter_id,
      animalId: record.animal_id,
      status: record.status,
      appliedAt: record.applied_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      application: (record.application_data ?? undefined) as AdoptionApplication | undefined,
    };
  }

  public async create(adopterId: string, animalId: string, application: AdoptionApplication): Promise<Adoption> {
    try {
      const record = await this.prisma.$transaction(
        async (transaction) => {
          const animal = await transaction.animal.findUnique({
            where: { id: animalId },
            select: { id: true, status: true },
          });

          if (!animal) throw new Error('ANIMAL_NOT_FOUND');
          if (animal.status !== 'available') throw new Error('ANIMAL_NOT_AVAILABLE');

          const existing = await transaction.adoptions.findFirst({
            where: {
              adopter_id: adopterId,
              animal_id: animalId,
              status: { in: ['pending', 'interviewing', 'approved'] },
            },
            select: { id: true },
          });

          if (existing) throw new Error('ADOPTION_ALREADY_REQUESTED');

          return transaction.adoptions.create({
            data: { adopter_id: adopterId, animal_id: animalId, application_data: application as unknown as Prisma.InputJsonValue },
            select: {
              id: true,
              adopter_id: true,
              animal_id: true,
              status: true,
              applied_at: true,
              updated_at: true,
              application_data: true,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return this.toDTO(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new Error('ADOPTION_RETRY');
      }
      throw error;
    }
  }

  public async listForAdmin(): Promise<Adoption[]> {
    const records = await this.prisma.adoptions.findMany({
      orderBy: { applied_at: 'desc' },
      include: {
        animal: { include: { photos: true } },
        adopter: { select: { id: true, username: true, email: true, role: true, rules: true, created_at: true } },
      },
    });

    return records.map((record) => ({
      ...this.toDTO(record),
      animal: {
        ...record.animal,
        weightKg: Number(record.animal.weight_kg),
        rescuedAt: record.animal.rescued_at.toISOString(),
        createdAt: record.animal.created_at.toISOString(),
        photos: record.animal.photos.map((photo) => ({ id: photo.id, photoUrl: photo.photo_url, uploadedAt: photo.uploaded_at.toISOString() })),
      },
      adopter: {
        id: record.adopter.id,
        username: record.adopter.username,
        email: record.adopter.email,
        role: record.adopter.role,
        rules: record.adopter.rules,
        createdAt: record.adopter.created_at.toISOString(),
      },
    })) as unknown as Adoption[];
  }

  public async listForAdopter(adopterId: string): Promise<Adoption[]> {
    const records = await this.prisma.adoptions.findMany({
      where: { adopter_id: adopterId },
      orderBy: { applied_at: 'desc' },
      include: { animal: { include: { photos: true } } },
    });

    return records.map((record) => ({
      ...this.toDTO(record),
      animal: {
        ...record.animal,
        weightKg: Number(record.animal.weight_kg),
        rescuedAt: record.animal.rescued_at.toISOString(),
        createdAt: record.animal.created_at.toISOString(),
        photos: record.animal.photos.map((photo) => ({
          id: photo.id,
          photoUrl: photo.photo_url,
          uploadedAt: photo.uploaded_at.toISOString(),
        })),
      },
    })) as unknown as Adoption[];
  }

  public async updateStatus(id: string, status: Adoption['status']): Promise<Adoption> {
    const record = await this.prisma.adoptions.update({
      where: { id },
      data: { status },
      select: { id: true, adopter_id: true, animal_id: true, status: true, applied_at: true, updated_at: true, application_data: true },
    });
    return this.toDTO(record);
  }
}
