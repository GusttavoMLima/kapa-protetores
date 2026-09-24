import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/PrismaService';

export async function volunteerOnlyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Autenticação necessária.' });
    return;
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'volunteer') {
      res.status(403).json({
        success: false,
        error: 'Acesso permitido somente a voluntários.',
      });
      return;
    }
  } catch (error) {
    next(error);
    return;
  }

  next();
}
