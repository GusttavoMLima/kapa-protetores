import { Prisma, type FosterApplication, type PrismaClient } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../errors';

type FosterApplicationInput = {
  availableFrom: string;
  availableUntil: string | null;
  homeNotes?: string | null;
  homeAddress: string;
  hasOtherAnimals: boolean;
  hasPerimeterBarrier: boolean;
  hasSecureGate: boolean;
};

const applicationOrder = [{ submitted_at: 'desc' }, { id: 'desc' }] satisfies Prisma.FosterApplicationOrderByWithRelationInput[];
const saoPauloDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

function applicationData(input: FosterApplicationInput) {
  return {
    availability: null,
    available_from: new Date(input.availableFrom),
    available_until: input.availableUntil ? new Date(input.availableUntil) : null,
    home_notes: input.homeNotes ?? '',
    home_address: input.homeAddress,
    has_other_animals: input.hasOtherAnimals,
    has_perimeter_barrier: input.hasPerimeterBarrier,
    has_secure_gate: input.hasSecureGate,
  };
}

export class FosterApplicationService {
  constructor(private readonly prisma: PrismaClient, private readonly now = () => new Date()) {}

  public canSubmitNew(application: FosterApplication): boolean {
    return application.available_until !== null
      && application.available_until.toISOString().slice(0, 10) < saoPauloDate.format(this.now());
  }

  private validateCurrentPeriod(application: FosterApplicationInput) {
    if (application.availableUntil && application.availableUntil < saoPauloDate.format(this.now())) {
      throw new BadRequestError('A data final da disponibilidade já passou.');
    }
  }

  public async submit(userId: string, application: FosterApplicationInput) {
    this.validateCurrentPeriod(application);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const latest = await this.getMine(userId, transaction);
        if (latest && !this.canSubmitNew(latest)) {
          throw new ConflictError('Sua última candidatura ainda não chegou ao fim da disponibilidade.');
        }
        return transaction.fosterApplication.create({
          data: { user_id: userId, ...applicationData(application) },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') throw new ConflictError('Sua candidatura mudou. Confira os dados e tente novamente.');
        if (error.code === 'P2003') throw new UnauthorizedError();
      }
      throw error;
    }
  }

  public getMine(userId: string, database: Pick<PrismaClient, 'fosterApplication'> = this.prisma) {
    return database.fosterApplication.findFirst({ where: { user_id: userId }, orderBy: applicationOrder });
  }

  public async edit(userId: string, id: string, application: FosterApplicationInput) {
    this.validateCurrentPeriod(application);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const latest = await this.getMine(userId, transaction);
        if (!latest || latest.id !== id) throw new NotFoundError('Candidatura não encontrada.');
        if (latest.status === 'approved') throw new ConflictError('Uma candidatura aprovada não pode ser editada.');

        return transaction.fosterApplication.update({
          where: { id, user_id: userId, status: { not: 'approved' } },
          data: { ...applicationData(application), status: 'pending' },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2025', 'P2034'].includes(error.code)) {
        throw new ConflictError('Sua candidatura mudou. Confira os dados e tente novamente.');
      }
      throw error;
    }
  }

  public async list(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.fosterApplication.findMany({
        orderBy: applicationOrder,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { username: true, email: true } } },
      }),
      this.prisma.fosterApplication.count(),
    ]);
    return { items, total };
  }

  public async review(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const result = await this.prisma.fosterApplication.updateMany({
      where: { id, status: 'pending' },
      data: { status },
    });
    if (result.count) return;
    const existing = await this.prisma.fosterApplication.findUnique({ where: { id }, select: { status: true } });
    if (!existing) throw new NotFoundError('Candidatura não encontrada.');
    if (existing.status !== status) throw new ConflictError('A candidatura já foi analisada.');
  }
}
