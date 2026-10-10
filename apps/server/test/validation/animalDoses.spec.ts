import { doseRecordsSchema, updateAnimalSchema } from '../../src/validation/schemas';

describe('animal dose history validation', () => {
  it('preserves dose order, applied dates and unapplied doses', () => {
    const doses = [{ status: 'sim', data: '29/02/2024' }, { status: 'nao' }];
    expect(doseRecordsSchema.parse(doses)).toEqual(doses);
    expect(updateAnimalSchema.parse({ v10Doses: [] })).toEqual({ v10Doses: [] });
  });

  it.each([
    [{ status: 'sim' }], [{ status: 'sim', data: '31/02/2026' }],
    [{ status: 'sim', data: '29/02/2025' }], [{ status: 'sim', data: '2026-01-01' }],
    [{ status: 'nao', data: '01/01/2026' }], [{ status: 'unknown' }],
    [{ status: 'nao', animalId: 'another-animal' }], Array(101).fill({ status: 'nao' }),
  ])('rejects malformed or oversized dose history %#', (...doses) => {
    expect(doseRecordsSchema.safeParse(doses).success).toBe(false);
  });
});
