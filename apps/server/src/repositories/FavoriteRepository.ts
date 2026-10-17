import { PrismaClient } from '@prisma/client';

export class FavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async toggle(userId: string, animalId: string): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const animal = await transaction.animal.findUnique({ where: { id: animalId }, select: { id: true } });
      if (!animal) throw new Error('ANIMAL_NOT_FOUND');

      const where = { user_id_animal_id: { user_id: userId, animal_id: animalId } };
      const favorite = await transaction.favorites.findUnique({ where, select: { user_id: true } });
      if (favorite) {
        await transaction.favorites.delete({ where });
        return false;
      }

      await transaction.favorites.create({ data: { user_id: userId, animal_id: animalId } });
      return true;
    });
  }
}
