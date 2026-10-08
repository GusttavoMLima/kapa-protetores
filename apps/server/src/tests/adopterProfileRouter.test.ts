import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AdopterProfileRouter } from '../routes/AdopterProfileRouter';
import { AdopterProfileController } from '../controllers/AdopterProfileController';

describe('AdopterProfileRouter', () => {
  it('should register all expected routes with correct paths and methods', () => {
    const mockController = {
      countAll: () => {},
      getAll: () => {},
      getMe: () => {},
      upsertMe: () => {},
      updateMe: () => {},
      deleteMe: () => {},
      getByPreferences: () => {},
      getByPreference: () => {},
      create: () => {},
      getByUserId: () => {},
      updateByUserId: () => {},
      upsert: () => {},
      deleteByUserId: () => {},
      getById: () => {},
      update: () => {},
      delete: () => {},
    } as unknown as AdopterProfileController;

    const adopterProfileRouter = new AdopterProfileRouter(mockController);

    type RegisteredRoute = { path: string; methods: Record<string, boolean> };

    const registeredRoutes = adopterProfileRouter.router.stack
      .map((layer) => layer.route as unknown as RegisteredRoute | undefined)
      .filter((route): route is RegisteredRoute => route !== undefined)
      .map((route) => ({
        path: route.path,
        methods: Object.keys(route.methods ?? {}),
      }));

    const paths = registeredRoutes.map((r) => r.path);

    assert.ok(paths.includes('/count'), 'Missing /count route');
    assert.ok(paths.includes('/all'), 'Missing /all route');
    assert.ok(paths.includes('/me'), 'Missing /me route');
    assert.ok(paths.includes('/preferences/search'), 'Missing /preferences/search route');
    assert.ok(paths.includes('/preference'), 'Missing /preference route');
    assert.ok(paths.includes('/'), 'Missing / route');
    assert.ok(paths.includes('/user/:id'), 'Missing /user/:id route');
    assert.ok(paths.includes('/:id'), 'Missing /:id route');

    // Verify /me supports GET, PUT, PATCH, DELETE
    const meRoutes = registeredRoutes.filter((r) => r.path === '/me');
    const meMethods = meRoutes.flatMap((r) => r.methods);
    assert.ok(meMethods.includes('get'));
    assert.ok(meMethods.includes('put'));
    assert.ok(meMethods.includes('patch'));
    assert.ok(meMethods.includes('delete'));
  });
});
