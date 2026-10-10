import { AdopterProfile } from '../../src/models/AdopterProfile';
import { UUID } from '../../src/domains/UUID';
import { ValidationError } from '../../src/errors';

describe('AdopterProfile Domain Entity', () => {
  it('should initialize and set properties correctly', () => {
    const profile = new AdopterProfile();
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const userId = '987fcdeb-51a2-43f7-9abc-def012345678';

    profile.setId(id);
    profile.setUserId(userId);
    profile.setPreferredSpecies('dog');
    profile.setPreferredGender('female');
    profile.setPreferredSize(3);
    profile.setPreferredEnergy(4);
    profile.setPreferredKidFriendly(5);
    profile.setPreferredNoise(2);
    profile.setPreferredAgeStage(2);
    profile.setLivesInApartment(true);
    profile.setHasOtherPets(false);
    profile.setCreatedAt('2026-10-07T12:00:00.000Z');
    profile.setUpdatedAt('2026-10-07T12:30:00.000Z');

    expect(profile.getId().getValue()).toBe(id);
    expect(profile.getUserId().getValue()).toBe(userId);
    expect(profile.getPreferredSpecies()).toBe('dog');
    expect(profile.getPreferredGender()).toBe('female');
    expect(profile.getPreferredSize()).toBe(3);
    expect(profile.getPreferredEnergy()).toBe(4);
    expect(profile.getPreferredKidFriendly()).toBe(5);
    expect(profile.getPreferredNoise()).toBe(2);
    expect(profile.getPreferredAgeStage()).toBe(2);
    expect(profile.getLivesInApartment()).toBe(true);
    expect(profile.getHasOtherPets()).toBe(false);
    expect(profile.getCreatedAt()).toBe('2026-10-07T12:00:00.000Z');
    expect(profile.getUpdatedAt()).toBe('2026-10-07T12:30:00.000Z');
  });

  it('should accept UUID domain instances in setId and setUserId', () => {
    const profile = new AdopterProfile();
    const idDomain = UUID.create('123e4567-e89b-12d3-a456-426614174000');
    const userDomain = UUID.create('987fcdeb-51a2-43f7-9abc-def012345678');

    profile.setId(idDomain);
    profile.setUserId(userDomain);

    expect(profile.getId().getValue()).toBe(idDomain.getValue());
    expect(profile.getUserId().getValue()).toBe(userDomain.getValue());
  });

  it('should not overwrite id or userId once set', () => {
    const profile = new AdopterProfile();
    const id1 = '123e4567-e89b-12d3-a456-426614174000';
    const id2 = '00000000-0000-0000-0000-000000000000';

    profile.setId(id1);
    profile.setId(id2);
    expect(profile.getId().getValue()).toBe(id1);

    profile.setUserId(id1);
    profile.setUserId(id2);
    expect(profile.getUserId().getValue()).toBe(id1);
  });

  it('should reject negative numeric values with ValidationError', () => {
    const profile = new AdopterProfile();

    expect(() => profile.setPreferredSize(-1)).toThrow(ValidationError);
    expect(() => profile.setPreferredEnergy(-2)).toThrow(ValidationError);
    expect(() => profile.setPreferredKidFriendly(-1)).toThrow(ValidationError);
    expect(() => profile.setPreferredNoise(-5)).toThrow(ValidationError);
    expect(() => profile.setPreferredAgeStage(-1)).toThrow(ValidationError);
  });

  it('should allow null for optional preferences', () => {
    const profile = new AdopterProfile();
    profile.setPreferredSpecies(null);
    profile.setPreferredGender(null);
    profile.setPreferredSize(null);
    profile.setPreferredEnergy(null);
    profile.setPreferredKidFriendly(null);
    profile.setPreferredNoise(null);
    profile.setPreferredAgeStage(null);
    profile.setLivesInApartment(null);
    profile.setHasOtherPets(null);

    expect(profile.getPreferredSpecies()).toBeNull();
    expect(profile.getPreferredGender()).toBeNull();
    expect(profile.getPreferredSize()).toBeNull();
    expect(profile.getPreferredEnergy()).toBeNull();
    expect(profile.getPreferredKidFriendly()).toBeNull();
    expect(profile.getPreferredNoise()).toBeNull();
    expect(profile.getPreferredAgeStage()).toBeNull();
    expect(profile.getLivesInApartment()).toBeNull();
    expect(profile.getHasOtherPets()).toBeNull();
  });

  it('should produce correct DTO and JSON output', () => {
    const profile = new AdopterProfile();
    profile.setId('123e4567-e89b-12d3-a456-426614174000');
    profile.setUserId('987fcdeb-51a2-43f7-9abc-def012345678');
    profile.setPreferredSpecies('cat');
    profile.setPreferredGender('male');
    profile.setPreferredSize(2);
    profile.setPreferredEnergy(3);
    profile.setPreferredKidFriendly(4);
    profile.setPreferredNoise(1);
    profile.setPreferredAgeStage(1);
    profile.setLivesInApartment(true);
    profile.setHasOtherPets(true);
    profile.setCreatedAt('2026-10-07T10:00:00.000Z');
    profile.setUpdatedAt('2026-10-07T10:05:00.000Z');

    const dto = profile.toDTO();
    expect(dto).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '987fcdeb-51a2-43f7-9abc-def012345678',
      preferredSpecies: 'cat',
      preferredGender: 'male',
      preferredSize: 2,
      preferredEnergy: 3,
      preferredKidFriendly: 4,
      preferredNoise: 1,
      preferredAgeStage: 1,
      livesInApartment: true,
      hasOtherPets: true,
      createdAt: '2026-10-07T10:00:00.000Z',
      updatedAt: '2026-10-07T10:05:00.000Z',
    });

    expect(profile.toJSON()).toEqual(dto);
  });
});
