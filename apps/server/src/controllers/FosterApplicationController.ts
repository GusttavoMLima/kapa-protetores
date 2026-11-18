import type { RequestHandler } from 'express';
import type { FosterApplication } from '@prisma/client';
import { z } from 'zod';
import { BadRequestError, UnauthorizedError } from '../errors';
import type { FosterApplicationService } from '../services/FosterApplicationService';

const submissionSchema = z.object({
  availableFrom: z.string().date(),
  availableUntil: z.string().date().nullable(),
  homeNotes: z.string().trim().min(1).max(2000),
  homeAddress: z.string().trim().min(1).max(500),
  hasOtherAnimals: z.boolean(),
  hasPerimeterBarrier: z.boolean(),
  hasSecureGate: z.boolean(),
}).strict().refine(({ availableFrom, availableUntil }) => availableUntil === null || availableUntil >= availableFrom);
const reviewSchema = z.object({ status: z.enum(['approved', 'rejected']) }).strict();
const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  availability: z.enum(['available', 'indefinite', 'ended']).optional(),
  search: z.string().trim().max(120).optional(),
}).strict();
const pageSize = 20;

function toView(application: FosterApplication) {
  return {
    id: application.id,
    availability: application.availability,
    availableFrom: application.available_from?.toISOString().slice(0, 10) ?? null,
    availableUntil: application.available_until?.toISOString().slice(0, 10) ?? null,
    homeNotes: application.home_notes,
    homeAddress: application.home_address,
    hasOtherAnimals: application.has_other_animals,
    hasPerimeterBarrier: application.has_perimeter_barrier,
    hasSecureGate: application.has_secure_gate,
    status: application.status,
    submittedAt: application.submitted_at.toISOString(),
    updatedAt: application.updated_at.toISOString(),
  };
}

export class FosterApplicationController {
  constructor(private readonly service: FosterApplicationService) {}

  private toApplicantView(application: FosterApplication) {
    return {
      ...toView(application),
      canEdit: application.status !== 'approved',
      canSubmitNew: this.service.canSubmitNew(application),
    };
  }

  public submit: RequestHandler = async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const parsed = submissionSchema.safeParse(req.body);
      if (!parsed.success) throw new BadRequestError('Preencha os dados do imóvel e informe um período de disponibilidade válido.');
      const application = await this.service.submit(req.user.sub, parsed.data);
      res.status(201).json({ success: true, data: this.toApplicantView(application) });
    } catch (error) { next(error); }
  };

  public getMine: RequestHandler = async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const application = await this.service.getMine(req.user.sub);
      res.json({ success: true, data: application ? this.toApplicantView(application) : null });
    } catch (error) { next(error); }
  };

  public edit: RequestHandler = async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = z.string().cuid().safeParse(req.params.id);
      const body = submissionSchema.safeParse(req.body);
      if (!id.success || !body.success) throw new BadRequestError('Preencha os dados do imóvel e informe um período de disponibilidade válido.');
      const application = await this.service.edit(req.user.sub, id.data, body.data);
      res.json({ success: true, data: this.toApplicantView(application) });
    } catch (error) { next(error); }
  };

  public list: RequestHandler = async (req, res, next) => {
    try {
      const parsed = listSchema.safeParse(req.query);
      if (!parsed.success) throw new BadRequestError('Filtros inválidos.');
      const { page, ...filters } = parsed.data;
      const { items, total } = await this.service.list(page, pageSize, filters);
      res.json({
        success: true,
        data: { items: items.map((item) => ({ ...toView(item), applicant: item.user })), total, pageSize },
      });
    } catch (error) { next(error); }
  };

  public review: RequestHandler = async (req, res, next) => {
    try {
      const id = z.string().cuid().safeParse(req.params.id);
      const body = reviewSchema.safeParse(req.body);
      if (!id.success || !body.success) throw new BadRequestError('Decisão inválida.');
      await this.service.review(id.data, body.data.status);
      res.json({ success: true, data: { status: body.data.status } });
    } catch (error) { next(error); }
  };
}
