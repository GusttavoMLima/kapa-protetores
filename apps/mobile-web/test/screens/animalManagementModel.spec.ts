import { animalEditorSchema, managementPageSchema } from '../../src/screens/animalManagement/model';

describe('Animal Management Model', () => {
  const form = {
    name: 'Amora',
    breed: '',
    species: 'cat',
    gender: 'female',
    age: '2',
    weightKg: '4,5',
    size: 2,
    status: 'rescued',
    healthCondition: 'healthy',
    castrated: 'unknown',
    dewormed: 'yes',
    vaccinated: true,
    mood: 'Tranquila',
    place: '',
    observations: 'Anotações internas',
  };

  it('editor accepts Brazilian decimal weights and does not send hidden fields', () => {
    const input = animalEditorSchema.parse({ ...form, ageStage: 9, photos: [] });
    expect(input.weightKg).toBe(4.5);
    expect(input.age).toBe(2);
    expect('ageStage' in input).toBe(false);
    expect('photos' in input).toBe(false);
  });

  it('editor rejects blank, invalid, negative and out of range values', () => {
    for (const patch of [
      { name: ' ' },
      { age: '' },
      { age: '1.5' },
      { weightKg: '-2' },
      { weightKg: '501' },
      { weightKg: 'abc' },
      { mood: '' },
    ]) {
      expect(animalEditorSchema.safeParse({ ...form, ...patch }).success).toBe(false);
    }
  });

  it('page validation accepts empty state and rejects malformed data', () => {
    const page = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      counts: { rescued: 0, treating: 0, available: 0, adopted: 0 },
    };
    expect(managementPageSchema.safeParse(page).success).toBe(true);
    expect(
      managementPageSchema.safeParse({ ...page, items: [{ name: 'Missing required fields' }] }).success,
    ).toBe(false);
  });
});
