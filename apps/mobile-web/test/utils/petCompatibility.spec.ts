import type { AdopterProfile, Animal } from '@kapa/shared';
import {
  calculatePetCompatibility,
  formatCompatibilityLabel,
  getCompatibilityTone,
} from '@/utils/petCompatibility';

const sampleAnimal: Animal = {
  id: 'pet-1',
  name: 'Luna',
  breed: 'SRD',
  species: 'dog',
  gender: 'female',
  weightKg: 12,
  age: 2,
  ageStage: 2,
  size: 3,
  energyLevel: 3,
  kidFriendly: 4,
  noiseLevel: 2,
  apartmentFriendly: true,
  otherPetFriendly: true,
  healthCondition: 'healthy',
  castrated: 'yes',
  vaccinated: true,
  dewormed: 'yes',
  rescuedAt: '2026-10-01T00:00:00.000Z',
  place: 'Abrigo Kapa',
  mood: 'Carinhosa',
  observations: null,
  status: 'available',
  createdAt: '2026-10-01T00:00:00.000Z',
  photos: [],
};

describe('petCompatibility', () => {
  it('returns null when profile is null or has no preferences set', () => {
    expect(calculatePetCompatibility(sampleAnimal, null)).toBeNull();
    expect(calculatePetCompatibility(sampleAnimal, undefined)).toBeNull();
    expect(
      calculatePetCompatibility(sampleAnimal, {
        id: 'prof-1',
        userId: 'user-1',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      }),
    ).toBeNull();
  });

  it('returns 100 when all specified preferences match the animal', () => {
    const profile: AdopterProfile = {
      id: 'prof-1',
      userId: 'user-1',
      preferredSpecies: 'dog',
      preferredGender: 'female',
      preferredSize: 3,
      preferredAgeStage: 2,
      preferredEnergy: 3,
      preferredKidFriendly: 4,
      preferredNoise: 2,
      livesInApartment: true,
      hasOtherPets: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    expect(calculatePetCompatibility(sampleAnimal, profile)).toBe(100);
  });

  it('penalizes species mismatch and environment incompatibility', () => {
    const nonApartmentPet: Animal = {
      ...sampleAnimal,
      apartmentFriendly: false,
      otherPetFriendly: false,
    };
    const profile: AdopterProfile = {
      id: 'prof-1',
      userId: 'user-1',
      preferredSpecies: 'cat',
      livesInApartment: true,
      hasOtherPets: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };

    // scores: species=0, apartment=0.2, otherPets=0.2 => avg 0.4/3 = 13%
    expect(calculatePetCompatibility(nonApartmentPet, profile)).toBe(13);
  });

  it('maps compatibility scores to tones and labels', () => {
    expect(getCompatibilityTone(90)).toBe('high');
    expect(getCompatibilityTone(65)).toBe('medium');
    expect(getCompatibilityTone(30)).toBe('low');
    expect(formatCompatibilityLabel(88)).toBe('88% compatível');
  });
});
