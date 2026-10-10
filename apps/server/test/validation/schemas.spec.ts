import { adminCreateUserSchema, registerSchema as publicRegisterSchema } from '../../src/validation/schemas';
import {
  userIdParams,
  updateProfileSchema,
  updateRoleSchema,
  updateUserPasswordSchema,
  signInSchema,
  registerSchema,
} from '../../src/schemas/user.schema';
import { googleAuthSchema } from '../../src/schemas/auth.schema';
import type { UserRole } from '@kapa/shared';

describe('Admin User Creation Schema', () => {
  const baseUser = {
    username: 'Pessoa Teste',
    email: 'pessoa@example.com',
    password: 'senha-segura-123',
  };

  it('admin user creation accepts every role defined by the database', () => {
    for (const role of ['adopter', 'protector', 'admin', 'volunteer']) {
      expect(adminCreateUserSchema.safeParse({ ...baseUser, role }).success).toBe(true);
    }
  });

  it('admin user creation rejects an unknown role', () => {
    expect(adminCreateUserSchema.safeParse({ ...baseUser, role: 'owner' }).success).toBe(false);
  });
});

describe('User Schema Validation', () => {
  it('should validate userIdParams correctly', () => {
    const valid = userIdParams.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' });
    expect(valid.success).toBe(true);

    const invalid = userIdParams.safeParse({});
    expect(invalid.success).toBe(false);
  });

  it('should validate updateProfileSchema with valid data', () => {
    const valid = updateProfileSchema.safeParse({
      username: 'UpdatedUser',
      avatar: 'https://example.com/new-avatar.png',
      latitude: -23.55,
      longitude: -46.63,
    });
    expect(valid.success).toBe(true);
  });

  it('should allow partial update in updateProfileSchema', () => {
    const valid = updateProfileSchema.safeParse({
      username: 'OnlyUsername',
    });
    expect(valid.success).toBe(true);
  });

  it('should reject invalid coordinates in updateProfileSchema', () => {
    const invalidLat = updateProfileSchema.safeParse({ latitude: 100 });
    expect(invalidLat.success).toBe(false);

    const invalidLng = updateProfileSchema.safeParse({ longitude: 200 });
    expect(invalidLng.success).toBe(false);
  });

  it('should validate updateRoleSchema correctly', () => {
    const validRoles: UserRole[] = ['adopter', 'protector', 'admin', 'volunteer'];
    for (const role of validRoles) {
      const res = updateRoleSchema.safeParse({ role });
      expect(res.success).toBe(true);
    }

    const invalid = updateRoleSchema.safeParse({ role: 'invalid_role' });
    expect(invalid.success).toBe(false);
  });

  it('should validate updateUserPasswordSchema with min length constraint', () => {
    const invalidShort = updateUserPasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: '123',
    });
    expect(invalidShort.success).toBe(false);

    const valid = updateUserPasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: 'validNewPassword123',
    });
    expect(valid.success).toBe(true);
  });

  it('should validate signInSchema correctly', () => {
    // Missing fields
    expect(signInSchema.safeParse({}).success).toBe(false);

    // Invalid email
    expect(signInSchema.safeParse({ email: 'not-an-email', password: '123' }).success).toBe(false);

    // Empty password
    expect(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false);

    // Valid with lowercased email
    const valid = signInSchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'mypassword',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('user@example.com');
      expect(valid.data.password).toBe('mypassword');
    }
  });

  it('should validate registerSchema correctly', () => {
    // Too short username
    expect(
      registerSchema.safeParse({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      }).success,
    ).toBe(false);

    // Too short password
    expect(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: '123',
      }).success,
    ).toBe(false);

    // Invalid avatar URL
    expect(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: 'password123',
        avatar: 'not-a-valid-url',
      }).success,
    ).toBe(false);

    // Empty string avatar should transform to null
    const emptyAvatar = registerSchema.safeParse({
      username: 'validuser',
      email: 'test@example.com',
      password: 'password123',
      avatar: '',
    });
    expect(emptyAvatar.success).toBe(true);
    if (emptyAvatar.success) {
      expect(emptyAvatar.data.avatar).toBeNull();
    }

    // Invalid latitude range
    expect(
      registerSchema.safeParse({
        username: 'validuser',
        email: 'test@example.com',
        password: 'password123',
        latitude: 95,
      }).success,
    ).toBe(false);

    // Valid complete registration
    const valid = registerSchema.safeParse({
      username: '  validuser  ',
      email: '  USER@example.com  ',
      password: 'securepassword123',
      avatar: 'https://example.com/avatar.jpg',
      latitude: -23.55052,
      longitude: -46.633308,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.username).toBe('validuser');
      expect(valid.data.email).toBe('user@example.com');
      expect(valid.data.avatar).toBe('https://example.com/avatar.jpg');
      expect(valid.data.latitude).toBe(-23.55052);
      expect(valid.data.longitude).toBe(-46.633308);
    }
  });

  it('public registration never grants a management role', () => {
    const account = { username: 'Teste', email: 'test@example.com', password: 'test-only-password' };
    expect(publicRegisterSchema.parse(account).role).toBe('adopter');
    for (const role of ['admin', 'protector', 'volunteer']) {
      expect(publicRegisterSchema.safeParse({ ...account, role }).success).toBe(false);
    }
  });
});

describe('Google Auth Schema Validation', () => {
  it('should reject missing idToken', () => {
    const result = googleAuthSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty idToken string', () => {
    const result = googleAuthSchema.safeParse({ idToken: '' });
    expect(result.success).toBe(false);
  });

  it('should accept valid idToken', () => {
    const result = googleAuthSchema.safeParse({ idToken: 'valid-google-id-token' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.idToken).toBe('valid-google-id-token');
    }
  });
});
