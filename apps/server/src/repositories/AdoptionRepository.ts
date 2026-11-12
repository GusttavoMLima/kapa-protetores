import { Prisma, PrismaClient } from '@prisma/client';
import type {
  Adoption,
  AdoptionApplication,
  UpdateAdoptionStatusInput,
} from '@kapa/shared';

const ADOPTION_TRANSACTION_MAX_WAIT_MS = 15000;
const ADOPTION_TRANSACTION_TIMEOUT_MS = 30000;
const ADOPTION_METADATA_SELECT = {
  id: true,
  adopter_id: true,
  animal_id: true,
  status: true,
  applied_at: true,
  updated_at: true,
  application_data: true,
  admin_note: true,
  contract_sent_at: true,
  signed_contract_file_name: true,
  signed_contract_uploaded_at: true,
} as const;

type AdoptionRecord = {
  id: string;
  adopter_id: string;
  animal_id: string;
  status: Adoption['status'];
  applied_at: Date;
  updated_at: Date;
  application_data: unknown;
  admin_note: string | null;
  contract_sent_at: Date | null;
  signed_contract_file_name: string | null;
  signed_contract_uploaded_at: Date | null;
};

export class AdoptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(record: AdoptionRecord, includeAdminNote = false): Adoption {
    return {
      id: record.id,
      adopterId: record.adopter_id,
      animalId: record.animal_id,
      status: record.status,
      appliedAt: record.applied_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      application: (record.application_data ?? undefined) as AdoptionApplication | undefined,
      contractSentAt: record.contract_sent_at?.toISOString() ?? null,
      signedContractUploadedAt:
        record.signed_contract_uploaded_at?.toISOString() ?? null,
      ...(includeAdminNote
        ? {
            adminNote: record.admin_note,
            signedContractFileName: record.signed_contract_file_name,
          }
        : {}),
    };
  }

  public async create(adopterId: string, animalId: string, application: AdoptionApplication): Promise<Adoption> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
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
              data: {
                adopter_id: adopterId,
                animal_id: animalId,
                application_data: application as unknown as Prisma.InputJsonValue,
              },
              select: ADOPTION_METADATA_SELECT,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: ADOPTION_TRANSACTION_MAX_WAIT_MS,
            timeout: ADOPTION_TRANSACTION_TIMEOUT_MS,
          },
        );

        return this.toDTO(record);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2028') &&
          attempt < 2
        ) {
          continue;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          throw new Error('ADOPTION_RETRY');
        }
        throw error;
      }
    }

    throw new Error('ADOPTION_RETRY');
  }

  public async listForAdmin(): Promise<Adoption[]> {
    const records = await this.prisma.adoptions.findMany({
      orderBy: { applied_at: 'desc' },
      select: {
        ...ADOPTION_METADATA_SELECT,
        animal: { include: { photos: true } },
        adopter: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            rules: true,
            created_at: true,
          },
        },
      },
    });

    return records.map((record) => ({
      ...this.toDTO(record, true),
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
      select: {
        ...ADOPTION_METADATA_SELECT,
        animal: { include: { photos: true } },
      },
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

  public async findById(id: string): Promise<Adoption | null> {
    const record = await this.prisma.adoptions.findUnique({
      where: { id },
      select: ADOPTION_METADATA_SELECT,
    });

    return record ? this.toDTO(record, true) : null;
  }

  public async updateWorkflow(
    id: string,
    input: UpdateAdoptionStatusInput,
  ): Promise<Adoption> {
    const record = await this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.adoptions.findUnique({
          where: { id },
          select: { id: true, animal_id: true },
        });

        if (!existing) throw new Error('ADOPTION_NOT_FOUND');

        if (input.status === 'approved') {
          const animalUpdate = await transaction.animal.updateMany({
            where: { id: existing.animal_id, status: 'available' },
            data: { status: 'adopted' },
          });

          if (animalUpdate.count === 0) {
            throw new Error('ANIMAL_NOT_AVAILABLE');
          }
        }

        return transaction.adoptions.update({
          where: { id },
          data: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.adminNote !== undefined ? { admin_note: input.adminNote } : {}),
            ...(input.contractSent === true
              ? { contract_sent_at: new Date() }
              : input.contractSent === false
                ? { contract_sent_at: null }
                : {}),
          },
          select: {
            ...ADOPTION_METADATA_SELECT,
            animal: { include: { photos: true } },
            adopter: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
                rules: true,
                created_at: true,
              },
            },
          },
        });
      },
      {
        maxWait: ADOPTION_TRANSACTION_MAX_WAIT_MS,
        timeout: ADOPTION_TRANSACTION_TIMEOUT_MS,
      },
    );

    return {
      ...this.toDTO(record, true),
      ...(record.animal
        ? {
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
          }
        : {}),
      ...(record.adopter
        ? {
            adopter: {
              id: record.adopter.id,
              username: record.adopter.username,
              email: record.adopter.email,
              role: record.adopter.role,
              rules: record.adopter.rules,
              createdAt: record.adopter.created_at.toISOString(),
            },
          }
        : {}),
    } as unknown as Adoption;
  }

  public async saveSignedContract(
    id: string,
    fileName: string,
    data: Uint8Array<ArrayBuffer>,
  ): Promise<Adoption> {
    try {
      const record = await this.prisma.adoptions.update({
        where: { id },
        data: {
          signed_contract_data: data,
          signed_contract_file_name: fileName,
          signed_contract_uploaded_at: new Date(),
        },
        select: ADOPTION_METADATA_SELECT,
      });

      return this.toDTO(record, true);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error('ADOPTION_NOT_FOUND');
      }
      throw error;
    }
  }

  public async findSignedContract(
    id: string,
  ): Promise<{ data: Buffer; fileName: string } | null> {
    const record = await this.prisma.adoptions.findUnique({
      where: { id },
      select: {
        signed_contract_data: true,
        signed_contract_file_name: true,
      },
    });

    if (!record?.signed_contract_data || !record.signed_contract_file_name) {
      return null;
    }

    return {
      data: Buffer.from(record.signed_contract_data),
      fileName: record.signed_contract_file_name,
    };
  }
}
