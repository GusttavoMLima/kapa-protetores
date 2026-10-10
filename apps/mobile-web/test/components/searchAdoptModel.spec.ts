import type { Animal } from '@kapa/shared';
import {
  searchAdoptSchema,
  defaultSearchAdoptFilters,
  matchesSearchAdoptFilters,
} from '../../src/components/forms/searchAdopt/model';

describe('Search Adopt Model', () => {
  const baseAnimal: Animal = {
    id: 'animal-1',
    name: 'Pipoca',
    breed: 'Vira-lata',
    species: 'dog',
    gender: 'female',
    size: 2, // Pequeno
    weightKg: 8,
    age: 2,
    ageStage: 1,
    energyLevel: 3,
    kidFriendly: 5,
    noiseLevel: 2,
    apartmentFriendly: true,
    otherPetFriendly: true,
    healthCondition: 'healthy',
    castrated: 'yes',
    vaccinated: true,
    dewormed: 'yes',
    rescuedAt: '2026-01-01T00:00:00.000Z',
    place: 'Centro',
    mood: 'Dócil e carinhosa',
    status: 'available',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('searchAdoptSchema validates defaults and expected types', () => {
    const result = searchAdoptSchema.parse({});
    expect(result).toEqual(defaultSearchAdoptFilters);

    const custom = searchAdoptSchema.parse({
      breed: 'poodle',
      specie: 'dog',
      gender: 'male',
      size: 'small',
    });
    expect(custom.breed).toBe('poodle');
    expect(custom.specie).toBe('dog');
    expect(custom.gender).toBe('male');
    expect(custom.size).toBe('small');
  });

  it('searchAdoptSchema rejects invalid enum values', () => {
    expect(searchAdoptSchema.safeParse({ specie: 'bird' }).success).toBe(false);
    expect(searchAdoptSchema.safeParse({ gender: 'unknown' }).success).toBe(false);
    expect(searchAdoptSchema.safeParse({ size: 'huge' }).success).toBe(false);
  });

  it('matchesSearchAdoptFilters filters by name or breed case-insensitively', () => {
    // Matches name
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        breed: 'pipo',
      }),
    ).toBe(true);

    // Matches breed
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        breed: 'VIRA-LATA',
      }),
    ).toBe(true);

    // Does not match
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        breed: 'Labrador',
      }),
    ).toBe(false);
  });

  it('matchesSearchAdoptFilters filters by species correctly', () => {
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        specie: 'all',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        specie: 'dog',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        specie: 'cat',
      }),
    ).toBe(false);
  });

  it('matchesSearchAdoptFilters filters by gender correctly', () => {
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        gender: 'all',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        gender: 'female',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        gender: 'male',
      }),
    ).toBe(false);
  });

  it('matchesSearchAdoptFilters filters by size correctly', () => {
    // baseAnimal has size: 2 (small)
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'small',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'medium',
      }),
    ).toBe(false);
    expect(
      matchesSearchAdoptFilters(baseAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'large',
      }),
    ).toBe(false);

    // Test animal with size 3 (medium) and size 4 (large)
    const mediumAnimal: Animal = { ...baseAnimal, size: 3 };
    expect(
      matchesSearchAdoptFilters(mediumAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'medium',
      }),
    ).toBe(true);
    expect(
      matchesSearchAdoptFilters(mediumAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'small',
      }),
    ).toBe(false);

    const largeAnimal: Animal = { ...baseAnimal, size: 4 };
    expect(
      matchesSearchAdoptFilters(largeAnimal, {
        ...defaultSearchAdoptFilters,
        size: 'large',
      }),
    ).toBe(true);
  });
});
