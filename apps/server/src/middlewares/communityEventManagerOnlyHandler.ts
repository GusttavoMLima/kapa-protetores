import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/PrismaService';
import { AppError } from '../errors';

export async function communityEventManagerOnlyHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth) {
    next(AppError.unauthorized());
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true },
    });

    if (!user) {
      next(AppError.unauthorized());
      return;
    }

    if (user.role !== 'admin' && user.role !== 'protector') {
      next(AppError.forbidden());
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
