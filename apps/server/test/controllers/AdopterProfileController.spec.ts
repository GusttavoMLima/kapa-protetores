import type { Request, Response } from 'express';
import { AdopterProfileController } from '../../src/controllers/AdopterProfileController';
import { AdopterProfileService } from '../../src/services/AdopterProfileService';
import { AdopterProfile } from '../../src/models/AdopterProfile';
import type { ApiResponse, AdopterProfile as SharedAdopterProfile } from '@kapa/shared';

function createMockResponse() {
  let statusCode: number = 200;
  let responseBody: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      responseBody = data;
      return this;
    },
  } as unknown as Response;

  return {
    res,
    getStatusCode: () => statusCode,
    getBody: <T>() => responseBody as ApiResponse<T>,
  };
}

function createSampleProfile(userId = '123e4567-e89b-12d3-a456-426614174000') {
  const profile = new AdopterProfile();
  profile.setId('223e4567-e89b-12d3-a456-426614174001');
  profile.setUserId(userId);
  profile.setPreferredSpecies('dog');
  profile.setPreferredGender('female');
  profile.setPreferredSize(3);
  profile.setCreatedAt(new Date().toISOString());
  profile.setUpdatedAt(new Date().toISOString());
  return profile;
}

describe('AdopterProfileController', () => {
  it('countAll should return 200 with total profile count', async () => {
    const mockService = {
      countAll: async () => 42,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const mockRes = createMockResponse();

    await controller.countAll({} as Request, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<number>();
    expect(body.success).toBe(true);
    expect(body.data).toBe(42);
  });

  it('getAll should return 200 with mapped DTO profiles', async () => {
    const profile = createSampleProfile();
    const mockService = {
      getAll: async () => [profile],
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const mockRes = createMockResponse();

    await controller.getAll({} as Request, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile[]>();
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].preferredSpecies).toBe('dog');
  });

  it('getById should return 200 with profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      getById: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '223e4567-e89b-12d3-a456-426614174001' },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.getById(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('223e4567-e89b-12d3-a456-426614174001');
  });

  it('getById should forward error when param id is invalid', async () => {
    const controller = new AdopterProfileController({} as AdopterProfileService);
    const req = { params: { id: 'invalid-id' } } as unknown as Request;
    let forwardedError: unknown;

    await controller.getById(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
  });

  it('getByUserId should return 200 with profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      getByUserId: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.getByUserId(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.data.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('getByPreferences should return 200 with filtered profiles', async () => {
    const profile = createSampleProfile();
    const mockService = {
      getByPreferences: async () => [profile],
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      body: {
        filters: { preferredSpecies: 'dog' },
      },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.getByPreferences(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile[]>();
    expect(body.data.length).toBe(1);
  });

  it('getByPreference should return 200 with query-based filter', async () => {
    const profile = createSampleProfile();
    let searchedKey: string | undefined;
    let searchedValue: unknown;

    const mockService = {
      getByPreference: async (key: string, value: unknown) => {
        searchedKey = key;
        searchedValue = value;
        return [profile];
      },
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      query: { key: 'preferredSpecies', value: 'dog' },
      body: {},
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.getByPreference(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    expect(searchedKey).toBe('preferredSpecies');
    expect(searchedValue).toBe('dog');
  });

  it('create should return 201 with created profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      create: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      body: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        preferredSpecies: 'dog',
        preferredSize: 3,
      },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.create(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(201);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Profile created with success.');
  });

  it('create should forward error when body is invalid', async () => {
    const controller = new AdopterProfileController({} as AdopterProfileService);
    const req = { body: { userId: 'not-a-uuid' } } as unknown as Request;
    let forwardedError: unknown;

    await controller.create(req, {} as Response, (err) => {
      forwardedError = err;
    });

    expect(forwardedError).toBeDefined();
  });

  it('update should return 200 with updated profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      update: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '223e4567-e89b-12d3-a456-426614174001' },
      body: { preferredEnergy: 4 },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.update(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.message).toBe('Profile updated with success.');
  });

  it('updateByUserId should return 200 with updated profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      updateByUserId: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      body: { livesInApartment: true },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.updateByUserId(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.message).toBe('Profile updated with success.');
  });

  it('upsert should return 200 with saved profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      upsert: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      body: { preferredSpecies: 'cat' },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.upsert(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.message).toBe('Profile saved with success.');
  });

  it('delete should return 200 with deleted profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      delete: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '223e4567-e89b-12d3-a456-426614174001' },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.delete(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.message).toBe('Profile deleted with success.');
  });

  it('deleteByUserId should return 200 with deleted profile DTO', async () => {
    const profile = createSampleProfile();
    const mockService = {
      deleteByUserId: async () => profile,
    } as unknown as AdopterProfileService;

    const controller = new AdopterProfileController(mockService);
    const req = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    } as unknown as Request;
    const mockRes = createMockResponse();

    await controller.deleteByUserId(req, mockRes.res, () => {});

    expect(mockRes.getStatusCode()).toBe(200);
    const body = mockRes.getBody<SharedAdopterProfile>();
    expect(body.message).toBe('Profile deleted with success.');
  });
});
