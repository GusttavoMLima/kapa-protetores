import { Prisma, type PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors';

type FosterApplicationInput = {
  availability: string;
  homeNotes: string;
  homeAddress: string;
  hasOtherAnimals: boolean;
  hasPerimeterBarrier: boolean;
  hasSecureGate: boolean;
};

export class FosterApplicationService {
  constructor(private readonly prisma: PrismaClient) {}

  public async submit(userId: string, application: FosterApplicationInput) {
    try {
      return await this.prisma.fosterApplication.create({
        data: {
          user_id: userId,
          availability: application.availability,
          home_notes: application.homeNotes,
          home_address: application.homeAddress,
          has_other_animals: application.hasOtherAnimals,
          has_perimeter_barrier: application.hasPerimeterBarrier,
          has_secure_gate: application.hasSecureGate,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictError('Você já enviou uma candidatura.');
        if (error.code === 'P2003') throw new UnauthorizedError();
      }
      throw error;
    }
  }

  public getMine(userId: string) {
    return this.prisma.fosterApplication.findUnique({ where: { user_id: userId } });
  }

  public async list(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.fosterApplication.findMany({
        orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }],
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
