import { Router, Request, Response } from 'express';
import type { Animal } from '@kapa/shared';

export const animalsRouter = Router();

// In-memory placeholder/mock list
const animals: Animal[] = [];

animalsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ data: animals, count: animals.length });
});

animalsRouter.post('/', (req: Request, res: Response) => {
  const animal: Animal = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  animals.unshift(animal);
  res.status(201).json({ message: 'Animal cadastrado com sucesso', data: animal });
});
