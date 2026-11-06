import type { AdopterProfile, Animal } from '@kapa/shared';

const MAX_SIZE_DIFF = 4;
const MAX_AGE_STAGE_DIFF = 3;
const MAX_SCALE_DIFF = 4;
const ENVIRONMENT_MISMATCH_SCORE = 0.2;

export type CompatibilityTone = 'high' | 'medium' | 'low';

export function calculatePetCompatibility(
  animal: Animal,
  profile: AdopterProfile | null | undefined,
): number | null {
  if (!profile) {
    return null;
  }

  const scores: number[] = [];

  if (profile.preferredSpecies) {
    scores.push(profile.preferredSpecies === animal.species ? 1 : 0);
  }

  if (profile.preferredGender) {
    scores.push(profile.preferredGender === animal.gender ? 1 : 0);
  }

  if (typeof profile.preferredSize === 'number') {
    const diff = Math.min(
      MAX_SIZE_DIFF,
      Math.abs(profile.preferredSize - animal.size),
    );
    scores.push(1 - diff / MAX_SIZE_DIFF);
  }

  if (typeof profile.preferredAgeStage === 'number') {
    const diff = Math.min(
      MAX_AGE_STAGE_DIFF,
      Math.abs(profile.preferredAgeStage - animal.ageStage),
    );
    scores.push(1 - diff / MAX_AGE_STAGE_DIFF);
  }

  if (typeof profile.preferredEnergy === 'number') {
    const diff = Math.min(
      MAX_SCALE_DIFF,
      Math.abs(profile.preferredEnergy - animal.energyLevel),
    );
    scores.push(1 - diff / MAX_SCALE_DIFF);
  }

  if (typeof profile.preferredKidFriendly === 'number') {
    const diff = Math.min(
      MAX_SCALE_DIFF,
      Math.abs(profile.preferredKidFriendly - animal.kidFriendly),
    );
    scores.push(1 - diff / MAX_SCALE_DIFF);
  }

  if (typeof profile.preferredNoise === 'number') {
    const diff = Math.min(
      MAX_SCALE_DIFF,
      Math.abs(profile.preferredNoise - animal.noiseLevel),
    );
    scores.push(1 - diff / MAX_SCALE_DIFF);
  }

  if (typeof profile.livesInApartment === 'boolean') {
    scores.push(
      !profile.livesInApartment || animal.apartmentFriendly
        ? 1
        : ENVIRONMENT_MISMATCH_SCORE,
    );
  }

  if (typeof profile.hasOtherPets === 'boolean') {
    scores.push(
      !profile.hasOtherPets || animal.otherPetFriendly
        ? 1
        : ENVIRONMENT_MISMATCH_SCORE,
    );
  }

  if (scores.length === 0) {
    return null;
  }

  const average = scores.reduce((sum, item) => sum + item, 0) / scores.length;
  return Math.max(0, Math.min(100, Math.round(average * 100)));
}

export function getCompatibilityTone(score: number): CompatibilityTone {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function formatCompatibilityLabel(score: number): string {
  return `${score}% compatível`;
}
