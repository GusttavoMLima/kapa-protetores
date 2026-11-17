import { animalEditorSchema, animalEditorUpdate, editorValues, managedAnimalSchema, managementPageSchema } from '../../src/screens/animalManagement/model';

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
    medicationNotes: '',
    rescuedAt: '10/10/2026',
    v10Doses: [],
    vacinaRaivaDoses: [],
    vermifugoDoses: [],
    energyLevel: 3,
    kidFriendly: 4,
    apartmentFriendly: false,
    otherPetFriendly: true,
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

  it('loads the saved histories and sends only modified dose lists', () => {
    const animal = managedAnimalSchema.parse({
      ...animalEditorSchema.parse(form),
      id: 'c000000000000000000000001',
      createdAt: '2026-10-11T00:00:00.000Z',
      ageStage: 2,
      noiseLevel: 3,
      v10Doses: [{ status: 'sim', data: '09/10/2026' }],
    });
    const initial = editorValues(animal);
    expect(initial.v10Doses).toEqual([{ status: 'sim', data: '09/10/2026' }]);
    expect(initial.vacinaRaivaDoses).toEqual([]);

    const unchanged = animalEditorUpdate(animal, animalEditorSchema.parse(initial));
    expect(unchanged.v10Doses).toBeUndefined();
    expect(unchanged.rescuedAt).toBeUndefined();
    expect(unchanged.dewormed).toBe('yes');

    const update = animalEditorUpdate(animal, animalEditorSchema.parse({
      ...initial,
      v10Doses: [{ status: 'nao' }],
      vermifugoDoses: [{ status: 'sim', data: '13/10/2026' }],
    }));
    expect(update).toMatchObject({
      v10Doses: [{ status: 'nao' }],
      vacinaRaivaDoses: undefined,
      vermifugoDoses: [{ status: 'sim', data: '13/10/2026' }],
      vaccinated: false,
      dewormed: 'yes',
    });
  });

  it('rejects invalid application dates and keeps unapplied doses free of date fields', () => {
    expect(animalEditorSchema.safeParse({ ...form, v10Doses: [{ status: 'sim', data: '31/02/2026' }] }).success).toBe(false);
    expect(animalEditorSchema.parse({ ...form, v10Doses: [{ status: 'nao', data: '10/10/2026' }] }).v10Doses)
      .toEqual([{ status: 'nao' }]);
  });
});
