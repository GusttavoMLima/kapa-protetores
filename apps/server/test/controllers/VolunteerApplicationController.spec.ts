import type { Request, Response } from 'express';
import { VolunteerApplicationController } from '../../src/controllers/VolunteerApplicationController';
import { ConflictError } from '../../src/errors';
import type { VolunteerApplicationService } from '../../src/services/VolunteerApplicationService';

describe('VolunteerApplicationController.updatePending', () => {
  const id = 'c000000000000000000000001';
  const application = {
    fullName: 'Maria Teste', phone: '19999998888', areasOfInterest: ['care'],
    availability: 'weekends', motivation: 'Quero ajudar no cuidado dos animais.', acceptsTerms: true,
  };
  const user = { sub: 'applicant' };
  const updatePending = jest.fn();
  const controller = new VolunteerApplicationController({ updatePending } as unknown as VolunteerApplicationService);

  beforeEach(() => updatePending.mockReset());

  async function request(input: { user?: typeof user; params?: { id: string }; body?: unknown }) {
    const json = jest.fn();
    const next = jest.fn();
    await controller.updatePending(input as unknown as Request, { json } as unknown as Response, next);
    return { json, next };
  }

  it.each([
    [{ params: { id }, body: application }, 401],
    [{ user, params: { id: 'inválido' }, body: application }, 400],
    [{ user, params: { id }, body: { ...application, status: 'approved' } }, 400],
  ])('rejects invalid requests without updating an application', async (input, statusCode) => {
    const { json, next } = await request(input);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode }));
    expect(json).not.toHaveBeenCalled();
    expect(updatePending).not.toHaveBeenCalled();
  });

  it('uses the authenticated owner and returns the saved application', async () => {
    const saved = { id, userId: user.sub, status: 'pending', application };
    updatePending.mockResolvedValue(saved);
    const { json, next } = await request({ user, params: { id }, body: application });
    expect(updatePending).toHaveBeenCalledWith(id, user.sub, application);
    expect(json).toHaveBeenCalledWith({ success: true, data: saved });
    expect(next).not.toHaveBeenCalled();
  });

  it('preserves the conflict response when review has already happened', async () => {
    const conflict = new ConflictError('A equipe já analisou esta solicitação.');
    updatePending.mockRejectedValue(conflict);
    const { json, next } = await request({ user, params: { id }, body: application });
    expect(next).toHaveBeenCalledWith(conflict);
    expect(json).not.toHaveBeenCalled();
  });
});
