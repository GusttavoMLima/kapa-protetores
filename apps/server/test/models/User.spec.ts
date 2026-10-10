import { User } from '../../src/models/User';

describe('User Domain Entity', () => {
  it('should initialize and set properties correctly', () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('AdopterJohn');
    user.setEmail('john@example.com');
    user.setAvatar('https://example.com/avatar.jpg');
    user.setRole('adopter');
    user.setRules(['adopter:read', 'user:read:own']);
    user.setLatitude(-23.5505);
    user.setLongitude(-46.6333);
    user.setCreatedAt(new Date().toISOString());

    expect(user.getUsername()).toBe('AdopterJohn');
    expect(user.getEmail().toString()).toBe('john@example.com');
    expect(user.getAvatar()?.toString()).toBe('https://example.com/avatar.jpg');
    expect(user.getRole()).toBe('adopter');
    expect(user.getLatitude()).toBe(-23.5505);
    expect(user.getLongitude()).toBe(-46.6333);
  });

  it('should reject username with less than 3 characters', () => {
    const user = new User();
    expect(() => {
      user.setUsername('ab');
    }).toThrow();
  });

  it('should clear avatar when null or empty is passed', () => {
    const user = new User();
    user.setAvatar('https://example.com/avatar.jpg');
    expect(user.getAvatar()).toBeTruthy();

    user.setAvatar(null);
    expect(user.getAvatar()).toBeNull();
  });

  it('should format clean DTO and JSON without sensitive fields', () => {
    const user = new User();
    user.setId('123e4567-e89b-12d3-a456-426614174000');
    user.setUsername('SafeUser');
    user.setEmail('safe@example.com');
    user.setPassword('super-secret-hashed-password');
    user.setRole('adopter');
    user.setRules(['user:read:own']);
    user.setCreatedAt(new Date().toISOString());

    const dto = user.toDTO();
    expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(dto.username).toBe('SafeUser');
    expect(dto.email).toBe('safe@example.com');
    expect((dto as unknown as { password?: string }).password).toBeUndefined();

    const json = user.toJSON();
    expect((json as unknown as { password?: string }).password).toBeUndefined();
  });

  it('should update rules when changing role', () => {
    const user = new User();
    user.setRole('adopter');
    user.setRules(['adopter:create', 'adopter:read']);
    user.setRole('volunteer');

    const rules = Array.from(user.getRules());
    expect(rules).toContain('volunteer:create');
    expect(rules).toContain('volunteer:read');
    expect(rules).not.toContain('adopter:create');
  });
});
